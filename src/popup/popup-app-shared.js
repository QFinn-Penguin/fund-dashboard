import { roundValue } from "../common/fundTransactions";
export { FUND_TRANSACTIONS_STORAGE_KEY } from "../common/storageKeys";

export const HOLDINGS_PREFETCH_CONCURRENCY = 3;
export const FUND_LIST_REQUEST_TIMEOUT = 12000;
export const HELPER_TAB_CANCELLED_CODES = {
  REQUEST_CANCELLED: true,
};
export function createHelperTabCancelledError(message = "Helper tab request was cancelled") {
  const error = new Error(message);
  error.code = "REQUEST_CANCELLED";
  return error;
}

export function isHelperTabCancelledError(error) {
  return !!(error && HELPER_TAB_CANCELLED_CODES[error.code]);
}

export function extractDateText(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const matchedFullDate = trimmedValue.match(/\d{4}-\d{2}-\d{2}/);
  if (matchedFullDate) {
    return matchedFullDate[0];
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  return "";
}

export function isSameDayText(left, right) {
  return !!left && !!right && left === right;
}

export function sortHistoryByDate(historyList = []) {
  return [...historyList].sort((left, right) => {
    const leftDate = extractDateText(left && left.FSRQ);
    const rightDate = extractDateText(right && right.FSRQ);

    if (!leftDate && !rightDate) {
      return 0;
    }
    if (!leftDate) {
      return -1;
    }
    if (!rightDate) {
      return 1;
    }

    return leftDate.localeCompare(rightDate);
  });
}

export function resolveFundListErrorMessage(error) {
  const errorMessage = String((error && error.message) || "").trim();

  if (!errorMessage) {
    return "基金数据加载失败，请稍后重试。";
  }

  const normalizedMessage = errorMessage.toLowerCase();
  if (normalizedMessage.indexOf("timeout") !== -1) {
    return "基金数据请求超时，请检查网络后重试。";
  }

  if (normalizedMessage.indexOf("network") !== -1) {
    return "基金数据加载失败，请检查当前网络连接。";
  }

  if (normalizedMessage.indexOf("http ") !== -1) {
    return "基金数据接口暂时不可用，请稍后再试。";
  }

  return "基金数据加载失败，请稍后重试。";
}

export function resolveTrendClass(value, stale = false) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || stale || numericValue === 0) {
    return "flat";
  }
  return numericValue > 0 ? "up" : "down";
}

let timeout = null;
export function debounce(fn, wait = 700) {
  if (timeout !== null) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(fn, wait);
}

export const sharedMethods = {
  roundValue(value, digits = 4) {
    return roundValue(value, digits);
  },
  resolveTrendClass(value, stale = false) {
    return resolveTrendClass(value, stale);
  },
  formatTooltip(val) {
    return val + "%";
  },
  calculateMoney(val) {
    let sum = (val.dwjz * val.num).toFixed(2);
    return sum;
  },
  calculate(val, hasReplace) {
    var sum = 0;
    let num = val.num ? val.num : 0;
    if (hasReplace) {
      return "--";
    } else {
      if (Number.isFinite(Number(val.gsz)) && Number.isFinite(Number(val.dwjz))) {
        sum = ((Number(val.gsz) - Number(val.dwjz)) * num).toFixed(2);
      } else if (val.todayGainMode === "rate" && Number.isFinite(Number(val.gszzl)) && Number.isFinite(Number(val.dwjz))) {
        sum = ((Number(val.dwjz) - Number(val.dwjz) / (1 + Number(val.gszzl) * 0.01)) * num).toFixed(2);
      }
    }
    return sum;
  },
  calculateCost(val) {
    if (val.cost) {
      let sum = ((val.dwjz - val.cost) * val.num).toFixed(2);
      return sum;
    } else {
      return 0;
    }
  },
  calculateCostRate(val) {
    if (val.cost && val.cost != 0) {
      let sum = (((val.dwjz - val.cost) / val.cost) * 100).toFixed(2);
      return sum;
    } else {
      return 0;
    }
  },
  formatDisplayTime(item) {
    if (!item) {
      return "--";
    }

    if (item.hasReplace) {
      const staleDate = item.historyDateText || extractDateText(item.jzrq) || extractDateText(item.gztime);
      return staleDate ? staleDate.substr(5, 5) : "--";
    }

    if (!item.gztime) {
      return item && item.jzrq && item.jzrq != "--" ? item.jzrq.substr(5, 5) : "--";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(item.gztime)) {
      return item.gztime.substr(5, 5);
    }

    return item.gztime.substr(11, 5) || item.gztime.substr(10);
  },
  formatMoneyDisplay(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "--";
    }
    return numericValue.toLocaleString("zh", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },
  formatPercentDisplay(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "--";
    }
    return `${numericValue.toFixed(2)}%`;
  },
};
