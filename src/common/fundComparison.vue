<template>
  <div class="fund-comparison" :class="{ 'fund-comparison--dark': darkMode }">
    <header class="fund-comparison__header">
      <div>
        <div class="fund-comparison__eyebrow">CURRENT GROUP COMPARISON</div>
        <h2 class="fund-comparison__title">基金对比</h2>
        <p class="fund-comparison__subtitle">{{ subtitle }}</p>
      </div>
      <div class="fund-comparison__actions">
        <button class="fund-comparison__btn" type="button" :disabled="loading || !fundCodes.length" @click="loadComparison">
          {{ loading ? "加载中" : "刷新" }}
        </button>
        <button class="fund-comparison__btn fund-comparison__btn--primary" type="button" @click="$emit('close')">
          关闭
        </button>
      </div>
    </header>

    <section v-if="!fundCodes.length" class="fund-comparison__empty">
      当前分组暂无基金，无法对比。
    </section>

    <section v-else class="fund-comparison__body">
      <div v-if="fundCodes.length === 1" class="fund-comparison__notice">
        至少 2 只基金时对比更有意义，当前先展示单基金概览。
      </div>
      <div v-if="limitNoticeText" class="fund-comparison__notice">
        {{ limitNoticeText }}
      </div>
      <div v-if="errorMessage" class="fund-comparison__notice fund-comparison__notice--error">
        {{ errorMessage }}
      </div>
      <div v-else-if="summaryText" class="fund-comparison__notice" :class="{ 'fund-comparison__notice--warning': hasFailedItems }">
        {{ summaryText }}
      </div>

      <div v-if="loading" class="fund-comparison__loading">正在加载对比数据...</div>

      <template v-else>
        <div class="fund-comparison__cards">
          <article
            v-for="item in decoratedItems"
            :key="item.code"
            class="comparison-card"
            :class="`comparison-card--${item.status}`"
          >
            <div class="comparison-card__head">
              <div>
                <h3>{{ item.name }}</h3>
                <span>{{ item.code }}</span>
              </div>
              <strong>{{ item.statusLabel }}</strong>
            </div>
            <div class="comparison-card__return" :class="trendClass(item.oneYearReturnValue)">
              {{ item.oneYearReturn }}
            </div>
            <div class="comparison-card__meta">近一年收益</div>
            <div class="comparison-card__grid">
              <div>
                <span>最大回撤</span>
                <strong>{{ item.maxDrawdown }}</strong>
              </div>
              <div>
                <span>风险等级</span>
                <strong>{{ item.riskLevel }}</strong>
              </div>
              <div>
                <span>规模</span>
                <strong>{{ item.scale }}</strong>
              </div>
              <div>
                <span>成立日期</span>
                <strong>{{ item.inceptionDate }}</strong>
              </div>
            </div>
            <p v-if="item.errorText" class="comparison-card__error">{{ item.errorText }}</p>
          </article>
        </div>

        <div class="fund-comparison__table-wrap">
          <table class="fund-comparison__table">
            <thead>
              <tr>
                <th class="fund-comparison__metric-col">指标</th>
                <th v-for="item in decoratedItems" :key="`head-${item.code}`">
                  <div>{{ item.shortName }}</div>
                  <span>{{ item.code }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparisonRows" :key="row.key">
                <th class="fund-comparison__metric-col">{{ row.label }}</th>
                <td
                  v-for="item in decoratedItems"
                  :key="`${row.key}-${item.code}`"
                  :class="row.trend ? trendClass(row.raw(item)) : ''"
                >
                  {{ row.value(item) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </div>
</template>

<script>
import { aggregateFundComparisonData } from "./fundComparisonAggregator";
import { formatPercentDisplay } from "./fundDetailEnhance";

const MAX_COMPARISON_FUNDS = 4;

function normalizeCode(value) {
  return String(value || "").trim();
}

function pickFirst(source, keys) {
  if (!source) {
    return "";
  }
  for (let index = 0; index < keys.length; index += 1) {
    const value = source[keys[index]];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return "";
}

function formatText(value, fallback = "--") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

function formatScale(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return formatText(value);
  }

  const unitBase = 10000;
  const units = ["", "万", "亿", "万亿"];
  if (numericValue < unitBase) {
    return String(numericValue);
  }

  const unitIndex = Math.min(
    Math.floor(Math.log(numericValue) / Math.log(unitBase)),
    units.length - 1
  );
  return `${(numericValue / Math.pow(unitBase, unitIndex)).toFixed(2)}${units[unitIndex]}`;
}

function formatPurchaseFeeText(value) {
  const text = formatText(value);
  if (text === "--") {
    return text;
  }
  return text.replace("（前端）", "（前端收费）").replace("（后端）", "（后端收费）");
}

export default {
  name: "fundComparison",
  props: {
    funds: {
      type: Array,
      default: () => [],
    },
    groupLabel: {
      type: String,
      default: "当前分组",
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      requestVersion: 0,
      result: null,
      errorMessage: "",
    };
  },
  computed: {
    fundCodes() {
      const seen = new Set();
      return (Array.isArray(this.funds) ? this.funds : []).reduce((codes, fund) => {
        const code = normalizeCode(fund && (fund.code || fund.fundcode));
        if (code && !seen.has(code)) {
          seen.add(code);
          codes.push(code);
        }
        return codes;
      }, []);
    },
    comparisonFundCodes() {
      return this.fundCodes.slice(0, MAX_COMPARISON_FUNDS);
    },
    fundNameMap() {
      return (Array.isArray(this.funds) ? this.funds : []).reduce((map, fund) => {
        const code = normalizeCode(fund && (fund.code || fund.fundcode));
        const name = fund && fund.name && fund.name !== code ? fund.name : "";
        if (code && name) {
          map[code] = name;
        }
        return map;
      }, {});
    },
    subtitle() {
      return `${this.groupLabel || "当前分组"} · 近一年 · ${this.comparisonFundCodes.length} 只基金`;
    },
    limitNoticeText() {
      if (this.fundCodes.length <= MAX_COMPARISON_FUNDS) {
        return "";
      }
      return `当前分组共 ${this.fundCodes.length} 只基金，已展示前 ${MAX_COMPARISON_FUNDS} 只。`;
    },
    summaryText() {
      const summary = this.result && this.result.summary;
      if (!summary || !summary.total) {
        return "";
      }
      if (summary.failed === summary.total) {
        return `全部 ${summary.total} 只基金加载失败，请稍后刷新重试。`;
      }
      if (summary.failed || summary.partial) {
        return `已加载 ${summary.ok} 只，${summary.partial} 只数据不完整，${summary.failed} 只加载失败。`;
      }
      return `已加载 ${summary.ok} 只基金。`;
    },
    hasFailedItems() {
      const summary = this.result && this.result.summary;
      return !!(summary && (summary.failed || summary.partial));
    },
    decoratedItems() {
      const items = this.result && Array.isArray(this.result.items) ? this.result.items : [];
      return items.map((item) => this.decorateItem(item));
    },
    comparisonRows() {
      return [
        { key: "name", label: "基金名称", value: (item) => item.name },
        { key: "code", label: "基金代码", value: (item) => item.code },
        { key: "type", label: "基金类型", value: (item) => item.fundType },
        { key: "risk", label: "风险等级", value: (item) => item.riskLevel },
        { key: "scale", label: "基金规模", value: (item) => item.scale },
        { key: "inception", label: "成立日期", value: (item) => item.inceptionDate },
        { key: "return1y", label: "近一年收益", value: (item) => item.oneYearReturn, raw: (item) => item.oneYearReturnValue, trend: true },
        { key: "drawdown1y", label: "近一年最大回撤", value: (item) => item.maxDrawdown },
        { key: "benchmark", label: "业绩基准", value: (item) => item.benchmarkName },
        { key: "benchmarkType", label: "基准口径", value: (item) => item.benchmarkType },
        { key: "managementFee", label: "管理费", value: (item) => item.managementFee },
        { key: "custodyFee", label: "托管费", value: (item) => item.custodyFee },
        { key: "purchaseFee", label: "申购费率", value: (item) => item.purchaseFee },
        { key: "redemptionFee", label: "赎回费", value: (item) => item.redemptionFee },
        { key: "trust", label: "估值口径", value: (item) => item.estimateLabel },
        { key: "errors", label: "数据状态", value: (item) => item.statusDetail },
      ];
    },
  },
  watch: {
    comparisonFundCodes: {
      handler() {
        this.loadComparison();
      },
      immediate: true,
    },
  },
  methods: {
    loadComparison() {
      const codes = this.comparisonFundCodes;
      const requestId = ++this.requestVersion;
      this.errorMessage = "";
      this.result = null;

      if (!codes.length) {
        this.loading = false;
        return;
      }

      this.loading = true;
      aggregateFundComparisonData(codes, { range: "n" })
        .then((result) => {
          if (requestId !== this.requestVersion) {
            return;
          }
          this.result = result;
        })
        .catch((error) => {
          if (requestId !== this.requestVersion) {
            return;
          }
          this.errorMessage = `对比数据加载失败：${error && error.message ? error.message : "未知错误"}`;
        })
        .finally(() => {
          if (requestId === this.requestVersion) {
            this.loading = false;
          }
        });
    },
    decorateItem(item) {
      const baseInfo = item.baseInfo || {};
      const riskInfo = item.riskInfo || {};
      const benchmarkInfo = item.benchmarkInfo || {};
      const feeInfo = item.feeInfo || {};
      const trustMeta = item.trustMeta || {};
      const latestYield = Array.isArray(item.yieldHistory) && item.yieldHistory.length
        ? item.yieldHistory[item.yieldHistory.length - 1]
        : null;
      const code = item.code;
      const name = this.fundNameMap[code] || pickFirst(baseInfo, ["SHORTNAME", "FUNDSNAME", "FSNAME", "FNAME"]) || code;
      const oneYearReturnValue = latestYield ? latestYield.fundYield : null;
      const oneYearDrawdown = riskInfo.oneYearDrawdown || {};
      const errors = Array.isArray(item.errors) ? item.errors : [];
      const warnings = Array.isArray(item.warnings) ? item.warnings : [];

      return {
        code,
        name,
        shortName: name.length > 8 ? `${name.slice(0, 8)}...` : name,
        status: item.status || "failed",
        statusLabel: this.statusLabel(item.status),
        statusDetail: errors.length ? errors.join("；") : warnings.length ? warnings.join("；") : this.statusLabel(item.status),
        errorText: errors.length ? errors[0] : "",
        fundType: formatText(pickFirst(baseInfo, ["FTYPE", "FUNDTYPE", "TYPE"])),
        riskLevel: formatText(riskInfo.riskLevelLabel || pickFirst(baseInfo, ["RISKLEVEL", "RLEVEL_SZ"])),
        scale: formatScale(pickFirst(baseInfo, ["ENDNAV", "JJGM", "FUNDSCALE"])),
        inceptionDate: formatText(pickFirst(baseInfo, ["ESTABDATE", "FSRQ", "CLRQ"])),
        oneYearReturnValue,
        oneYearReturn: formatPercentDisplay(oneYearReturnValue),
        maxDrawdown: formatPercentDisplay(oneYearDrawdown.value),
        benchmarkName: formatText(benchmarkInfo.name),
        benchmarkType: formatText(benchmarkInfo.typeLabel),
        managementFee: formatText(feeInfo.managementFee),
        custodyFee: formatText(feeInfo.custodyFee),
        purchaseFee: formatPurchaseFeeText(feeInfo.purchaseFeeText),
        redemptionFee: formatText(feeInfo.redemptionFeeText),
        estimateLabel: formatText(trustMeta.estimateLabel),
      };
    },
    statusLabel(status) {
      if (status === "ok") {
        return "完整";
      }
      if (status === "partial") {
        return "部分缺失";
      }
      return "加载失败";
    },
    trendClass(value) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue === 0) {
        return "";
      }
      return numericValue > 0 ? "is-up" : "is-down";
    },
  },
};
</script>

<style lang="scss" scoped>
.fund-comparison {
  width: 100%;
  min-height: 520px;
  border-radius: 20px;
  box-sizing: border-box;
  padding: 18px;
  color: #1f2937;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.96));
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.2);
}

.fund-comparison--dark {
  color: #e5e7eb;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(17, 24, 39, 0.96));
}

.fund-comparison__header,
.fund-comparison__actions,
.comparison-card__head,
.comparison-card__grid {
  display: flex;
}

.fund-comparison__header {
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.fund-comparison__eyebrow {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.fund-comparison__title {
  margin: 4px 0;
  font-size: 24px;
  line-height: 1.2;
}

.fund-comparison__subtitle {
  margin: 0;
  color: #64748b;
}

.fund-comparison__actions {
  gap: 8px;
  flex-shrink: 0;
}

.fund-comparison__btn {
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 999px;
  padding: 7px 14px;
  color: inherit;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.fund-comparison__btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.fund-comparison__btn--primary {
  color: #fff;
  border-color: #2563eb;
  background: #2563eb;
}

.fund-comparison__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fund-comparison__empty,
.fund-comparison__loading,
.fund-comparison__notice {
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
}

.fund-comparison__notice--warning {
  background: rgba(245, 158, 11, 0.12);
  color: #92400e;
}

.fund-comparison__notice--error {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.fund-comparison__cards,
.fund-comparison__table-wrap {
  overflow-x: auto;
  padding-bottom: 6px;
}

.fund-comparison__cards {
  display: flex;
  gap: 12px;
}

.comparison-card {
  flex: 0 0 220px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 18px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.comparison-card--failed {
  border-color: rgba(239, 68, 68, 0.35);
}

.comparison-card--partial {
  border-color: rgba(245, 158, 11, 0.42);
}

.comparison-card__head {
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.comparison-card__head h3 {
  margin: 0 0 4px;
  font-size: 15px;
}

.comparison-card__head span,
.comparison-card__meta,
.comparison-card__grid span {
  color: #64748b;
  font-size: 12px;
}

.comparison-card__head strong {
  color: #2563eb;
  font-size: 12px;
  white-space: nowrap;
}

.comparison-card__return {
  margin-top: 14px;
  font-size: 26px;
  font-weight: 800;
}

.comparison-card__grid {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.comparison-card__grid > div {
  width: calc(50% - 4px);
}

.comparison-card__grid strong {
  display: block;
  margin-top: 3px;
  font-size: 13px;
}

.comparison-card__error {
  margin: 12px 0 0;
  color: #b91c1c;
  font-size: 12px;
}

.fund-comparison__table {
  min-width: 760px;
  width: max-content;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
}

.fund-comparison__table th,
.fund-comparison__table td {
  min-width: 130px;
  max-width: 190px;
  border-right: 1px solid rgba(148, 163, 184, 0.2);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  padding: 9px 10px;
  text-align: left;
  vertical-align: top;
  background: rgba(255, 255, 255, 0.68);
}

.fund-comparison__table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(239, 246, 255, 0.96);
}

.fund-comparison__table thead span {
  color: #64748b;
  font-size: 11px;
}

.fund-comparison__metric-col {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 110px !important;
  background: rgba(248, 250, 252, 0.98) !important;
}

.is-up {
  color: #f56c6c !important;
}

.is-down {
  color: #4eb61b !important;
}

.fund-comparison--dark .fund-comparison__subtitle,
.fund-comparison--dark .fund-comparison__eyebrow,
.fund-comparison--dark .comparison-card__head span,
.fund-comparison--dark .comparison-card__meta,
.fund-comparison--dark .comparison-card__grid span,
.fund-comparison--dark .fund-comparison__table thead span {
  color: #94a3b8;
}

.fund-comparison--dark .fund-comparison__btn {
  background: rgba(15, 23, 42, 0.74);
}

.fund-comparison--dark .comparison-card,
.fund-comparison--dark .fund-comparison__table th,
.fund-comparison--dark .fund-comparison__table td {
  background: rgba(15, 23, 42, 0.78);
}

.fund-comparison--dark .fund-comparison__table thead th,
.fund-comparison--dark .fund-comparison__metric-col {
  background: rgba(17, 24, 39, 0.98) !important;
}

@media (max-width: 620px) {
  .fund-comparison {
    min-height: 460px;
    padding: 14px;
  }

  .fund-comparison__header {
    flex-direction: column;
  }
}
</style>
