import {
  buildBenchmarkInfo,
  buildFeeInfo,
  buildRiskInfo,
  buildTrustMeta,
  fetchFundArchiveHtml,
  fetchFundBaseInfo,
  fetchFundNetDiagram,
  fetchFundYieldDiagram,
  normalizeNetHistory,
  normalizeYieldHistory,
  parseArchiveHtml,
} from "./fundDetailEnhance";

export const DEFAULT_COMPARISON_RANGE = "n";
export const DEFAULT_COMPARISON_CONCURRENCY = 3;

const CORE_FIELDS = ["baseInfo", "netHistory", "yieldHistory", "archiveData"];
const DERIVED_FIELDS = ["riskInfo", "benchmarkInfo", "feeInfo", "trustMeta"];

export function normalizeFundCodes(codes = []) {
  const seenCodes = new Set();
  return (Array.isArray(codes) ? codes : [])
    .map((code) => String(code || "").trim())
    .filter((code) => {
      if (!code || seenCodes.has(code)) {
        return false;
      }
      seenCodes.add(code);
      return true;
    });
}

function normalizeConcurrency(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.max(1, Math.floor(numericValue))
    : DEFAULT_COMPARISON_CONCURRENCY;
}

function mapWithConcurrency(items, limit, mapper) {
  const normalizedLimit = normalizeConcurrency(limit);
  const results = new Array(items.length);
  let nextIndex = 0;

  function runNext() {
    const currentIndex = nextIndex;
    nextIndex += 1;

    if (currentIndex >= items.length) {
      return Promise.resolve();
    }

    return Promise.resolve(mapper(items[currentIndex], currentIndex))
      .then((result) => {
        results[currentIndex] = result;
      })
      .then(runNext);
  }

  const workers = Array.from(
    { length: Math.min(normalizedLimit, items.length) },
    () => runNext()
  );

  return Promise.all(workers).then(() => results);
}

function formatComparisonError(name, error) {
  const message = error && error.message ? `: ${error.message}` : "";
  return `${name} request failed${message}`;
}

function wrapComparisonRequest(name, promise, fallbackValue) {
  return promise
    .then((value) => ({
      ok: true,
      value,
      error: null,
    }))
    .catch((error) => ({
      ok: false,
      value: fallbackValue,
      error: formatComparisonError(name, error),
    }));
}

function hasObjectData(value) {
  return !!(value && typeof value === "object" && Object.keys(value).length);
}

function hasListData(value) {
  return Array.isArray(value) && value.length > 0;
}

function buildMissingFields(data) {
  const missingFields = [];

  if (!hasObjectData(data.baseInfo)) {
    missingFields.push("baseInfo");
  }
  if (!hasListData(data.netHistory)) {
    missingFields.push("netHistory");
  }
  if (!hasListData(data.yieldHistory)) {
    missingFields.push("yieldHistory");
  }
  if (!hasObjectData(data.archiveData)) {
    missingFields.push("archiveData");
  }
  DERIVED_FIELDS.forEach((field) => {
    if (!data[field]) {
      missingFields.push(field);
    }
  });

  return missingFields;
}

function buildComparisonWarnings(benchmarkInfo = {}) {
  const warnings = [];

  if (
    benchmarkInfo.type === "reference" &&
    benchmarkInfo.officialName &&
    benchmarkInfo.name &&
    benchmarkInfo.officialName !== benchmarkInfo.name
  ) {
    warnings.push("基准已降级为参考基准");
  }

  if (benchmarkInfo.type === "officialNameOnly") {
    warnings.push("基准收益数据缺失");
  }

  return warnings;
}

function resolveComparisonStatus({ coreAvailableCount, missingFields, warnings }) {
  if (coreAvailableCount === 0) {
    return "failed";
  }
  if (missingFields.length || warnings.length) {
    return "partial";
  }
  return "ok";
}

function buildSummary(items) {
  return items.reduce(
    (summary, item) => {
      summary.total += 1;
      if (item.status === "ok") {
        summary.ok += 1;
      } else if (item.status === "partial") {
        summary.partial += 1;
      } else if (item.status === "failed") {
        summary.failed += 1;
      }
      return summary;
    },
    {
      total: 0,
      ok: 0,
      partial: 0,
      failed: 0,
    }
  );
}

export function aggregateSingleFundComparisonData(code, options = {}) {
  const range = options.range || DEFAULT_COMPARISON_RANGE;
  const includeRaw = !!options.includeRaw;

  return Promise.all([
    wrapComparisonRequest("baseInfo", fetchFundBaseInfo(code), {}),
    wrapComparisonRequest("netHistory", fetchFundNetDiagram(code, range), []),
    wrapComparisonRequest("yieldHistory", fetchFundYieldDiagram(code, range), {
      dataList: [],
      expansion: {},
    }),
    wrapComparisonRequest("archiveData", fetchFundArchiveHtml(code), ""),
  ]).then(([baseResult, netResult, yieldResult, archiveResult]) => {
    const baseInfo = baseResult.value || {};
    const netRawHistory = netResult.value || [];
    const yieldResponse = yieldResult.value || { dataList: [], expansion: {} };
    const archiveHtml = archiveResult.value || "";
    const archiveData = parseArchiveHtml(archiveHtml);
    const netHistory = normalizeNetHistory(netRawHistory);
    const yieldHistory = normalizeYieldHistory(yieldResponse.dataList || []);

    const errors = [baseResult, netResult, yieldResult, archiveResult]
      .filter((result) => !result.ok && result.error)
      .map((result) => result.error);

    const coreAvailableCount = CORE_FIELDS.reduce((count, field) => {
      if (field === "baseInfo" && hasObjectData(baseInfo)) {
        return count + 1;
      }
      if (field === "netHistory" && hasListData(netHistory)) {
        return count + 1;
      }
      if (field === "yieldHistory" && hasListData(yieldHistory)) {
        return count + 1;
      }
      if (field === "archiveData" && hasObjectData(archiveData)) {
        return count + 1;
      }
      return count;
    }, 0);

    if (coreAvailableCount === 0) {
      return {
        code,
        status: "failed",
        missingFields: CORE_FIELDS.concat(DERIVED_FIELDS),
        warnings: [],
        errors,
        baseInfo: null,
        archiveData: null,
        netHistory: [],
        yieldHistory: [],
        riskInfo: null,
        benchmarkInfo: null,
        feeInfo: null,
        trustMeta: null,
      };
    }

    const riskInfo = buildRiskInfo({
      historyList: netRawHistory,
      baseInfo,
      archiveData,
    });
    const benchmarkInfo = buildBenchmarkInfo({
      baseInfo,
      archiveData,
      yieldResponse,
    });
    const feeInfo = buildFeeInfo(baseInfo, archiveData);
    const trustMeta = buildTrustMeta({
      fund: {
        fundcode: code,
      },
      benchmarkInfo,
    });

    const comparisonItem = {
      code,
      status: "ok",
      missingFields: [],
      warnings: buildComparisonWarnings(benchmarkInfo),
      errors,
      baseInfo,
      archiveData,
      netHistory,
      yieldHistory,
      riskInfo,
      benchmarkInfo,
      feeInfo,
      trustMeta,
    };

    comparisonItem.missingFields = buildMissingFields(comparisonItem);
    comparisonItem.status = resolveComparisonStatus({
      coreAvailableCount,
      missingFields: comparisonItem.missingFields,
      warnings: comparisonItem.warnings,
    });

    if (includeRaw) {
      comparisonItem.raw = {
        baseInfo,
        netHistory: netRawHistory,
        yieldResponse,
        archiveHtml,
      };
    }

    return comparisonItem;
  });
}

export function aggregateFundComparisonData(codes, options = {}) {
  const normalizedCodes = normalizeFundCodes(codes);
  const range = options.range || DEFAULT_COMPARISON_RANGE;
  const concurrency = normalizeConcurrency(options.concurrency);
  const includeRaw = !!options.includeRaw;

  return mapWithConcurrency(normalizedCodes, concurrency, (code) => {
    return aggregateSingleFundComparisonData(code, {
      range,
      includeRaw,
    });
  }).then((items) => ({
    generatedAt: new Date().toISOString(),
    summary: buildSummary(items),
    items,
  }));
}
