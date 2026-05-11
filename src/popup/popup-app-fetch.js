import {
  FUND_LIST_REQUEST_TIMEOUT,
  extractDateText,
  isSameDayText,
  sortHistoryByDate,
  resolveFundListErrorMessage,
} from "./popup-app-shared";
import {
  createTransactionDraft,
  getTodayText,
  normalizePositionOperation,
} from "../common/fundTransactions";
import { normalizeFundEntry } from "../common/fundSnapshot";
import { deriveAllFundsFromConfig } from "../common/fundStorage";

export const fetchMethods = {
  getFundSnapshotRank(item = {}) {
    const updateDate = extractDateText(item.gztime) || extractDateText(item.jzrq) || item.historyDateText || "";
    return {
      date: updateDate,
      realtime: item.hasReplace ? 0 : 1,
    };
  },
  shouldUseIncomingFundSnapshot(incoming = {}, cached = null) {
    if (!cached) {
      return true;
    }

    const incomingRank = this.getFundSnapshotRank(incoming);
    const cachedRank = this.getFundSnapshotRank(cached);
    if (incomingRank.date > cachedRank.date) {
      return true;
    }
    if (incomingRank.date < cachedRank.date) {
      return false;
    }
    return incomingRank.realtime >= cachedRank.realtime;
  },
  mergeLatestFundSnapshots(dataList = []) {
    if (!this.latestFundSnapshotByCode || typeof this.latestFundSnapshotByCode !== "object") {
      this.latestFundSnapshotByCode = {};
    }

    return dataList.map((item) => {
      const fundCode = String((item && item.fundcode) || "").trim();
      if (!fundCode) {
        return item;
      }

      const cached = this.latestFundSnapshotByCode[fundCode];
      const nextItem = this.shouldUseIncomingFundSnapshot(item, cached)
        ? item
        : {
            ...cached,
            transactions: item.transactions,
            transactionDraft: item.transactionDraft,
            positionOperation: item.positionOperation,
            num: item.num,
            cost: item.cost,
            holdingCost: item.holdingCost,
          };
      this.latestFundSnapshotByCode[fundCode] = {
        ...nextItem,
      };
      return nextItem;
    });
  },
  getData(type, options = {}) {
    const normalizedOptions =
      typeof options === "boolean"
        ? { silent: options }
        : {
            silent: !!(options && options.silent),
          };
    const isSilentRefresh = normalizedOptions.silent && this.dataList.length > 0;
    const currentFunds = this.getCurrentGroupWorkingFunds();
    const sourceFunds = this.gainStatScope === "all"
      ? deriveAllFundsFromConfig(
          {
            fundListGroup: this.fundListGroup,
            fundListM: this.fundListM,
          },
          (fund) => fund
        )
      : currentFunds;
    const fetchFunds = sourceFunds.reduce((list, fund) => {
      const code = String((fund && (fund.code || fund.fundcode)) || "").trim();
      if (!code || list.some((item) => item.code === code)) {
        return list;
      }

      list.push({
        ...fund,
        code,
      });
      return list;
    }, []);
    let fundlist = currentFunds.map((val) => val.code).join(",");
    if (isSilentRefresh) {
      this.refreshingList = true;
    } else {
      this.loadingList = true;
      this.listError = "";
    }
    if (!fundlist) {
      this.loadingList = false;
      this.refreshingList = false;
      this.dataList = [];
      this.dataListDft = [];
      this.gainStatSourceDataList = [];
      this.resetPagination();
      return;
    }
    Promise.all(
      fetchFunds.map((fund) => {
        const estimateUrl = `https://fundgz.1234567.com.cn/js/${fund.code}.js?rt=${new Date().getTime()}`;
        const historyUrl = `https://fundmobapi.eastmoney.com/FundMApi/FundNetDiagram.ashx?FCODE=${fund.code}&RANGE=y&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${new Date().getTime()}`;
        const estimateRequest = this.requestByBackground({
          method: "get",
          url: estimateUrl,
          timeout: FUND_LIST_REQUEST_TIMEOUT,
        })
          .then((res) => res.data)
          .catch(() => null);
        const historyRequest = this.requestByBackground({
          method: "get",
          url: historyUrl,
          timeout: FUND_LIST_REQUEST_TIMEOUT,
        })
          .then((res) => res.data)
          .catch(() => null);

        return Promise.all([estimateRequest, historyRequest]).then(
          ([estimateResponse, historyResponse]) => {
            return {
              fund,
              estimateResponse,
              historyResponse,
            };
          }
        );
      })
    )
      .then((results) => {
        const dataList = results
          .map(({ fund, estimateResponse, historyResponse }) => {
            const historyList = Array.isArray(historyResponse && historyResponse.Datas)
              ? sortHistoryByDate(historyResponse.Datas)
              : [];
            const latest = historyList[historyList.length - 1];

            const estimateData = estimateResponse && estimateResponse.fundcode ? estimateResponse : null;

            const todayText = getTodayText();
            const estimateDateText = extractDateText(estimateData && estimateData.gztime);
            const historyDateText = extractDateText(latest ? latest.FSRQ : "");
            const hasFreshEstimateDate = isSameDayText(estimateDateText, todayText);

            const hasRealtimeEstimate =
              estimateData &&
              estimateData.gztime &&
              hasFreshEstimateDate &&
              !Number.isNaN(parseFloat(estimateData.gsz)) &&
              !Number.isNaN(parseFloat(estimateData.gszzl));

            const estimateDayChangeRate = hasRealtimeEstimate
              ? parseFloat(estimateData.gszzl)
              : Number.NaN;

            const latestNavChangeRate =
              latest && !Number.isNaN(parseFloat(latest.JZZZL))
                ? parseFloat(latest.JZZZL)
                : Number.NaN;

            const resolvedTodayChangeRate = hasRealtimeEstimate
              ? Number.isFinite(estimateDayChangeRate)
                ? estimateDayChangeRate
                : latestNavChangeRate
              : latestNavChangeRate;

            const useRateBasedDayGain =
              hasRealtimeEstimate && Number.isFinite(resolvedTodayChangeRate);

            if (!latest && !hasRealtimeEstimate) {
              return null;
            }

            const normalizedFund = normalizeFundEntry(fund);

            const item = {
              fundcode: fund.code,
              name:
                (fund.name && fund.name != fund.code ? fund.name : null) ||
                (estimateData && estimateData.name) ||
                fund.code,
              jzrq:
                (hasRealtimeEstimate && estimateData && estimateData.jzrq) ||
                (latest ? latest.FSRQ : "--"),
              dwjz:
                hasRealtimeEstimate && estimateData && !Number.isNaN(parseFloat(estimateData.dwjz))
                  ? parseFloat(estimateData.dwjz)
                  : latest && !Number.isNaN(parseFloat(latest.DWJZ))
                  ? parseFloat(latest.DWJZ)
                  : null,
              gsz: hasRealtimeEstimate
                ? parseFloat(estimateData.gsz)
                : latest && !Number.isNaN(parseFloat(latest.DWJZ))
                ? parseFloat(latest.DWJZ)
                : null,
              gszzl: Number.isFinite(resolvedTodayChangeRate) ? resolvedTodayChangeRate : 0,
              todayGainMode: useRateBasedDayGain ? "rate" : "estimate",
              prevGszzl:
                hasRealtimeEstimate && latest && !Number.isNaN(parseFloat(latest.JZZZL))
                  ? parseFloat(latest.JZZZL).toFixed(2)
                  : "",
              gztime:
                (hasRealtimeEstimate && estimateData && estimateData.gztime) ||
                (latest ? latest.FSRQ : "--"),
              estimateDateText,
              historyDateText,
              hasReplace: !hasRealtimeEstimate,
              num: normalizedFund.num,
              cost: normalizedFund.cost,
              holdingCost: normalizedFund.holdingCost,
              transactions: normalizedFund.transactions,
              transactionDraft: createTransactionDraft(),
              positionOperation: normalizePositionOperation(fund.positionOperation),
            };

            item.amount = this.calculateMoney(item);
            item.gains = this.calculate(item, item.hasReplace);
            item.costGains = this.calculateCost(item);
            item.costGainsRate = this.calculateCostRate(item);

            return item;
          })
          .filter(Boolean);

        const mergedDataList = this.mergeLatestFundSnapshots(dataList);
        this.gainStatSourceDataList = mergedDataList;

        const displayDataList = mergedDataList.filter((item) => {
          return currentFunds.some((fund) => fund.code == item.fundcode);
        });

        const fundsToHydrate = currentFunds.filter((fund) => {
          return !fund.name || fund.name == fund.code;
        });

        if (fundsToHydrate.length) {
          this.hydrateFundNames(fundsToHydrate);
        }

        this.mapCurrentGroupWorkingFunds((fund) => {
          const matched = displayDataList.find((item) => item.fundcode == fund.code);
          return matched
            ? {
                ...fund,
                name: matched.name,
              }
            : fund;
        });
        this.persistFundStorage();

        this.latestFundFetchAt = Date.now();

        if (this.showBadge == 1 && this.BadgeContent != 3) {
          chrome.runtime.sendMessage({
            type: "refreshBadgeAllGains",
            data: displayDataList,
          });
        }

        this.dataListDft = [...displayDataList];
        if (type == "add") {
          this.dataList = displayDataList;
        } else if (this.sortTypeObj.type != "none") {
          this.sortType[this.sortTypeObj.name] = this.sortTypeObj.type;
          this.dataList = displayDataList.sort(this.compare(this.sortTypeObj.name, this.sortTypeObj.type));
        } else {
          this.dataList = displayDataList;
        }

        this.trackListValueChanges(this.dataList);

        this.ensurePageInRange();

        if (!this.isPopupShuttingDown) {
          this.prefetchVisibleFundHoldings();
        }
      })
      .catch((error) => {
        if (!isSilentRefresh) {
          this.listError = resolveFundListErrorMessage(error);
        }
      })
      .finally(() => {
        this.loadingList = false;
        this.refreshingList = false;
      });
  },
  hydrateFundNames(fundList) {
    Promise.all(
      fundList.map((fund) => {
        const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=9&key=${fund.code}&_=${new Date().getTime()}`;
        return this.requestByBackground({
          method: "get",
          url,
        })
          .then((res) => {
            const searchList = Array.isArray(res.data && res.data.Datas) ? res.data.Datas : [];
            const matched = searchList.find((item) => item.CODE == fund.code);
            return {
              code: fund.code,
              name: matched && matched.NAME ? matched.NAME : fund.name,
            };
          })
          .catch(() => {
            return {
              code: fund.code,
              name: fund.name,
            };
          });
      })
    ).then((nameResults) => {
      const hasResolvedName = nameResults.some((item) => {
        return item.name && item.name != item.code;
      });

      if (!hasResolvedName) {
        return;
      }

      const nameMap = nameResults.reduce((result, item) => {
        result[item.code] = item.name;
        return result;
      }, {});

      this.mapCurrentGroupWorkingFunds((fund) => {
        const nextName = nameMap[fund.code];
        return nextName && nextName != fund.code
          ? {
              ...fund,
              name: nextName,
            }
          : fund;
      });

      this.dataList = this.dataList.map((item) => {
        const nextName = nameMap[item.fundcode];
        return nextName && nextName != item.fundcode
          ? {
              ...item,
              name: nextName,
            }
          : item;
      });

      this.dataListDft = this.dataListDft.map((item) => {
        const nextName = nameMap[item.fundcode];
        return nextName && nextName != item.fundcode
          ? {
              ...item,
              name: nextName,
            }
          : item;
      });

      this.persistFundStorage();
    });
  },
  populatePreviousDayChanges(fundDataList) {
    fundDataList.forEach((fund) => {
      const url = `https://fundmobapi.eastmoney.com/FundMApi/FundNetDiagram.ashx?FCODE=${fund.FCODE}&RANGE=y&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${new Date().getTime()}`;
      this.requestByBackground({
        method: "get",
        url,
      })
        .then((res) => {
          const historyList = res.data && res.data.Datas ? res.data.Datas : [];
          const prevGszzl = this.getPreviousDayChangeFromHistory(fund, historyList);
          this.applyPreviousDayChange(fund.FCODE, prevGszzl);
        })
        .catch(() => {});
    });
  },
  applyPreviousDayChange(fundcode, prevGszzl) {
    [this.dataList, this.dataListDft].forEach((list) => {
      const target = list.find((item) => item.fundcode == fundcode);
      if (target) {
        this.$set(target, "prevGszzl", prevGszzl);
      }
    });
  },
  getPreviousDayChangeFromHistory(fund, historyList) {
    if (!historyList.length || !fund.PDATE || fund.PDATE == "--") {
      return "";
    }

    const sortedHistoryList = historyList
      .filter((item) => item && item.FSRQ)
      .slice()
      .sort((a, b) => a.FSRQ.localeCompare(b.FSRQ));
    let latestIndex = -1;
    sortedHistoryList.forEach((item, index) => {
      if (item.FSRQ <= fund.PDATE) {
        latestIndex = index;
      }
    });

    if (latestIndex === -1) {
      return "";
    }

    const hasExactDate = sortedHistoryList[latestIndex].FSRQ == fund.PDATE;
    let targetIndex = latestIndex;
    if (hasExactDate && fund.GZTIME && fund.PDATE == fund.GZTIME.substr(0, 10)) {
      targetIndex = latestIndex - 1;
    }

    if (targetIndex < 0 || !sortedHistoryList[targetIndex]) {
      return "";
    }

    const prevGszzl = parseFloat(sortedHistoryList[targetIndex].JZZZL);
    return Number.isNaN(prevGszzl) ? "" : prevGszzl.toFixed(2);
  },
};
