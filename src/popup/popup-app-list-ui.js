import { debounce } from "./popup-app-shared";
import {
  DEFAULT_POSITION_OPERATION,
  normalizePositionOperation,
  roundValue,
  syncBaselineTransaction,
} from "../common/fundTransactions";

export const listUiMethods = {
  toggleEditMode() {
    if (this.isEdit) {
      this.resetBrowseSort();
      this.syncEditFieldsToFundList();
      this.persistFundStorage({}, () => {
        this.getData();
      });
    }
    this.isEdit = !this.isEdit;
  },
  syncEditFieldsToFundList() {
    const currentDataMap = Array.isArray(this.dataList)
      ? this.dataList.reduce((result, item) => {
          if (item && item.fundcode) {
            result[item.fundcode] = item;
          }
          return result;
        }, {})
      : {};

    this.mapCurrentGroupWorkingFunds((fund) => {
      const currentItem = currentDataMap[fund.code];
      if (!currentItem) {
        return fund;
      }

      const shares = roundValue(currentItem.num, 4);
      const cost = roundValue(currentItem.cost, 4);
      const holdingCost = roundValue(shares * cost, 2);
      const transactions = syncBaselineTransaction(fund, shares, cost);

      return {
        ...fund,
        num: shares,
        cost: cost || undefined,
        holdingCost,
        transactions,
      };
    });
  },
  resetBrowseSort() {
    this.sortType = {
      gszzl: "none",
      amount: "none",
      gains: "none",
      costGains: "none",
      costGainsRate: "none",
    };
    this.sortTypeObj = {
      name: null,
      type: "none",
    };
    chrome.storage.sync.set({
      sortTypeObj: this.sortTypeObj,
    });
  },
  isFocusedFund(fundcode) {
    return !!fundcode && fundcode == this.RealtimeFundcode;
  },
  changeDarkMode() {
    chrome.storage.sync.set({
      darkMode: this.darkMode,
    });
  },
  changeLiveUpdate() {
    chrome.storage.sync.set(
      {
        isLiveUpdate: !this.isLiveUpdate,
      },
      () => {
        this.isLiveUpdate = !this.isLiveUpdate;
        this.checkInterval();
      }
    );
  },
  saveSeci() {
    this.seciList.push(this.sltSeci);
    chrome.storage.sync.set(
      {
        seciList: this.seciList,
      },
      () => {
        this.sltSeci = "";
        this.getIndFundData();
      }
    );
  },
  dltIndFund(ind) {
    this.seciList.splice(ind, 1);
    chrome.storage.sync.set(
      {
        seciList: this.seciList,
      },
      () => {
        this.getIndFundData();
      }
    );
  },
  getIndFundData() {
    let seciListStr = this.seciList.join(",");
    let url =
      "https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=" +
      seciListStr +
      "&_=" +
      new Date().getTime();
    this.$axios
      .get(url)
      .then((res) => {
        this.loadingInd = false;
        this.indFundData = res.data.data.diff;
      })
      .catch((error) => {
        console.log("[popup:getIndFundData] error", error);
        this.loadingInd = false;
      });
  },
  formatCompactGroupBadgeLabel(label = "") {
    if (!label) {
      return "";
    }
    const normalizedLabel = label.replace(/分组$/, "组");
    if (normalizedLabel.length <= 4) {
      return normalizedLabel;
    }
    return `${normalizedLabel.slice(0, 3)}…`;
  },
  buildFundSearchOption(rawFund = {}) {
    const fundCode = rawFund.CODE;
    const existingGroupLabels = this.fundListGroup.reduce((labels, group, index) => {
      const funds = Array.isArray(group && group.funds) ? group.funds : [];
      const hasFund = funds.some((item) => item && item.code == fundCode);
      if (hasFund) {
        labels.push(this.getGroupLabel(group, index));
      }
      return labels;
    }, []);
    const currentGroupLabel = this.activeGroupLabel;
    const existsInCurrentGroup = existingGroupLabels.includes(currentGroupLabel);
    let groupHint = "";
    let groupHintBadge = "";
    let groupHintTitle = "";

    if (existsInCurrentGroup) {
      const otherGroupLabels = existingGroupLabels.filter((label) => label !== currentGroupLabel);
      groupHint = otherGroupLabels.length ? `当前组已存在 · 另 ${otherGroupLabels.length} 组` : "当前组已存在";
      groupHintBadge = "当前组";
      groupHintTitle = otherGroupLabels.length
        ? `当前分组已存在，也在 ${otherGroupLabels.join("、")}`
        : "当前分组已存在";
    } else if (existingGroupLabels.length) {
      groupHint = existingGroupLabels.length === 1 ? `已在${existingGroupLabels[0]}` : `已在${existingGroupLabels.length}组`;
      groupHintBadge =
        existingGroupLabels.length === 1
          ? this.formatCompactGroupBadgeLabel(existingGroupLabels[0])
          : `${existingGroupLabels.length}组`;
      groupHintTitle = `已在 ${existingGroupLabels.join("、")}`;
    }

    return {
      value: fundCode,
      label: rawFund.NAME,
      existsInCurrentGroup,
      existingGroupLabels,
      groupHint,
      groupHintBadge,
      groupHintTitle,
    };
  },
  remoteMethod(query) {
    if (query !== "") {
      this.loading = true;
      let url =
        "https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?&m=9&key=" +
        query +
        "&_=" +
        new Date().getTime();
      this.$axios
        .get(url)
        .then((res) => {
          const fundSearchData = Array.isArray(res.data && res.data.Datas)
            ? res.data.Datas.filter((val) => {
                return !!val.FundBaseInfo;
              })
            : [];
          this.searchOptions = fundSearchData.map((val) => this.buildFundSearchOption(val));
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    } else {
      this.searchOptions = [];
    }
  },
  sortList(type) {
    for (const key in this.sortType) {
      if (this.sortType.hasOwnProperty(key) && key != type) {
        this.sortType[key] = "none";
      }
    }
    this.sortType[type] =
      this.sortType[type] == "desc" ? "asc" : this.sortType[type] == "asc" ? "none" : "desc";
    if (this.sortType[type] == "none") {
      this.dataList = [...this.dataListDft];
    } else {
      this.dataList = this.dataList.sort(this.compare(type, this.sortType[type]));
    }

    if (this.isEdit) {
      const orderedCodes = this.dataList.map((item) => item.fundcode);
      if (orderedCodes.length) {
        const orderMap = orderedCodes.reduce((result, code, index) => {
          result[code] = index;
          return result;
        }, {});

        this.replaceCurrentGroupWorkingFunds(
          [...this.getCurrentGroupWorkingFunds()].sort((left, right) => {
            const leftIndex = Object.prototype.hasOwnProperty.call(orderMap, left.code)
              ? orderMap[left.code]
              : Number.MAX_SAFE_INTEGER;
            const rightIndex = Object.prototype.hasOwnProperty.call(orderMap, right.code)
              ? orderMap[right.code]
              : Number.MAX_SAFE_INTEGER;
            return leftIndex - rightIndex;
          })
        );
        this.persistFundStorage();
      }
    }

    this.sortTypeObj = {
      name: type,
      type: this.sortType[type],
    };
    chrome.storage.sync.set({
      sortTypeObj: this.sortTypeObj,
    });
  },
  compare(property, type) {
    return function(obj1, obj2) {
      var val1 = obj1[property];
      var val2 = obj2[property];
      if (type == "asc") {
        return val1 - val2;
      }
      return val2 - val1;
    };
  },
  getCellPulseClass(fundCode, field) {
    const pulseMap = this.valuePulseMap || {};
    const pulseState = pulseMap[`${fundCode}:${field}`];
    return pulseState ? `cell-pulse-${pulseState}` : "";
  },
  scheduleCellPulse(fundCode, field, previousValue, nextValue) {
    if (!this.valuePulseMap) {
      this.valuePulseMap = {};
    }
    if (!this.valuePulseTimers) {
      this.valuePulseTimers = {};
    }
    const prev = Number(previousValue);
    const next = Number(nextValue);
    if (!Number.isFinite(prev) || !Number.isFinite(next) || prev === next) {
      return;
    }

    const pulseKey = `${fundCode}:${field}`;
    const pulseType = next > prev ? "up" : "down";
    const existingTimer = this.valuePulseTimers[pulseKey];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    this.$set(this.valuePulseMap, pulseKey, pulseType);
    this.$set(
      this.valuePulseTimers,
      pulseKey,
      window.setTimeout(() => {
        this.$delete(this.valuePulseMap, pulseKey);
        this.$delete(this.valuePulseTimers, pulseKey);
      }, 550)
    );
  },
  trackListValueChanges(nextDataList = []) {
    const previousMap = Array.isArray(this.dataListDft)
      ? this.dataListDft.reduce((result, item) => {
          if (item && item.fundcode) {
            result[item.fundcode] = item;
          }
          return result;
        }, {})
      : {};

    ["gsz", "amount", "costGains", "costGainsRate", "gszzl", "gains"].forEach((field) => {
      nextDataList.forEach((item) => {
        if (!item || !item.fundcode || item.hasReplace) {
          return;
        }
        const previousItem = previousMap[item.fundcode];
        if (!previousItem || previousItem.hasReplace) {
          return;
        }
        this.scheduleCellPulse(item.fundcode, field, previousItem[field], item[field]);
      });
    });
  },
  changeNum(item, ind) {
    debounce(() => {
      this.updateCurrentGroupWorkingFund(item.fundcode, (fund) => ({
        ...fund,
        num: item.num,
      }));
      this.persistFundStorage({}, () => {
        this.invalidateHoldingsCache(item.fundcode);
        item.amount = this.calculateMoney(item);
        item.gains = this.calculate(item, item.hasReplace);
        item.costGains = this.calculateCost(item);
        chrome.runtime.sendMessage({ type: "refresh" });
      });
    });
  },
  changeCost(item, ind) {
    debounce(() => {
      this.updateCurrentGroupWorkingFund(item.fundcode, (fund) => ({
        ...fund,
        cost: item.cost,
      }));
      this.persistFundStorage({}, () => {
        this.invalidateHoldingsCache(item.fundcode);
        item.costGains = this.calculateCost(item);
        item.costGainsRate = this.calculateCostRate(item);
      });
    });
  },
  changePositionOperation(item, operation, options = {}) {
    const nextOperation = normalizePositionOperation(operation);
    const shouldPersist = !options || options.persist !== false;
    const shouldInvalidateCache = !options || options.invalidateCache !== false;

    [this.dataList, this.dataListDft].forEach((list) => {
      const target = list.find((fund) => fund.fundcode == item.fundcode);
      if (target) {
        this.$set(target, "positionOperation", nextOperation);
      }
    });

    this.mapCurrentGroupWorkingFunds((fund) => {
      if (fund.code != item.fundcode) {
        return fund;
      }
      return {
        ...fund,
        positionOperation: nextOperation,
      };
    });

    if (shouldPersist) {
      this.persistFundStorage();
    }
    if (shouldInvalidateCache) {
      this.invalidateHoldingsCache(item.fundcode);
    }
  },
  save() {
    if (!Array.isArray(this.fundcode) || !this.fundcode.length) {
      return;
    }

    this.fundcode.forEach((code) => {
      const hasCode = this.getCurrentGroupWorkingFunds().some((item) => item.code == code);
      if (hasCode) {
        return;
      }
      const searchOption = this.searchOptions.find((item) => item.value == code);
      let val = {
        code: code,
        name: searchOption ? searchOption.label : code,
        num: 0,
        transactions: [],
        positionOperation: DEFAULT_POSITION_OPERATION,
      };
      this.appendCurrentGroupWorkingFund(val);
    });

    this.persistFundStorage({}, () => {
      this.fundcode = [];
      this.getData("add");
      chrome.runtime.sendMessage({ type: "refresh" });
    });
  },
  sltInd(val) {
    let code = val.f13 + "." + val.f12;
    if (code == this.RealtimeIndcode) {
      chrome.storage.sync.set(
        {
          RealtimeIndcode: null,
        },
        () => {
          this.RealtimeIndcode = null;
          chrome.runtime.sendMessage({ type: "endInterval" });
        }
      );
    } else {
      chrome.storage.sync.set(
        {
          RealtimeIndcode: code,
        },
        () => {
          this.RealtimeIndcode = code;
          chrome.runtime.sendMessage({ type: "refresh" });
        }
      );
    }
  },
  slt(id) {
    if (id == this.RealtimeFundcode) {
      this.RealtimeFundcode = null;
      this.persistFundStorage(
        {
          RealtimeFundcode: null,
        },
        () => {
          if (this.BadgeContent == 3) {
            chrome.runtime.sendMessage({ type: "endInterval" });
          } else {
            chrome.runtime.sendMessage({ type: "refresh" });
          }
        }
      );
    } else {
      this.RealtimeFundcode = id;
      this.persistFundStorage(
        {
          RealtimeFundcode: id,
        },
        () => {
          chrome.runtime.sendMessage({ type: "refresh" });
        }
      );
    }
  },
  dlt(id) {
    this.invalidateHoldingsCache(id);
    this.removeCurrentGroupWorkingFund(id);

    const shouldClearFocusedFund = this.getCurrentGroupFocusFundCode() == id;

    if (shouldClearFocusedFund) {
      this.RealtimeFundcode = null;
    }

    const shouldRefreshBadge = id == this.RealtimeFundcode || shouldClearFocusedFund;
    if (shouldRefreshBadge) {
      this.RealtimeFundcode = null;
    }

    this.persistFundStorage(
      shouldRefreshBadge
        ? {
            RealtimeFundcode: null,
          }
        : {},
      () => {
        this.dataList = this.dataList.filter(function(ele) {
          return ele.fundcode != id;
        });
        if (shouldRefreshBadge && this.BadgeContent == 3) {
          chrome.runtime.sendMessage({ type: "endInterval" });
        } else if (this.BadgeContent != 3) {
          chrome.runtime.sendMessage({ type: "refresh" });
        }
      }
    );
  },
  handleDragStart(e, item) {
    this.dragging = item;
  },
  handleDragOver(e) {
    e.dataTransfer.dropEffect = "move";
  },
  handleDragEnd(e, item) {
    this.dragging = null;
    if (item.fundcode) {
      this.persistFundStorage();
    } else if (item.f12) {
      chrome.storage.sync.set(
        {
          seciList: this.seciList,
        },
        () => {}
      );
    }
  },
  handleDragEnter(e, item, index) {
    if (this.dragging && this.dragging.fundcode && item.fundcode) {
      e.dataTransfer.effectAllowed = "move";
      if (item.fundcode === this.dragging.fundcode) {
        return;
      }
      const newItems = [...this.getCurrentGroupWorkingFunds()];
      const src = newItems.findIndex((n) => n.code == this.dragging.fundcode);
      const dst = newItems.findIndex((n) => n.code == item.fundcode);
      newItems.splice(dst, 0, ...newItems.splice(src, 1));

      this.replaceCurrentGroupWorkingFunds(newItems);

      const newDataItems = [...this.dataList];
      const dataSrc = newDataItems.findIndex((n) => n.fundcode == this.dragging.fundcode);
      const dataDst = newDataItems.findIndex((n) => n.fundcode == item.fundcode);
      newDataItems.splice(dataDst, 0, ...newDataItems.splice(dataSrc, 1));
      this.dataList = newDataItems;
    } else if (this.dragging && this.dragging.f12 && item.f12) {
      e.dataTransfer.effectAllowed = "move";
      if (item.f12 === this.dragging.f12) {
        return;
      }
      const newIndItems = [...this.seciList];
      const indSrc = newIndItems.findIndex((n) => n.split(".")[1] == this.dragging.f12);
      const indDst = newIndItems.findIndex((n) => n.split(".")[1] == item.f12);
      newIndItems.splice(indDst, 0, ...newIndItems.splice(indSrc, 1));
      this.seciList = newIndItems;

      const newIndDataItems = [...this.indFundData];
      const indDataSrc = newIndDataItems.findIndex((n) => n.f12 == this.dragging.f12);
      const indDataDst = newIndDataItems.findIndex((n) => n.f12 == item.f12);
      newIndDataItems.splice(indDataDst, 0, ...newIndDataItems.splice(indDataSrc, 1));
      this.indFundData = newIndDataItems;
    }
  },
};
