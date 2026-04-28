import { requestWithBackground } from "./request";

const CACHE_TTL = 5 * 60 * 1000;
const DETAIL_CACHE = new Map();

const PERIOD_DEFINITIONS = [
  { key: "1m", label: "近1月", months: 1 },
  { key: "3m", label: "近3月", months: 3 },
  { key: "6m", label: "近6月", months: 6 },
  { key: "1y", label: "近1年", years: 1 },
];

const BENCHMARK_NAME_FIELDS = [
  "PERFBENCHMARK",
  "PERF_BENCHMARK",
  "PERFORMANCEBENCHMARK",
  "COMPAREBENCHMARK",
  "BENCHMARK",
  "YJBJ",
  "JYBJ",
  "INDEXNAME",
];

const FEE_FIELD_GROUPS = {
  managementFee: ["MANAGEFEE", "GLFEE", "JJGLF", "GLFL", "MANAGERATE"],
  custodyFee: ["CUSTODYFEE", "TGFEE", "TGFL", "TRUSTEEFEE"],
  serviceFee: ["SERVICEFEE", "SALEFEE", "XSFWF", "SALESERVICEFEE"],
  redemptionFee: ["REDEEMFEE", "SHUHUILV", "SHFEE", "REDEMPTIONFEE"],
};

const ARCHIVE_FIELD_MATCHERS = {
  managementFee: /管理费率[\s\S]*?<td[^>]*>([^<]+)<\/td>/,
  custodyFee: /托管费率[\s\S]*?<td[^>]*>([^<]+)<\/td>/,
  serviceFee: /销售服务费率[\s\S]*?<td[^>]*>([^<]+)<\/td>/,
  subscribeFee: /最高认购费率[\s\S]*?<td[^>]*>([^<]+)<\/td>/,
  purchaseFee: /最高申购费率[\s\S]*?<td[^>]*>([^<]+)<\/td>/,
  redemptionFee: /最高赎回费率[\s\S]*?<td[^>]*>([^<]+)<\/td>/,
  officialBenchmark: /业绩比较基准[\s\S]*?<td[^>]*>([^<]+)<\/td>/,
  trackingTarget: /跟踪标的[\s\S]*?<td[^>]*>([^<]+)<\/td>/,
  riskStatement: /(本基金为[^。]+。)/,
};

function getCacheKey(type, fundCode, range = "") {
  return `${type}:${fundCode}:${range}`;
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === "object") {
        return { ...item };
      }
      return item;
    });
  }
  if (value && typeof value === "object") {
    return { ...value };
  }
  return value;
}

function fetchWithCache({ key, url, transform }) {
  const now = Date.now();
  const cached = DETAIL_CACHE.get(key);
  if (cached && cached.data && now - cached.timestamp < CACHE_TTL) {
    return Promise.resolve(cloneValue(cached.data));
  }
  if (cached && cached.promise) {
    return cached.promise.then((data) => cloneValue(data));
  }

  const promise = requestWithBackground({
    method: "get",
    url,
  })
    .then((res) => {
      const nextData = typeof transform === "function" ? transform(res && res.data) : res && res.data;
      DETAIL_CACHE.set(key, {
        data: nextData,
        timestamp: Date.now(),
      });
      return nextData;
    })
    .catch((error) => {
      DETAIL_CACHE.delete(key);
      throw error;
    });

  DETAIL_CACHE.set(key, {
    promise,
    timestamp: now,
  });

  return promise.then((data) => cloneValue(data));
}

export function fetchFundBaseInfo(fundCode) {
  const key = getCacheKey("base", fundCode);
  const url = `https://fundmobapi.eastmoney.com/FundMApi/FundBaseTypeInformation.ashx?FCODE=${fundCode}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${Date.now()}`;
  return fetchWithCache({
    key,
    url,
    transform(data) {
      return data && data.Datas ? data.Datas : {};
    },
  });
}

export function fetchFundNetDiagram(fundCode, range = "n") {
  const key = getCacheKey("net", fundCode, range);
  const url = `https://fundmobapi.eastmoney.com/FundMApi/FundNetDiagram.ashx?FCODE=${fundCode}&RANGE=${range}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${Date.now()}`;
  return fetchWithCache({
    key,
    url,
    transform(data) {
      return Array.isArray(data && data.Datas) ? data.Datas : [];
    },
  });
}

export function fetchFundYieldDiagram(fundCode, range = "n") {
  const key = getCacheKey("yield", fundCode, range);
  const url = `https://fundmobapi.eastmoney.com/FundMApi/FundYieldDiagramNew.ashx?FCODE=${fundCode}&RANGE=${range}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${Date.now()}`;
  return fetchWithCache({
    key,
    url,
    transform(data) {
      return {
        dataList: Array.isArray(data && data.Datas) ? data.Datas : [],
        expansion: (data && data.Expansion) || {},
      };
    },
  });
}

export function fetchFundArchiveHtml(fundCode) {
  const key = getCacheKey("archive", fundCode);
  const url = `https://fundf10.eastmoney.com/jbgk_${fundCode}.html?_=${Date.now()}`;
  return fetchWithCache({
    key,
    url,
    transform(data) {
      return typeof data === "string" ? data : "";
    },
  });
}

export function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeDateText(value) {
  if (!value) {
    return "";
  }
  return String(value).trim().slice(0, 10);
}

function parseDate(value) {
  const dateText = normalizeDateText(value);
  if (!dateText) {
    return null;
  }
  const nextDate = new Date(`${dateText}T00:00:00`);
  return Number.isNaN(nextDate.getTime()) ? null : nextDate;
}

function shiftDate(baseDate, { months = 0, years = 0 }) {
  const nextDate = new Date(baseDate.getTime());
  if (months) {
    nextDate.setMonth(nextDate.getMonth() - months);
  }
  if (years) {
    nextDate.setFullYear(nextDate.getFullYear() - years);
  }
  return nextDate;
}

function compareDateText(a, b) {
  return normalizeDateText(a).localeCompare(normalizeDateText(b));
}

function sortByDate(list, dateKey) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item && item[dateKey])
    .slice()
    .sort((left, right) => compareDateText(left[dateKey], right[dateKey]));
}

export function normalizeNetHistory(historyList = []) {
  return sortByDate(historyList, "FSRQ")
    .map((item) => {
      const nav = parseNumber(item.DWJZ);
      const accumNav = parseNumber(item.LJJZ);
      return {
        date: normalizeDateText(item.FSRQ),
        nav,
        accumNav,
        dayChangeRate: parseNumber(item.JZZZL),
      };
    })
    .filter((item) => item.date && item.nav !== null);
}

export function normalizeYieldHistory(yieldList = []) {
  return sortByDate(yieldList, "PDATE")
    .map((item) => {
      return {
        date: normalizeDateText(item.PDATE),
        fundYield: parseNumber(item.YIELD),
        benchmarkYield: parseNumber(item.INDEXYIED),
        benchmarkTypeYield: parseNumber(item.FUNDTYPEYIED),
      };
    })
    .filter((item) => item.date && item.fundYield !== null);
}

function getLatestPoint(points = []) {
  return points.length ? points[points.length - 1] : null;
}

function getPointAtOrBefore(points, targetDate) {
  if (!targetDate) {
    return null;
  }
  let matched = null;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const currentDate = parseDate(current && current.date);
    if (!currentDate) {
      continue;
    }
    if (currentDate.getTime() <= targetDate.getTime()) {
      matched = current;
    } else {
      break;
    }
  }
  return matched;
}

function classifyMissingWindow(points, years) {
  if (!points.length) {
    return "missing";
  }
  if (points.length < 2) {
    return "insufficient";
  }
  const latestPoint = points[points.length - 1];
  const latestDate = parseDate(latestPoint.date);
  if (!latestDate) {
    return "insufficient";
  }
  const targetDate = shiftDate(latestDate, { years });
  const earliestDate = parseDate(points[0].date);
  if (!earliestDate) {
    return "insufficient";
  }
  return earliestDate.getTime() > targetDate.getTime() ? "sinceInception" : "full";
}

export function computeMaxDrawdown(historyList = [], years = 1) {
  const points = normalizeNetHistory(historyList);
  const windowMode = classifyMissingWindow(points, years);
  if (windowMode === "missing") {
    return {
      value: null,
      status: "missing",
      label: years === 1 ? "近1年最大回撤" : `近${years}年最大回撤`,
      scopeLabel: "暂无足够数据",
      asOfDate: "--",
    };
  }
  if (windowMode === "insufficient") {
    return {
      value: null,
      status: "insufficient",
      label: years === 1 ? "近1年最大回撤" : `近${years}年最大回撤`,
      scopeLabel: "暂无足够数据",
      asOfDate: normalizeDateText(getLatestPoint(points) && getLatestPoint(points).date) || "--",
    };
  }

  const latestPoint = getLatestPoint(points);
  const latestDate = parseDate(latestPoint.date);
  const targetDate = shiftDate(latestDate, { years });
  const scopedPoints =
    windowMode === "sinceInception"
      ? points
      : points.filter((item) => {
          const currentDate = parseDate(item.date);
          return currentDate && currentDate.getTime() >= targetDate.getTime();
        });

  if (scopedPoints.length < 2) {
    return {
      value: null,
      status: "insufficient",
      label: years === 1 ? "近1年最大回撤" : `近${years}年最大回撤`,
      scopeLabel: windowMode === "sinceInception" ? "成立以来" : "暂无足够数据",
      asOfDate: normalizeDateText(latestPoint.date) || "--",
    };
  }

  let peakValue = scopedPoints[0].nav;
  let peakDate = scopedPoints[0].date;
  let maxDrawdown = 0;
  let troughDate = scopedPoints[0].date;

  scopedPoints.forEach((item) => {
    if (item.nav > peakValue) {
      peakValue = item.nav;
      peakDate = item.date;
    }
    if (!peakValue) {
      return;
    }
    const drawdown = (peakValue - item.nav) / peakValue;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      troughDate = item.date;
    }
  });

  return {
    value: +(maxDrawdown * 100).toFixed(2),
    status: "ok",
    label: years === 1 ? "近1年最大回撤" : `近${years}年最大回撤`,
    scopeLabel: windowMode === "sinceInception" ? "成立以来" : years === 1 ? "近1年" : `近${years}年`,
    asOfDate: normalizeDateText(latestPoint.date) || "--",
    peakDate,
    troughDate,
    windowMode,
  };
}

export function buildRiskSummary(drawdownValue) {
  if (drawdownValue === null) {
    return "暂无足够数据判断风险水平";
  }
  if (drawdownValue < 10) {
    return "历史回撤相对可控";
  }
  if (drawdownValue < 20) {
    return "历史回撤中等，需结合持有周期判断";
  }
  return "历史回撤较大，短期波动承受能力不足的用户需谨慎";
}

function computeRelativeReturn(latestValue, anchorValue) {
  if (latestValue === null || anchorValue === null) {
    return null;
  }
  const latestFactor = 1 + latestValue / 100;
  const anchorFactor = 1 + anchorValue / 100;
  if (anchorFactor === 0) {
    return null;
  }
  return +(((latestFactor / anchorFactor) - 1) * 100).toFixed(2);
}

export function computePeriodReturns(yieldList = [], periodDefinitions = PERIOD_DEFINITIONS) {
  const points = normalizeYieldHistory(yieldList);
  const latestPoint = getLatestPoint(points);
  if (!latestPoint) {
    return periodDefinitions.map((period) => ({
      key: period.key,
      label: period.label,
      fund: null,
      benchmark: null,
      excess: null,
    }));
  }

  const latestDate = parseDate(latestPoint.date);
  return periodDefinitions.map((period) => {
    const targetDate = shiftDate(latestDate, period);
    const anchorPoint = getPointAtOrBefore(points, targetDate);
    const fundReturn = computeRelativeReturn(latestPoint.fundYield, anchorPoint && anchorPoint.fundYield);
    const benchmarkReturn = computeRelativeReturn(
      latestPoint.benchmarkYield,
      anchorPoint && anchorPoint.benchmarkYield
    );
    return {
      key: period.key,
      label: period.label,
      fund: fundReturn,
      benchmark: benchmarkReturn,
      excess:
        fundReturn !== null && benchmarkReturn !== null ? +(fundReturn - benchmarkReturn).toFixed(2) : null,
    };
  });
}

function pickFirstField(source, keys, parser = null) {
  if (!source) {
    return null;
  }
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const rawValue = source[key];
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue;
    }
    return typeof parser === "function" ? parser(rawValue) : rawValue;
  }
  return null;
}

export function resolveBenchmarkName(baseInfo = {}, yieldExpansion = {}) {
  const officialName = pickFirstField(baseInfo, BENCHMARK_NAME_FIELDS, (value) => String(value).trim());
  const referenceName = pickFirstField(yieldExpansion, ["INDEXNAME"], (value) => String(value).trim());
  if (officialName && referenceName && officialName === referenceName) {
    return {
      name: officialName,
      type: "official",
    };
  }
  if (referenceName) {
    return {
      name: referenceName,
      type: officialName ? "reference" : "reference",
    };
  }
  if (officialName) {
    return {
      name: officialName,
      type: "officialNameOnly",
    };
  }
  return {
    name: "",
    type: "none",
  };
}

function normalizeFeeValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const text = String(value).trim();
  if (!text || text === "--") {
    return null;
  }
  if (text.indexOf("%") >= 0) {
    return text;
  }
  const parsed = parseNumber(text);
  if (parsed === null) {
    return text;
  }
  return `${parsed.toFixed(2)}%`;
}

function withFallbackDisplay(value, fallbackText = "未获取到") {
  return value || fallbackText;
}

function cleanArchiveText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isExplicitNotApplicableFee(value) {
  if (value === null || value === undefined) {
    return false;
  }
  const text = String(value).trim();
  if (!text) {
    return false;
  }
  return /不适用|不收取|免收/i.test(text);
}

export function parseArchiveHtml(archiveHtml = "") {
  const html = String(archiveHtml || "");
  return Object.keys(ARCHIVE_FIELD_MATCHERS).reduce((result, key) => {
    const matched = html.match(ARCHIVE_FIELD_MATCHERS[key]);
    result[key] = matched ? cleanArchiveText(matched[1] || matched[0]) : "";
    return result;
  }, {});
}

export function buildFeeInfo(baseInfo = {}, archiveData = {}) {
  const managementFee = normalizeFeeValue(pickFirstField(baseInfo, FEE_FIELD_GROUPS.managementFee));
  const custodyFee = normalizeFeeValue(pickFirstField(baseInfo, FEE_FIELD_GROUPS.custodyFee));
  const serviceFeeRaw = normalizeFeeValue(pickFirstField(baseInfo, FEE_FIELD_GROUPS.serviceFee));
  const archiveServiceFee = normalizeFeeValue(archiveData.serviceFee) || archiveData.serviceFee || "";
  const purchaseRate = normalizeFeeValue(baseInfo.RATE);
  const purchaseSourceRate = normalizeFeeValue(baseInfo.SOURCERATE);
  const redemptionFee = normalizeFeeValue(pickFirstField(baseInfo, FEE_FIELD_GROUPS.redemptionFee));

  let purchaseFeeText = "未获取到";
  if (purchaseRate && purchaseSourceRate && purchaseRate !== purchaseSourceRate) {
    purchaseFeeText = `${purchaseRate}（原费率 ${purchaseSourceRate}）`;
  } else if (purchaseRate) {
    purchaseFeeText = purchaseRate;
  } else if (purchaseSourceRate) {
    purchaseFeeText = purchaseSourceRate;
  }

  const resolvedServiceFee = serviceFeeRaw || archiveServiceFee;
  const serviceFee = resolvedServiceFee
    ? isExplicitNotApplicableFee(resolvedServiceFee)
      ? "不适用"
      : resolvedServiceFee
    : "未获取到";

  return {
    managementFee: withFallbackDisplay(managementFee || archiveData.managementFee),
    custodyFee: withFallbackDisplay(custodyFee || archiveData.custodyFee),
    serviceFee,
    purchaseFeeText: archiveData.purchaseFee || purchaseFeeText,
    redemptionFeeText: archiveData.redemptionFee || redemptionFee || "未获取到",
    note: "费率会影响长期持有收益，建议结合收益与风险一起看",
  };
}

export function buildBenchmarkInfo({ baseInfo = {}, archiveData = {}, yieldResponse = null } = {}) {
  const response = yieldResponse || { dataList: [], expansion: {} };
  const periodRows = computePeriodReturns(response.dataList || []);
  const hasAnyData = periodRows.some((item) => item.fund !== null || item.benchmark !== null || item.excess !== null);
  const latestPoint = getLatestPoint(normalizeYieldHistory(response.dataList || []));
  const officialName = archiveData.officialBenchmark || pickFirstField(baseInfo, BENCHMARK_NAME_FIELDS, (value) => String(value).trim()) || "";
  const referenceName = pickFirstField(response.expansion || {}, ["INDEXNAME"], (value) => String(value).trim()) || "";
  const usesReferenceBenchmark = hasAnyData;
  const name = usesReferenceBenchmark
    ? referenceName || "参考基准"
    : officialName || "暂无可用基准数据";
  const type = usesReferenceBenchmark ? "reference" : officialName ? "officialNameOnly" : "none";
  const typeLabel = usesReferenceBenchmark
    ? officialName && officialName !== name
      ? "参考基准（已降级）"
      : "参考基准"
    : officialName
    ? "业绩比较基准（仅名称）"
    : "暂无可用基准数据";
  const note = usesReferenceBenchmark
    ? officialName && officialName !== name
      ? `正式业绩比较基准为“${officialName}”，但暂未获取对应收益序列；以下对比降级使用参考基准，仅供辅助判断`
      : "以下对比基于参考基准，仅供辅助判断"
    : officialName
    ? "已获取业绩比较基准名称，但暂无可用基准收益数据"
    : "暂无可用基准数据";

  return {
    name,
    type,
    typeLabel,
    rows: periodRows,
    hasAnyData,
    asOfDate: latestPoint ? latestPoint.date : "--",
    note,
    officialName,
    referenceName,
  };
}

export function buildTrustMeta({ fund = {}, benchmarkInfo = {}, holdingsExpansion = "" } = {}) {
  const hasRealtimeEstimate = !fund.hasReplace && fund.gztime;
  const usesReferenceBenchmark = benchmarkInfo && benchmarkInfo.type === "reference";
  const hasOfficialNameOnly = benchmarkInfo && benchmarkInfo.type === "officialNameOnly";
  return {
    estimateLabel: hasRealtimeEstimate ? "盘中估值" : "正式净值",
    estimateDescription: hasRealtimeEstimate
      ? "盘中估值为实时估算值，可能与最终正式净值存在差异"
      : "当前未获取到有效盘中估值，页面头部已回退为最近正式净值",
    historyDescription: "历史净值、累计收益、最大回撤等指标基于正式净值或历史披露数据",
    holdingsDisclosureDate: normalizeDateText(holdingsExpansion) || "--",
    benchmarkDescription:
      usesReferenceBenchmark
        ? benchmarkInfo.officialName && benchmarkInfo.officialName !== benchmarkInfo.name
          ? "当前收益对比已降级为参考基准，正式业绩比较基准请以上方说明为准"
          : "当前对比使用参考基准，仅供辅助判断"
        : hasOfficialNameOnly
        ? "当前已展示业绩比较基准名称，但暂无可用基准收益数据"
        : "当前暂无可用基准对比数据",
    estimateUpdatedAt: fund && fund.gztime ? fund.gztime : "--",
    navUpdatedAt: fund && fund.jzrq ? fund.jzrq : "--",
  };
}

export function buildRiskInfo({ historyList = [], baseInfo = {}, archiveData = {} } = {}) {
  const oneYearDrawdown = computeMaxDrawdown(historyList, 1);
  const threeYearDrawdown = computeMaxDrawdown(historyList, 3);
  const latestValue = oneYearDrawdown.value !== null ? oneYearDrawdown.value : threeYearDrawdown.value;

  return {
    oneYearDrawdown,
    threeYearDrawdown,
    summary: buildRiskSummary(latestValue),
    riskLevelLabel: archiveData.riskLevel || (baseInfo.RISKLEVEL ? `风险等级 ${baseInfo.RISKLEVEL}` : ""),
    riskStatement: archiveData.riskStatement || "",
    asOfDate: oneYearDrawdown.asOfDate !== "--" ? oneYearDrawdown.asOfDate : threeYearDrawdown.asOfDate,
  };
}

export function formatPercentDisplay(value, digits = 2, fallback = "--") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const parsed = parseNumber(value);
  if (parsed === null) {
    return fallback;
  }
  return `${parsed.toFixed(digits)}%`;
}

export function formatValueDisplay(value, digits = 3, fallback = "--") {
  const parsed = parseNumber(value);
  if (parsed === null) {
    return fallback;
  }
  return parsed.toFixed(digits);
}

export function buildBenchmarkOverlaySeries(historyList = [], yieldList = [], fallbackLabel = "参考基准") {
  const netPoints = normalizeNetHistory(historyList);
  const yieldPoints = normalizeYieldHistory(yieldList);
  if (!netPoints.length || !yieldPoints.length) {
    return {
      hasBenchmark: false,
      xAxis: [],
      fundSeries: [],
      benchmarkSeries: [],
      benchmarkLabel: fallbackLabel,
    };
  }

  const fundByDate = netPoints.reduce((result, item) => {
    result[item.date] = item;
    return result;
  }, {});
  const baselinePoint = netPoints[0];
  const baselineNav = baselinePoint ? baselinePoint.nav : null;
  if (baselineNav === null) {
    return {
      hasBenchmark: false,
      xAxis: [],
      fundSeries: [],
      benchmarkSeries: [],
      benchmarkLabel: fallbackLabel,
    };
  }

  const xAxis = [];
  const fundSeries = [];
  const benchmarkSeries = [];
  let lastFundPoint = null;

  yieldPoints.forEach((item) => {
    const matchedFundPoint = fundByDate[item.date] || lastFundPoint;
    if (!matchedFundPoint || item.benchmarkYield === null) {
      return;
    }
    lastFundPoint = matchedFundPoint;
    xAxis.push(item.date);
    fundSeries.push(matchedFundPoint.nav);
    benchmarkSeries.push(+((1 + item.benchmarkYield / 100) * baselineNav).toFixed(4));
  });

  return {
    hasBenchmark: benchmarkSeries.length > 1,
    xAxis,
    fundSeries,
    benchmarkSeries,
    benchmarkLabel: fallbackLabel,
  };
}

export function getPeriodDefinitions() {
  return PERIOD_DEFINITIONS.slice();
}
