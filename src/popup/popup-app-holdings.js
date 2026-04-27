import {
  HOLDINGS_PREFETCH_CONCURRENCY,
  createHelperTabCancelledError,
  isHelperTabCancelledError,
} from "./popup-app-shared";

export const holdingsMethods = {
  handlePopupShutdown() {
    this.isPopupShuttingDown = true;
    if (this.holdingsPrefetchTimer) {
      window.clearTimeout(this.holdingsPrefetchTimer);
      this.holdingsPrefetchTimer = null;
    }
    Object.values(this.valuePulseTimers || {}).forEach((timer) => {
      window.clearTimeout(timer);
    });
    this.valuePulseTimers = {};
    this.valuePulseMap = {};
    this.ensureHelperTabClosed(true);
  },
  setPopupScrollLock(locked) {
    const root = document.documentElement;
    const body = document.body;
    const app = this.$refs.app;
    const overflowValue = locked ? "hidden" : "";

    if (root) {
      root.style.overflow = overflowValue;
    }

    if (body) {
      body.style.overflow = overflowValue;
    }

    if (app) {
      app.style.overflow = overflowValue;
    }
  },
  cloneHoldingsCacheEntry(entry) {
    if (!entry) {
      return null;
    }

    return {
      ...entry,
      holdings: Array.isArray(entry.holdings) ? entry.holdings.map((item) => ({ ...item })) : [],
      quotes: Array.isArray(entry.quotes) ? entry.quotes.map((item) => ({ ...item })) : [],
      bonds: Array.isArray(entry.bonds) ? entry.bonds.map((item) => ({ ...item })) : [],
      fofs: Array.isArray(entry.fofs) ? entry.fofs.map((item) => ({ ...item })) : [],
    };
  },
  getHoldingsCacheEntry(fundCode) {
    if (!fundCode) {
      return null;
    }
    return this.cloneHoldingsCacheEntry(this.holdingsCacheByFundCode[fundCode]);
  },
  applyCachedHoldingsToSelectedFund(fundCode, debugText = "") {
    const cachedEntry = this.getHoldingsCacheEntry(fundCode);
    if (!cachedEntry) {
      return false;
    }

    this.sltFundHoldings = cachedEntry.holdings;
    this.sltFundHoldingsQuotes = cachedEntry.quotes;
    this.sltFundHoldingsBonds = Array.isArray(cachedEntry.bonds) ? cachedEntry.bonds : [];
    this.sltFundHoldingsFofs = Array.isArray(cachedEntry.fofs) ? cachedEntry.fofs : [];
    this.sltFundHoldingsExpansion = cachedEntry.expansion || null;
    this.sltFundHoldingsLoading = false;
    this.sltFundHoldingsDebug = debugText || cachedEntry.debug || `cache-hit: ${fundCode}`;
    return true;
  },
  setHoldingsCacheEntry(fundCode, payload) {
    const cacheEntry = {
      fundCode,
      fetchedAt: Date.now(),
      holdings: Array.isArray(payload && payload.holdings) ? payload.holdings.map((item) => ({ ...item })) : [],
      quotes: Array.isArray(payload && payload.quotes) ? payload.quotes.map((item) => ({ ...item })) : [],
      bonds: Array.isArray(payload && payload.bonds) ? payload.bonds.map((item) => ({ ...item })) : [],
      fofs: Array.isArray(payload && payload.fofs) ? payload.fofs.map((item) => ({ ...item })) : [],
      expansion: payload ? payload.expansion || null : null,
      debug: payload && payload.debug ? payload.debug : `cached: ${fundCode}`,
    };

    this.$set(this.holdingsCacheByFundCode, fundCode, cacheEntry);
    return this.getHoldingsCacheEntry(fundCode);
  },
  ensureHelperTabClosed(force = false) {
    this.holdingsHelperTabSessionId += 1;
    if (!this.holdingsHelperTabId) {
      this.holdingsHelperTabReady = false;
      this.holdingsHelperTabOwned = false;
      this.holdingsHelperTabPending = null;
      return Promise.resolve();
    }

    if (!force && (!this.holdingsHelperTabOwned || this.holdingsActiveRequestCount > 0)) {
      return Promise.resolve();
    }

    const tabId = this.holdingsHelperTabId;
    this.holdingsHelperTabId = null;
    this.holdingsHelperTabReady = false;
    this.holdingsHelperTabOwned = false;
    this.holdingsHelperTabPending = null;

    return new Promise((resolve) => {
      chrome.tabs.remove(tabId, () => {
        void chrome.runtime.lastError;
        resolve();
      });
    });
  },
  shouldKeepHelperTabOpen() {
    return this.fundDetailVisible && this.holdingsActiveRequestCount > 0;
  },
  findExistingHelperTabs() {
    return new Promise((resolve) => {
      chrome.tabs.query({ url: ["https://*.eastmoney.com/*"] }, (tabs) => {
        if (chrome.runtime.lastError || !Array.isArray(tabs)) {
          resolve([]);
          return;
        }

        const helperTabs = tabs.filter((tab) => {
          return !!(tab && tab.id && tab.url && tab.url.indexOf("fund.eastmoney.com") !== -1);
        });
        resolve(helperTabs);
      });
    });
  },
  normalizeHelperTabs(existingTabs = []) {
    if (!Array.isArray(existingTabs) || !existingTabs.length) {
      return Promise.resolve(null);
    }

    const [primaryTab, ...duplicateTabs] = existingTabs;
    const duplicateIds = duplicateTabs
      .map((tab) => tab && tab.id)
      .filter((tabId) => Number.isInteger(tabId));

    return new Promise((resolve) => {
      if (!duplicateIds.length) {
        resolve(primaryTab);
        return;
      }

      chrome.tabs.remove(duplicateIds, () => {
        void chrome.runtime.lastError;
        resolve(primaryTab);
      });
    });
  },
  withHelperTabReady(options, callback) {
    const normalizedOptions =
      typeof options === "function"
        ? { allowWithoutDetail: false }
        : {
            allowWithoutDetail: !!(options && options.allowWithoutDetail),
          };
    let callbackFn = typeof options === "function" ? options : callback;
    const helperUrl = "https://fund.eastmoney.com/";
    const requestedSessionId = this.holdingsHelperTabSessionId;

    if (this.holdingsHelperTabPending) {
      this.holdingsHelperTabPending
        .then((tabId) => {
          callbackFn(tabId);
        })
        .catch((error) => {
          callbackFn(null, error);
        });
      return;
    }

    const attachAndRun = (tabId, shouldReload) => {
      const run = () => {
        if (
          this.isPopupShuttingDown ||
          requestedSessionId !== this.holdingsHelperTabSessionId ||
          (!normalizedOptions.allowWithoutDetail && !this.fundDetailVisible)
        ) {
          this.holdingsHelperTabId = tabId;
          this.holdingsHelperTabOwned = true;
          this.ensureHelperTabClosed(true);
          callbackFn(null, createHelperTabCancelledError("Helper tab request was cancelled before ready"));
          return;
        }
        this.holdingsHelperTabId = tabId;
        this.holdingsHelperTabReady = true;
        callbackFn(tabId);
      };

      if (!shouldReload) {
        run();
        return;
      }

      const listener = (updatedTabId, changeInfo) => {
        if (updatedTabId !== tabId || changeInfo.status !== "complete") {
          return;
        }
        chrome.tabs.onUpdated.removeListener(listener);
        window.setTimeout(run, 800);
      };

      chrome.tabs.onUpdated.addListener(listener);
      chrome.tabs.update(tabId, { url: helperUrl, active: false, pinned: true }, () => {
        if (chrome.runtime.lastError) {
          chrome.tabs.onUpdated.removeListener(listener);
          this.holdingsHelperTabReady = false;
          callbackFn(null, new Error(chrome.runtime.lastError.message));
        }
      });
    };

    const createHelperTab = () => {
      if (
        requestedSessionId !== this.holdingsHelperTabSessionId ||
        (!normalizedOptions.allowWithoutDetail && !this.fundDetailVisible)
      ) {
        callbackFn(null, createHelperTabCancelledError("Helper tab request was cancelled"));
        return;
      }

      chrome.tabs.create({ url: helperUrl, active: false, pinned: true }, (tab) => {
        if (chrome.runtime.lastError) {
          callbackFn(null, new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!tab || !tab.id) {
          callbackFn(null, new Error("创建东方财富辅助标签失败"));
          return;
        }

        this.holdingsHelperTabId = tab.id;
        this.holdingsHelperTabReady = false;
        this.holdingsHelperTabOwned = true;
        if (
          this.isPopupShuttingDown ||
          requestedSessionId !== this.holdingsHelperTabSessionId ||
          (!normalizedOptions.allowWithoutDetail && !this.fundDetailVisible)
        ) {
          this.ensureHelperTabClosed(true);
          callbackFn(
            null,
            createHelperTabCancelledError("Helper tab request was cancelled before initialization")
          );
          return;
        }
        attachAndRun(tab.id, true);
      });
    };

    const bootstrapHelperTab = () => {
      this.findExistingHelperTabs()
        .then((tabs) => this.normalizeHelperTabs(tabs))
        .then((existingTab) => {
          if (
            requestedSessionId !== this.holdingsHelperTabSessionId ||
            (!normalizedOptions.allowWithoutDetail && !this.fundDetailVisible)
          ) {
            callbackFn(null, createHelperTabCancelledError("Helper tab request was cancelled"));
            return;
          }

          if (existingTab && existingTab.id) {
            this.holdingsHelperTabId = existingTab.id;
            this.holdingsHelperTabReady = false;
            this.holdingsHelperTabOwned = true;
            attachAndRun(existingTab.id, false);
            return;
          }

          createHelperTab();
        })
        .catch((error) => {
          callbackFn(null, error);
        });
    };

    if (this.holdingsHelperTabId) {
      chrome.tabs.get(this.holdingsHelperTabId, (tab) => {
        if (
          chrome.runtime.lastError ||
          !tab ||
          !tab.id ||
          !tab.url ||
          tab.url.indexOf("https://") !== 0 ||
          tab.url.indexOf("eastmoney.com") === -1
        ) {
          this.holdingsHelperTabId = null;
          this.holdingsHelperTabReady = false;
          this.holdingsHelperTabOwned = false;
          createHelperTab();
          return;
        }

        if (this.holdingsHelperTabReady) {
          attachAndRun(tab.id, false);
          return;
        }

        attachAndRun(tab.id, true);
      });
      return;
    }

    this.holdingsHelperTabPending = new Promise((resolve, reject) => {
      const wrappedCallback = (tabId, error) => {
        this.holdingsHelperTabPending = null;
        if (error) {
          reject(error);
          return;
        }
        resolve(tabId);
      };

      const originalCallback = callbackFn;
      const chainedCallback = (tabId, error) => {
        wrappedCallback(tabId, error);
        originalCallback(tabId, error);
      };

      callbackFn = chainedCallback;

      bootstrapHelperTab();
    }).catch((error) => {
      this.holdingsHelperTabPending = null;
      if (isHelperTabCancelledError(error)) {
        return null;
      }
      throw error;
    });
  },
  requestHoldingsViaPageBridge(fundCode, options = {}) {
    this.holdingsActiveRequestCount += 1;
    const allowWithoutDetail = !!(options && options.allowWithoutDetail);

    const requestPromise = new Promise((resolve, reject) => {
      this.withHelperTabReady({ allowWithoutDetail }, (tabId, helperError) => {
        if (helperError) {
          if (isHelperTabCancelledError(helperError)) {
            resolve(null);
            return;
          }
          reject(helperError);
          return;
        }

        if (!tabId) {
          reject(new Error("初始化东方财富辅助标签失败"));
          return;
        }

        const requestId = `holdings-${fundCode}-${Date.now()}`;
        chrome.tabs.sendMessage(
          tabId,
          {
            type: "fetchHoldingsInPage",
            requestId,
            fundCode,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              if (/No tab with id/i.test(chrome.runtime.lastError.message || "")) {
                resolve(null);
                return;
              }
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            if (!response || !response.success) {
              reject(
                new Error(response && response.error ? response.error : "Page bridge request failed")
              );
              return;
            }

            resolve({ data: response.data });
          }
        );
      });
    });
    return requestPromise.finally(() => {
      this.holdingsActiveRequestCount = Math.max(this.holdingsActiveRequestCount - 1, 0);
      if (!this.shouldKeepHelperTabOpen()) {
        this.ensureHelperTabClosed();
      }
    });
  },
  fetchFundHoldingsPayload(fundCode, options = {}) {
    return this.requestHoldingsViaPageBridge(fundCode, options).then((res) => {
      if (!res || !res.data) {
        return {
          holdings: [],
          quotes: [],
          bonds: [],
          fofs: [],
          expansion: null,
          debug: `cancelled: ${fundCode}`,
        };
      }
      const data = res.data;
      const fundStocks =
        data && data.Datas && Array.isArray(data.Datas.fundStocks) ? data.Datas.fundStocks : [];
      const fundBonds =
        data && data.Datas && Array.isArray(data.Datas.fundboods) ? data.Datas.fundboods : [];
      const fundFofs =
        data && data.Datas && Array.isArray(data.Datas.fundfofs) ? data.Datas.fundfofs : [];

      const expansion = data ? data.Expansion : null;
      const debugPrefix = `code=${fundCode} success=${data && data.Success} err=${
        data && (data.ErrCode || data.ErrorCode)
      } expansion=${expansion ? expansion : "none"} holdings=${fundStocks.length} bonds=${fundBonds.length} fofs=${fundFofs.length}`;

      if (!fundStocks.length) {
        return {
          holdings: [],
          quotes: [],
          bonds: fundBonds,
          fofs: fundFofs,
          expansion,
          debug: debugPrefix,
        };
      }

      const gpList = fundStocks.map((item) => `${item.NEWTEXCH}.${item.GPDM}`).join(",");
      const gpUrl = `https://push2.eastmoney.com/api/qt/ulist.np/get?fields=f1,f2,f3,f4,f12,f13,f14,f292&fltt=2&secids=${gpList}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&Uid=`;

      return this.$axios.get(gpUrl).then((resGp) => {
        const quotes =
          resGp.data && resGp.data.data && Array.isArray(resGp.data.data.diff)
            ? resGp.data.data.diff
            : [];

        return {
          holdings: fundStocks,
          quotes,
          bonds: fundBonds,
          fofs: fundFofs,
          expansion,
          debug: `code=${fundCode} quotes=${quotes.length} holdings=${fundStocks.length}`,
        };
      });
    });
  },
  ensureFundHoldingsLoaded(fund, options = {}) {
    const requestedCode = typeof fund === "string" ? fund : fund && (fund.fundcode || fund.code);
    const shouldPopulateSelected = !!options.populateSelected;
    const allowWithoutDetail = !!options.allowWithoutDetail || !shouldPopulateSelected;

    if (this.isPopupShuttingDown) {
      return Promise.reject(new Error("Popup is shutting down"));
    }

    if (!requestedCode) {
      if (shouldPopulateSelected) {
        this.sltFundHoldings = [];
        this.sltFundHoldingsQuotes = [];
        this.sltFundHoldingsBonds = [];
        this.sltFundHoldingsFofs = [];
        this.sltFundHoldingsExpansion = null;
        this.sltFundHoldingsLoading = false;
        this.sltFundHoldingsDebug = "skip: missing fundcode";
      }
      return Promise.resolve(null);
    }

    const cachedEntry = this.getHoldingsCacheEntry(requestedCode);
    if (cachedEntry) {
      if (shouldPopulateSelected && this.sltFund && this.sltFund.fundcode === requestedCode) {
        this.applyCachedHoldingsToSelectedFund(requestedCode, `cache-hit: ${requestedCode}`);
      }
      return Promise.resolve(cachedEntry);
    }

    const inFlightRequest = this.holdingsInFlightByFundCode[requestedCode];
    if (inFlightRequest) {
      if (shouldPopulateSelected) {
        this.activeHoldingsFundCode = requestedCode;
        this.sltFundHoldingsLoading = true;
        this.sltFundHoldingsDebug = `wait-inflight: ${requestedCode}`;
      }
      return inFlightRequest.then((entry) => {
        if (shouldPopulateSelected && this.sltFund && this.sltFund.fundcode === requestedCode) {
          this.applyCachedHoldingsToSelectedFund(requestedCode, `cache-hit: ${requestedCode}`);
        }
        return entry;
      });
    }

    if (shouldPopulateSelected) {
      this.activeHoldingsFundCode = requestedCode;
      this.sltFundHoldingsLoading = true;
      this.sltFundHoldings = [];
      this.sltFundHoldingsQuotes = [];
      this.sltFundHoldingsBonds = [];
      this.sltFundHoldingsFofs = [];
      this.sltFundHoldingsExpansion = null;
      this.sltFundHoldingsDebug = `start: ${requestedCode}`;
    }

    const requestPromise = this.fetchFundHoldingsPayload(requestedCode, {
      allowWithoutDetail,
    })
      .then((payload) => {
        return this.setHoldingsCacheEntry(requestedCode, payload);
      })
      .finally(() => {
        this.$delete(this.holdingsInFlightByFundCode, requestedCode);
        if (this.activeHoldingsFundCode === requestedCode) {
          this.activeHoldingsFundCode = "";
        }
      });

    this.$set(this.holdingsInFlightByFundCode, requestedCode, requestPromise);

    return requestPromise
      .then((entry) => {
        if (shouldPopulateSelected && this.sltFund && this.sltFund.fundcode === requestedCode) {
          this.applyCachedHoldingsToSelectedFund(requestedCode, entry.debug);
        }
        return entry;
      })
      .catch((error) => {
        if (shouldPopulateSelected && this.sltFund && this.sltFund.fundcode === requestedCode) {
          this.sltFundHoldings = [];
          this.sltFundHoldingsQuotes = [];
          this.sltFundHoldingsBonds = [];
          this.sltFundHoldingsFofs = [];
          this.sltFundHoldingsExpansion = null;
          this.sltFundHoldingsLoading = false;
          this.sltFundHoldingsDebug = `error: ${
            error && error.message ? error.message : "unknown"
          }`;
        }
        throw error;
      });
  },
  async fundDetail(val) {
    this.sltFund = val;
    this.marketVisible = false;
    this.fundDetailVisible = true;
    this.activeHoldingsFundCode = "";
    if (!this.applyCachedHoldingsToSelectedFund(val && val.fundcode, `cache-ready: ${val && val.fundcode}`)) {
      this.sltFundHoldings = [];
      this.sltFundHoldingsQuotes = [];
      this.sltFundHoldingsExpansion = null;
      this.sltFundHoldingsDebug = "idle";
    }
    this.sltFundHoldingsLoading = false;
    this.detailShadow = true;
    this.detailKey += 1;
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await this.$nextTick();
      if (this.$refs.fundDetail && typeof this.$refs.fundDetail.init === "function") {
        await this.$refs.fundDetail.init();
        return;
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 16);
      });
    }
  },
  closeCharts() {
    this.fundDetailVisible = false;
    this.popupIndDetailVisible = false;
    this.detailShadow = false;
    this.marketVisible = false;
    this.activeHoldingsFundCode = "";
    this.sltFundHoldingsLoading = false;
    this.sltFundHoldingsBonds = [];
    this.sltFundHoldingsFofs = [];
    this.ensureHelperTabClosed(true);
  },
  invalidateHoldingsCache(fundCode = "") {
    const targetCode = String(fundCode || "").trim();
    if (!targetCode) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(this.holdingsCacheByFundCode, targetCode)) {
      this.$delete(this.holdingsCacheByFundCode, targetCode);
    }
  },
  prefetchVisibleFundHoldings() {
    if (!this.isGetStorage || this.isEdit) {
      return Promise.resolve();
    }

    if (this.isPopupShuttingDown) {
      return Promise.resolve();
    }

    const visibleFunds = Array.isArray(this.displayDataList)
      ? this.displayDataList.filter((item) => item && item.fundcode)
      : [];

    const pendingFunds = visibleFunds.filter((fund) => {
      const fundCode = fund && fund.fundcode;
      return (
        !!fundCode &&
        !this.holdingsCacheByFundCode[fundCode] &&
        !this.holdingsInFlightByFundCode[fundCode]
      );
    });

    if (!pendingFunds.length) {
      return Promise.resolve();
    }

    const workerCount = Math.min(HOLDINGS_PREFETCH_CONCURRENCY, pendingFunds.length);

    const runWorker = async (workerIndex) => {
      for (let cursor = workerIndex; cursor < pendingFunds.length; cursor += workerCount) {
        await this.ensureFundHoldingsLoaded(pendingFunds[cursor]).catch(() => null);
      }
    };

    return Promise.all(Array.from({ length: workerCount }, (_, index) => runWorker(index)));
  },
  prefetchFundHoldings(fund) {
    if (this.isPopupShuttingDown) {
      return;
    }
    this.ensureFundHoldingsLoaded(fund, { populateSelected: true }).catch(() => null);
  },
};
