<template>
  <div
    class="box"
    v-loading="loading"
    :element-loading-background="
      darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    "
  >
    <div class="content-box">
      <div class="detail-card-grid">
        <section class="detail-card">
          <div class="detail-card__header">
            <div>
              <div class="detail-card__eyebrow">风险信息卡</div>
              <h6 class="detail-card__title">历史回撤</h6>
            </div>
            <span v-if="riskInfo.riskLevelLabel" class="pill pill--risk">{{ riskInfo.riskLevelLabel }}</span>
          </div>
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-item__label">{{ riskInfo.oneYearDrawdown.label }}</div>
              <div class="metric-item__value">{{ formatPercent(riskInfo.oneYearDrawdown.value) }}</div>
              <div class="metric-item__meta">{{ riskInfo.oneYearDrawdown.scopeLabel }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-item__label">{{ riskInfo.threeYearDrawdown.label }}</div>
              <div class="metric-item__value">{{ formatPercent(riskInfo.threeYearDrawdown.value) }}</div>
              <div class="metric-item__meta">{{ riskInfo.threeYearDrawdown.scopeLabel }}</div>
            </div>
          </div>
          <div class="detail-card__note">{{ riskInfo.summary }}</div>
          <div class="detail-card__foot">
            <span>风险数据日期：{{ riskInfo.asOfDate || '--' }}</span>
            <span v-if="riskInfo.riskStatement">{{ riskInfo.riskStatement }}</span>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__header">
            <div>
              <div class="detail-card__eyebrow">基准对比卡</div>
              <h6 class="detail-card__title">{{ benchmarkInfo.name }}</h6>
            </div>
            <span class="pill" :class="benchmarkInfo.type === 'reference' ? 'pill--reference' : 'pill--neutral'">
              {{ benchmarkInfo.typeLabel }}
            </span>
          </div>
          <div v-if="benchmarkInfo.hasAnyData" class="benchmark-table">
            <div class="benchmark-table__head benchmark-table__row">
              <span>区间</span>
              <span>基金</span>
              <span>{{ benchmarkInfo.type === 'reference' ? '参考基准' : '基准' }}</span>
              <span>超额</span>
            </div>
            <div v-for="row in benchmarkInfo.rows" :key="row.key" class="benchmark-table__row">
              <span>{{ row.label }}</span>
              <span>{{ formatPercent(row.fund) }}</span>
              <span>{{ formatPercent(row.benchmark) }}</span>
              <span>{{ formatPercent(row.excess) }}</span>
            </div>
          </div>
          <div v-else class="detail-card__empty">暂无可用基准数据</div>
          <div class="detail-card__foot">
            <span>基准日期：{{ benchmarkInfo.asOfDate || '--' }}</span>
            <span>{{ benchmarkInfo.note }}</span>
            <span v-if="benchmarkInfo.officialName && benchmarkInfo.officialName !== benchmarkInfo.name">
              正式业绩比较基准：{{ benchmarkInfo.officialName }}
            </span>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__header">
            <div>
              <div class="detail-card__eyebrow">费率信息卡</div>
              <h6 class="detail-card__title">长期持有成本</h6>
            </div>
          </div>
          <div class="info-list info-list--embedded">
            <div class="info-row"><span>管理费</span><span>{{ feeInfo.managementFee }}</span></div>
            <div class="info-row"><span>托管费</span><span>{{ feeInfo.custodyFee }}</span></div>
            <div class="info-row"><span>销售服务费</span><span>{{ feeInfo.serviceFee }}</span></div>
            <div class="info-row"><span>申购费说明</span><span>{{ feeInfo.purchaseFeeText }}</span></div>
            <div class="info-row"><span>赎回费说明</span><span>{{ feeInfo.redemptionFeeText }}</span></div>
          </div>
          <div class="detail-card__note">{{ feeInfo.note }}</div>
        </section>

        <section class="detail-card">
          <div class="detail-card__header">
            <div>
              <div class="detail-card__eyebrow">数据可信度 / 时效说明</div>
              <h6 class="detail-card__title">口径与时效</h6>
            </div>
            <span class="pill pill--neutral">{{ trustMeta.estimateLabel }}</span>
          </div>
          <div class="info-list info-list--embedded">
            <div class="info-row"><span>估值口径</span><span>{{ trustMeta.estimateLabel }}</span></div>
            <div class="info-row"><span>估值时间</span><span>{{ trustMeta.estimateUpdatedAt }}</span></div>
            <div class="info-row"><span>正式净值日期</span><span>{{ trustMeta.navUpdatedAt }}</span></div>
            <div class="info-row"><span>持仓披露截止日期</span><span>{{ trustMeta.holdingsDisclosureDate }}</span></div>
          </div>
          <div class="detail-card__foot detail-card__foot--stack">
            <span>{{ trustMeta.estimateDescription }}</span>
            <span>{{ trustMeta.historyDescription }}</span>
            <span>{{ trustMeta.benchmarkDescription }}</span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import {
  buildBenchmarkInfo,
  buildFeeInfo,
  buildRiskInfo,
  buildTrustMeta,
  fetchFundArchiveHtml,
  fetchFundBaseInfo,
  fetchFundNetDiagram,
  fetchFundYieldDiagram,
  formatPercentDisplay,
  parseArchiveHtml,
} from "./fundDetailEnhance";

export default {
  name: "fundInsight",
  props: {
    darkMode: {
      type: Boolean,
      default: false,
    },
    fund: {
      type: Object,
      required: true,
    },
    holdingsExpansion: {
      type: [String, Number, null],
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      requestVersion: 0,
      riskInfo: {
        oneYearDrawdown: { label: "近1年最大回撤", value: null, scopeLabel: "暂无足够数据" },
        threeYearDrawdown: { label: "近3年最大回撤", value: null, scopeLabel: "暂无足够数据" },
        summary: "暂无足够数据判断风险水平",
        riskLevelLabel: "",
        riskStatement: "",
        asOfDate: "--",
      },
      benchmarkInfo: {
        name: "暂无可用基准数据",
        type: "none",
        typeLabel: "暂无可用基准数据",
        rows: [],
        hasAnyData: false,
        asOfDate: "--",
        note: "暂无可用基准数据",
        officialName: "",
      },
      feeInfo: {
        managementFee: "未获取到",
        custodyFee: "未获取到",
        serviceFee: "未获取到",
        purchaseFeeText: "未获取到",
        redemptionFeeText: "未获取到",
        note: "费率会影响长期持有收益，建议结合收益与风险一起看",
      },
      trustMeta: {
        estimateLabel: "正式净值",
        estimateDescription: "",
        historyDescription: "",
        holdingsDisclosureDate: "--",
        benchmarkDescription: "",
        estimateUpdatedAt: "--",
        navUpdatedAt: "--",
      },
    };
  },
  watch: {
    "fund.fundcode": {
      handler(nextCode, prevCode) {
        if (!nextCode || nextCode === prevCode) {
          return;
        }
        this.getData();
      },
    },
    holdingsExpansion() {
      this.syncTrustMeta();
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.getData();
    },
    wrapRequest(promise, fallbackValue) {
      return promise
        .then((value) => ({ ok: true, value }))
        .catch(() => ({ ok: false, value: fallbackValue }));
    },
    syncTrustMeta() {
      this.trustMeta = buildTrustMeta({
        fund: this.fund,
        benchmarkInfo: this.benchmarkInfo,
        holdingsExpansion: this.holdingsExpansion,
      });
    },
    getData() {
      const fundCode = this.fund.fundcode;
      const requestId = ++this.requestVersion;
      this.loading = true;
      Promise.all([
        this.wrapRequest(fetchFundBaseInfo(fundCode), {}),
        this.wrapRequest(fetchFundNetDiagram(fundCode, "3n"), []),
        this.wrapRequest(fetchFundYieldDiagram(fundCode, "n"), { dataList: [], expansion: {} }),
        this.wrapRequest(fetchFundArchiveHtml(fundCode), ""),
      ])
        .then(([baseResult, historyResult, yieldResult, archiveResult]) => {
          if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode) {
            return;
          }

          const baseInfo = baseResult.value || {};
          const historyList = historyResult.value || [];
          const yieldResponse = yieldResult.value || { dataList: [], expansion: {} };
          const archiveHtml = archiveResult.value || "";
          const archiveData = parseArchiveHtml(archiveHtml);

          this.riskInfo = buildRiskInfo({
            historyList,
            baseInfo,
            archiveData,
          });
          this.benchmarkInfo = buildBenchmarkInfo({
            baseInfo,
            archiveData,
            yieldResponse,
          });
          this.feeInfo = buildFeeInfo(baseInfo, archiveData);
          this.syncTrustMeta();
        })
        .finally(() => {
          if (requestId === this.requestVersion) {
            this.loading = false;
          }
        });
    },
    formatPercent(value) {
      return formatPercentDisplay(value);
    },
  },
};
</script>

<style lang="scss" scoped>
.box {
  width: 100%;
  height: 100%;
  min-height: 260px;
}

.content-box {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-box::before {
  content: "";
  display: block;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.52), rgba(37, 99, 235, 0.08), transparent);
}

.info-list {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(226, 232, 240, 0.94);
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
}

.info-list--embedded {
  border-radius: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.9);
}

.info-row + .info-row {
  border-top: 1px solid rgba(226, 232, 240, 0.75);
}

.info-row span:first-child {
  color: #64748b;
  font-size: 11px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.info-row span:last-child {
  color: #111827;
  font-weight: 700;
  text-align: right;
  font-size: 13px;
}

.detail-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.96));
  border: 1px solid rgba(226, 232, 240, 0.96);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
}

.detail-card::before {
  content: "";
  position: absolute;
  left: 16px;
  right: 16px;
  top: 0;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.7), rgba(37, 99, 235, 0.16));
}

.detail-card:nth-child(2)::before {
  background: linear-gradient(90deg, rgba(15, 118, 110, 0.72), rgba(15, 118, 110, 0.16));
}

.detail-card:nth-child(3)::before {
  background: linear-gradient(90deg, rgba(217, 119, 6, 0.72), rgba(217, 119, 6, 0.16));
}

.detail-card:nth-child(4)::before {
  background: linear-gradient(90deg, rgba(124, 58, 237, 0.7), rgba(124, 58, 237, 0.16));
}

.detail-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-card__eyebrow {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}

.detail-card__title {
  margin: 6px 0 0;
  font-size: 16px;
  line-height: 1.5;
  color: #0f172a;
}

.detail-card__note {
  font-size: 12px;
  line-height: 1.65;
  color: #1e293b;
  padding: 13px 14px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.88);
}

.detail-card__empty {
  min-height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  color: #64748b;
  font-size: 12px;
}

.detail-card__foot {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 11px;
  line-height: 1.6;
  color: #64748b;
}

.detail-card__foot--stack {
  gap: 6px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-item {
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(255, 255, 255, 0.96));
  border: 1px solid rgba(226, 232, 240, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.metric-item__label,
.metric-item__meta {
  font-size: 11px;
  color: #64748b;
}

.metric-item__value {
  margin: 6px 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: #1e3a8a;
}

.benchmark-table {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.94);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.benchmark-table__row {
  display: grid;
  grid-template-columns: 64px repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 12px;
  font-size: 12px;
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
}

.benchmark-table__row + .benchmark-table__row {
  border-top: 1px solid rgba(226, 232, 240, 0.75);
}

.benchmark-table__head {
  font-size: 11px;
  color: #475569;
  background: linear-gradient(180deg, rgba(241, 245, 249, 0.98), rgba(248, 250, 252, 0.96));
}

.benchmark-table__row:not(.benchmark-table__head) span:nth-child(2) {
  color: #1e3a8a;
  font-weight: 700;
}

.benchmark-table__row:not(.benchmark-table__head) span:nth-child(3) {
  color: #0f766e;
  font-weight: 700;
}

.benchmark-table__row:not(.benchmark-table__head) span:nth-child(4) {
  color: #6d28d9;
  font-weight: 700;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.pill--risk {
  background: rgba(245, 158, 11, 0.12);
  color: #92400e;
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.16);
}

.pill--reference {
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.14);
}

.pill--neutral {
  background: rgba(148, 163, 184, 0.1);
  color: #475569;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.14);
}

.box .info-list--embedded .info-row:first-child span:last-child,
.box .info-list--embedded .info-row:nth-child(2) span:last-child {
  color: #0f172a;
}

.box .info-list--embedded .info-row:nth-child(3) span:last-child {
  color: #92400e;
}

.box .info-list--embedded .info-row:nth-child(4) span:last-child {
  color: #1e3a8a;
}

@media (max-width: 720px) {
  .detail-card-grid {
    grid-template-columns: 1fr;
  }
}

:deep(.darkMode) .content-box::before {
  background: linear-gradient(90deg, rgba(96, 165, 250, 0.52), rgba(96, 165, 250, 0.1), transparent);
}

:deep(.darkMode) .detail-card {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.74));
  border-color: rgba(148, 163, 184, 0.18);
  box-shadow: 0 14px 26px rgba(2, 6, 23, 0.22);
}

:deep(.darkMode) .detail-card__eyebrow,
:deep(.darkMode) .detail-card__foot,
:deep(.darkMode) .benchmark-table__head,
:deep(.darkMode) .info-row span:first-child,
:deep(.darkMode) .metric-item__label,
:deep(.darkMode) .metric-item__meta {
  color: rgba(226, 232, 240, 0.66);
}

:deep(.darkMode) .detail-card__title,
:deep(.darkMode) .info-row span:last-child,
:deep(.darkMode) .detail-card__empty {
  color: rgba(248, 250, 252, 0.94);
}

:deep(.darkMode) .detail-card__note,
:deep(.darkMode) .metric-item,
:deep(.darkMode) .benchmark-table__row,
:deep(.darkMode) .detail-card__empty,
:deep(.darkMode) .info-list,
:deep(.darkMode) .info-row {
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(148, 163, 184, 0.14);
}

:deep(.darkMode) .metric-item__value {
  color: #bfdbfe;
}

:deep(.darkMode) .benchmark-table__row:not(.benchmark-table__head) span:nth-child(2) {
  color: #bfdbfe;
}

:deep(.darkMode) .benchmark-table__row:not(.benchmark-table__head) span:nth-child(3) {
  color: #99f6e4;
}

:deep(.darkMode) .benchmark-table__row:not(.benchmark-table__head) span:nth-child(4) {
  color: #ddd6fe;
}
</style>
