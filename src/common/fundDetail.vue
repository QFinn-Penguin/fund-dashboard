<template>
  <div class="fund-detail-shell" :class="darkMode ? 'darkMode' : ''">
    <div class="content-box" :class="contentBoxClass">
      <div class="detail-header">
        <div class="detail-header__topbar">
          <button type="button" class="detail-header__back" @click="close">
            <span class="detail-header__back-icon" aria-hidden="true">←</span>
            <span>返回列表</span>
          </button>
        </div>
        <div class="detail-header__main">
          <div class="detail-header__eyebrow">基金详情</div>
          <h5>{{ fund.name }}</h5>
          <div class="detail-header__code">{{ fund.fundcode }}</div>
        </div>
        <div class="detail-header__stats">
          <div class="detail-stat">
            <div class="detail-stat__label">当日估值</div>
            <div class="detail-stat__value">{{ detailEstimateValue }}</div>
          </div>
          <div class="detail-stat" :class="detailChangeClass">
            <div class="detail-stat__label">今日涨跌</div>
            <div class="detail-stat__value">{{ detailChangeValue }}</div>
          </div>
          <div class="detail-stat">
            <div class="detail-stat__label">更新时间</div>
            <div class="detail-stat__value">{{ detailUpdateValue }}</div>
          </div>
        </div>
      </div>

      <div class="manual-tabs" :style="tabCursorStyle">
        <span class="manual-tabs__cursor" aria-hidden="true"></span>
        <button
          v-for="item in tabItems"
          :key="item.name"
          class="tab-btn"
          :class="activeName === item.name ? 'active' : ''"
          @mouseenter="setTabPreview(item.name)"
          @mouseleave="clearTabPreview"
          @focus="setTabPreview(item.name)"
          @blur="clearTabPreview"
          @click="switchTab(item.name)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="detail-panel" :class="detailPanelClass">
        <component
          :is="chartsComponent"
          v-if="activeName === 'first' && chartsComponent"
          :key="`first-${fund.fundcode}`"
          :darkMode="darkMode"
          :fund="fund"
          ref="first"
        ></component>

        <div
          v-else-if="activeName === 'ccmx'"
          class="holding-box"
          v-loading="holdingsLoading"
          :element-loading-background="
            darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
          "
        >
          <h5 class="holding-box__title">
            <span v-if="holdingsExpansion">截止日期：{{ holdingsExpansion }}</span>
            <span v-else>暂无数据</span>
          </h5>
          <div v-if="holdingsLoading" class="holding-state">
            <div class="holding-state__title">持仓明细加载中</div>
            <div class="holding-state__desc">正在同步最新持仓与行情数据…</div>
          </div>
          <div v-else-if="holdingsErrorMessage" class="holding-state holding-state--error">
            <div class="holding-state__title">持仓明细加载失败</div>
            <div class="holding-state__desc">{{ holdingsErrorMessage }}</div>
          </div>
          <div v-else-if="!holdingsList.length" class="holding-state">
            <div v-if="!hasAnyHoldings" class="holding-state__title">暂无持仓明细</div>
            <div v-if="!hasAnyHoldings" class="holding-state__desc">该基金当前没有可展示的持仓数据，稍后可再试。</div>
            <template v-else>
              <div v-if="holdingsBonds.length" class="holding-section">
                <div class="holding-section__header">债券持仓</div>
                <table>
                  <thead>
                    <tr>
                      <th class="holding-box__th">债券名称（代码）</th>
                      <th class="holding-box__th">持仓占比</th>
                      <th class="holding-box__th">是否停牌</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="el in holdingsBonds" :key="el.ZQDM" class="holding-box__row holding-box__row--static">
                      <td class="holding-box__cell holding-box__cell--rich">
                        <div class="holding-item">
                          <div class="holding-item__title">{{ el.ZQMC || "未知债券" }}</div>
                          <div class="holding-item__meta">{{ el.ZQDM || "--" }}</div>
                        </div>
                      </td>
                      <td>
                        <span class="holding-ratio-pill">{{ formatBondRatio(el) }}</span>
                      </td>
                      <td>
                        <span
                          class="holding-status-pill"
                          :class="formatHoldingBroken(el.ISBROKEN) === '是' ? 'holding-status-pill--warn' : 'holding-status-pill--muted'"
                        >
                          {{ formatHoldingBroken(el.ISBROKEN) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="holdingsFofs.length" class="holding-section">
                <div class="holding-section__header">基金持仓</div>
                <table>
                  <thead>
                    <tr>
                      <th class="holding-box__th">基金名称（代码）</th>
                      <th class="holding-box__th">持仓占比</th>
                      <th class="holding-box__th">较上期</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="el in holdingsFofs" :key="el.FCODE || el.CODE || el.FundCode || el.Fundcode" class="holding-box__row holding-box__row--static">
                      <td class="holding-box__cell holding-box__cell--rich">
                        <div class="holding-item">
                          <div class="holding-item__title">{{ formatFofDisplayName(el) }}</div>
                          <div class="holding-item__meta">{{ formatFofDisplayCode(el) }}</div>
                        </div>
                      </td>
                      <td>
                        <span class="holding-ratio-pill">{{ formatFofRatio(el) }}</span>
                      </td>
                      <td>{{ comparedHolding(el) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
          <template v-else>
            <div v-if="holdingsList.length" class="holding-section">
              <div v-if="holdingsBonds.length || holdingsFofs.length" class="holding-section__header">股票持仓</div>
              <table>
            <thead>
              <tr>
                <th class="holding-box__th">股票名称（代码）</th>
                <th class="holding-box__th">价格</th>
                <th class="holding-box__th">涨跌幅</th>
                <th class="holding-box__th">持仓占比</th>
                <th class="holding-box__th">较上期</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(el, ind) in holdingsList"
                :key="el.GPDM"
                class="holding-box__row"
                @click="sltStock(getHoldingQuote(el, ind))"
              >
                <td class="holding-box__cell">{{ el.GPJC + "（" + el.GPDM + "）" }}</td>
                <td>{{ formatHoldingPrice(el, ind) }}</td>
                <td :class="holdingQuoteClass(el, ind)">
                  {{ formatHoldingChange(el, ind) }}
                </td>
                <td>{{ parseFloat(el.JZBL).toFixed(2) }}%</td>
                <td>{{ comparedHolding(el) }}</td>
              </tr>
            </tbody>
              </table>
            </div>

            <div v-if="holdingsBonds.length" class="holding-section">
              <div class="holding-section__header">债券持仓</div>
              <table>
                <thead>
                  <tr>
                    <th class="holding-box__th">债券名称（代码）</th>
                    <th class="holding-box__th">持仓占比</th>
                    <th class="holding-box__th">是否停牌</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="el in holdingsBonds" :key="el.ZQDM" class="holding-box__row holding-box__row--static">
                    <td class="holding-box__cell holding-box__cell--rich">
                      <div class="holding-item">
                        <div class="holding-item__title">{{ el.ZQMC || "未知债券" }}</div>
                        <div class="holding-item__meta">{{ el.ZQDM || "--" }}</div>
                      </div>
                    </td>
                    <td>
                      <span class="holding-ratio-pill">{{ formatBondRatio(el) }}</span>
                    </td>
                    <td>
                      <span
                        class="holding-status-pill"
                        :class="formatHoldingBroken(el.ISBROKEN) === '是' ? 'holding-status-pill--warn' : 'holding-status-pill--muted'"
                      >
                        {{ formatHoldingBroken(el.ISBROKEN) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="holdingsFofs.length" class="holding-section">
              <div class="holding-section__header">基金持仓</div>
              <table>
                <thead>
                  <tr>
                    <th class="holding-box__th">基金名称（代码）</th>
                    <th class="holding-box__th">持仓占比</th>
                    <th class="holding-box__th">较上期</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="el in holdingsFofs" :key="el.FCODE || el.CODE || el.FundCode || el.Fundcode" class="holding-box__row holding-box__row--static">
                    <td class="holding-box__cell holding-box__cell--rich">
                      <div class="holding-item">
                        <div class="holding-item__title">{{ formatFofDisplayName(el) }}</div>
                        <div class="holding-item__meta">{{ formatFofDisplayCode(el) }}</div>
                      </div>
                    </td>
                    <td>
                      <span class="holding-ratio-pill">{{ formatFofRatio(el) }}</span>
                    </td>
                    <td>{{ comparedHolding(el) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

        <component
          :is="charts2Component"
          v-else-if="activeName === 'second' && charts2Component"
          :key="`second-${fund.fundcode}`"
          :darkMode="darkMode"
          :fund="fund"
          chartType="JZ"
          ref="second"
        ></component>

        <component
          :is="charts2Component"
          v-else-if="activeName === 'third' && charts2Component"
          :key="`third-${fund.fundcode}`"
          :darkMode="darkMode"
          :fund="fund"
          chartType="LJSY"
          ref="third"
        ></component>

        <component
          :is="fundInfoComponent"
          v-else-if="activeName === 'info' && fundInfoComponent"
          :key="`info-${fund.fundcode}`"
          :darkMode="darkMode"
          :fund="fund"
          ref="info"
          @showManager="showManager"
        ></component>
      </div>

    </div>
    <component
      :is="miniIndDetailComponent"
      v-if="miniIndDetailVisible && miniIndDetailComponent"
      mini
      ref="indDetail"
      :darkMode="darkMode"
    ></component>
    <component
      :is="managerDetailComponent"
      v-if="managerDetailVisible && managerDetailComponent"
      ref="managerDetail"
      :darkMode="darkMode"
    ></component>
  </div>
</template>

<script>
const loadCharts = () => import(/* webpackChunkName: "popup-fund-detail-charts" */ "./charts");
const loadCharts2 = () => import(/* webpackChunkName: "popup-fund-detail-charts2" */ "./charts2");
const loadMiniIndDetail = () => import(/* webpackChunkName: "popup-fund-detail-ind-detail" */ "../common/indDetail");
const loadFundInfo = () => import(/* webpackChunkName: "popup-fund-detail-info" */ "../common/fundInfo");
const loadManagerDetail = () => import(/* webpackChunkName: "popup-fund-detail-manager" */ "../common/managerDetail");

export default {
  name: "fundDetail",
  props: {
    darkMode: {
      type: Boolean,
      default: false,
    },
    fund: {
      type: Object,
      required: true,
    },
    holdingsLoading: {
      type: Boolean,
      default: false,
    },
    holdingsList: {
      type: Array,
      default: () => [],
    },
    holdingsQuotes: {
      type: Array,
      default: () => [],
    },
    holdingsBonds: {
      type: Array,
      default: () => [],
    },
    holdingsFofs: {
      type: Array,
      default: () => [],
    },
    holdingsExpansion: {
      type: [String, Number, null],
      default: null,
    },
    holdingsDebug: {
      type: String,
      default: "idle",
    },
  },
  data() {
    return {
      activeName: "first",
      tabPreviewName: "",
      chartsComponent: null,
      charts2Component: null,
      fundInfoComponent: null,
      miniIndDetailComponent: null,
      miniIndDetailVisible: false,
      managerDetailComponent: null,
      managerDetailVisible: false,
      tabItems: [
        { name: "first", label: "净值估算" },
        { name: "ccmx", label: "持仓明细" },
        { name: "second", label: "历史净值" },
        { name: "third", label: "累计收益" },
        { name: "info", label: "基金概况" },
      ],
    };
  },
  computed: {
    detailEstimateValue() {
      if (this.fund && this.fund.gsz !== undefined && this.fund.gsz !== null && this.fund.gsz !== "") {
        return this.fund.gsz;
      }
      if (this.fund && this.fund.dwjz !== undefined && this.fund.dwjz !== null && this.fund.dwjz !== "") {
        return this.fund.dwjz;
      }
      return "--";
    },
    detailChangeValue() {
      if (this.fund && this.fund.gszzl !== undefined && this.fund.gszzl !== null && this.fund.gszzl !== "") {
        return `${this.fund.gszzl}%`;
      }
      return "--";
    },
    detailChangeClass() {
      const value = Number(this.fund && this.fund.gszzl);
      if (!Number.isFinite(value)) {
        return "";
      }
      return value >= 0 ? "up" : "down";
    },
    detailUpdateValue() {
      if (this.fund && this.fund.gztime) {
        return this.fund.gztime.length > 10 ? this.fund.gztime.substr(11, 5) : this.fund.gztime;
      }
      if (this.fund && this.fund.jzrq) {
        return this.fund.jzrq;
      }
      return "--";
    },
    holdingsErrorMessage() {
      if (!this.holdingsDebug || this.holdingsLoading) {
        return "";
      }
      if (this.holdingsDebug.indexOf("error:") === 0) {
        return this.holdingsDebug.replace(/^error:\s*/, "");
      }
      return "";
    },
    hasAnyHoldings() {
      return (
        this.holdingsList.length > 0 ||
        this.holdingsBonds.length > 0 ||
        this.holdingsFofs.length > 0
      );
    },
    detailPanelClass() {
      return `detail-panel--${this.activeName}`;
    },
    contentBoxClass() {
      return `content-box--${this.activeName}`;
    },
    visibleTabName() {
      const previewName = this.tabPreviewName;
      if (this.tabItems.some((item) => item.name === previewName)) {
        return previewName;
      }
      return this.activeName;
    },
    visibleTabIndex() {
      const nextIndex = this.tabItems.findIndex((item) => item.name === this.visibleTabName);
      return nextIndex >= 0 ? nextIndex : 0;
    },
    tabCursorStyle() {
      return {
        "--detail-tab-index": `${this.visibleTabIndex}`,
        "--detail-tab-count": `${this.tabItems.length || 1}`,
      };
    },
  },
  methods: {
    async ensureTabComponent(name) {
      if (name === "first" && !this.chartsComponent) {
        const chartsModule = await loadCharts();
        this.chartsComponent = chartsModule.default || chartsModule;
      }

      if ((name === "second" || name === "third") && !this.charts2Component) {
        const charts2Module = await loadCharts2();
        this.charts2Component = charts2Module.default || charts2Module;
      }

      if (name === "info" && !this.fundInfoComponent) {
        const fundInfoModule = await loadFundInfo();
        this.fundInfoComponent = fundInfoModule.default || fundInfoModule;
      }
    },
    async ensureMiniIndDetailComponent() {
      if (!this.miniIndDetailComponent) {
        const miniIndDetailModule = await loadMiniIndDetail();
        this.miniIndDetailComponent = miniIndDetailModule.default || miniIndDetailModule;
      }
    },
    async ensureManagerDetailComponent() {
      if (!this.managerDetailComponent) {
        const managerDetailModule = await loadManagerDetail();
        this.managerDetailComponent = managerDetailModule.default || managerDetailModule;
      }
    },
    async switchTab(name) {
      this.activeName = name;
      this.tabPreviewName = "";
      await this.ensureTabComponent(name);
      this.$nextTick(() => {
        const currentRef = this.$refs[name];
        if (currentRef && typeof currentRef.init === "function") {
          currentRef.init();
        }
      });

      if (name === "ccmx") {
        this.$emit("request-holdings", this.fund);
      }
    },
    setTabPreview(name) {
      if (!this.tabItems.some((item) => item.name === name)) {
        return;
      }
      this.tabPreviewName = name;
    },
    clearTabPreview() {
      this.tabPreviewName = "";
    },
    async init() {
      this.activeName = "first";
      this.tabPreviewName = "";
      await this.ensureTabComponent("first");
    },
    getHoldingQuote(val, ind) {
      const fallback = {
        f2: 0,
        f3: 0,
        f12: val && val.GPDM ? val.GPDM : "",
      };

      if (!Array.isArray(this.holdingsQuotes) || !this.holdingsQuotes.length) {
        return fallback;
      }

      const current = this.holdingsQuotes[ind];
      if (current && current.f12 == fallback.f12) {
        return current;
      }

      const matched = this.holdingsQuotes.find((item) => item.f12 == fallback.f12);
      return matched || fallback;
    },
    formatHoldingPrice(val, ind) {
      const quote = this.getHoldingQuote(val, ind);
      const price = Number(quote.f2);
      return Number.isFinite(price) && price !== 0 ? price.toFixed(2) : "--";
    },
    formatHoldingChange(val, ind) {
      const quote = this.getHoldingQuote(val, ind);
      const change = Number(quote.f3);
      return Number.isFinite(change) && change !== 0 ? `${change.toFixed(2)}%` : "--";
    },
    holdingQuoteClass(val, ind) {
      const quote = this.getHoldingQuote(val, ind);
      const change = Number(quote.f3);
      if (!Number.isFinite(change)) {
        return "";
      }
      return change >= 0 ? "up" : "down";
    },
    comparedHolding(val) {
      if (val.PCTNVCHGTYPE == "新增") {
        return "新增";
      } else if (isNaN(val.PCTNVCHG)) {
        return 0;
      } else {
        let icon = val.PCTNVCHG > 0 ? "↑ " : "↓ ";
        return icon + Math.abs(parseFloat(val.PCTNVCHG)).toFixed(2) + "%";
      }
    },
    formatBondName(val) {
      const code = val && val.ZQDM ? val.ZQDM : "--";
      const name = val && val.ZQMC ? val.ZQMC : "未知债券";
      return `${name}（${code}）`;
    },
    formatBondRatio(val) {
      const ratio = Number(val && val.ZJZBL);
      return Number.isFinite(ratio) ? `${ratio.toFixed(2)}%` : "--";
    },
    formatHoldingBroken(value) {
      if (value === "--" || value == null || value === "") {
        return "--";
      }
      return String(value) === "1" ? "是" : "否";
    },
    formatFofName(val) {
      const code = val && (val.FCODE || val.CODE || val.FundCode || val.Fundcode);
      const name = val && (val.SHORTNAME || val.FNAME || val.NAME || val.FundName || val.Fundname);
      if (!name && !code) {
        return "--";
      }
      return code ? `${name || "未知基金"}（${code}）` : name;
    },
    formatFofDisplayName(val) {
      return val && (val.SHORTNAME || val.FNAME || val.NAME || val.FundName || val.Fundname)
        ? val.SHORTNAME || val.FNAME || val.NAME || val.FundName || val.Fundname
        : "未知基金";
    },
    formatFofDisplayCode(val) {
      return val && (val.FCODE || val.CODE || val.FundCode || val.Fundcode)
        ? val.FCODE || val.CODE || val.FundCode || val.Fundcode
        : "--";
    },
    formatFofRatio(val) {
      const rawValue = val && (val.JZBL || val.ZJZBL || val.NAVRATIO);
      const ratio = Number(rawValue);
      return Number.isFinite(ratio) ? `${ratio.toFixed(2)}%` : "--";
    },
    close() {
      this.$emit("close", false);
    },
    async showManager(val) {
      await this.ensureManagerDetailComponent();
      this.managerDetailVisible = true;
      this.$nextTick(() => {
        if (this.$refs.managerDetail) {
          this.$refs.managerDetail.init(val);
        }
      });
    },
    async sltStock(val) {
      if (!val || !val.f12) {
        return;
      }
      await this.ensureMiniIndDetailComponent();
      this.miniIndDetailVisible = true;
      this.$nextTick(() => {
        if (this.$refs.indDetail) {
          this.$refs.indDetail.init(val);
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.fund-detail-shell {
  width: 100%;
  color: #334155;
}

.content-box {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 16px;
  padding: 0 14px 14px;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  text-align: center;
  line-height: 1;
  vertical-align: middle;
  position: relative;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
  border: 1px solid rgba(226, 232, 240, 0.9);
  min-height: 540px;
  h5 {
    margin: 0;
  }
}

.detail-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 12px;
}

.detail-header__topbar {
  width: 100%;
  display: flex;
  justify-content: flex-start;
}

.detail-header__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: color 0.18s ease, transform 0.18s ease;
}

.detail-header__back:hover,
.detail-header__back:focus-visible {
  color: #2563eb;
  transform: translateX(-1px);
  outline: none;
}

.detail-header__back-icon {
  font-size: 13px;
  line-height: 1;
}

.detail-header__main {
  text-align: left;
}

.detail-header__eyebrow {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.detail-header__main h5 {
  margin: 8px 0 6px;
  font-size: 22px;
  line-height: 1.2;
  color: #0f172a;
}

.detail-header__code {
  font-size: 12px;
  color: #64748b;
}

.detail-header__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(96px, 1fr));
  gap: 8px;
  min-width: 320px;
}

.detail-stat {
  padding: 10px 12px;
  text-align: left;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.detail-stat__label {
  font-size: 11px;
  color: #64748b;
}

.detail-stat__value {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.detail-stat.up .detail-stat__value {
  color: #f56c6c;
}

.detail-stat.up {
  background: linear-gradient(180deg, rgba(254, 242, 242, 0.98), rgba(255, 255, 255, 0.82));
  border-color: rgba(245, 108, 108, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 8px 18px rgba(245, 108, 108, 0.08);
}

.detail-stat.down .detail-stat__value {
  color: #4eb61b;
}

.detail-stat.down {
  background: linear-gradient(180deg, rgba(240, 253, 244, 0.98), rgba(255, 255, 255, 0.82));
  border-color: rgba(78, 182, 27, 0.26);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 8px 18px rgba(78, 182, 27, 0.08);
}

.manual-tabs {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  padding: 3px;
  margin: 0 6px 12px;
  border-radius: 14px;
  border: 1px solid rgba(219, 228, 240, 0.68);
  background: linear-gradient(180deg, rgba(247, 249, 252, 0.96), rgba(241, 245, 249, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  overflow: hidden;
}

.manual-tabs__cursor {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 6px) / var(--detail-tab-count, 5));
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.16);
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.18), rgba(59, 130, 246, 0.11));
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 8px 16px rgba(59, 130, 246, 0.16);
  transform: translateX(calc(var(--detail-tab-index, 0) * 100%));
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.16s ease;
  pointer-events: none;
  z-index: 0;
}

.tab-btn {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  cursor: pointer;
  background: transparent;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  outline: none;
  border: 1px solid transparent;
  transition: color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.tab-btn:hover,
.tab-btn:focus-visible {
  color: #0f172a;
  background: transparent;
  box-shadow: none;
}

.tab-btn:focus-visible {
  outline: none;
}

.tab-btn.active {
  background: transparent;
  border-color: transparent;
  color: #2563eb;
  box-shadow: none;
}

.btn {
  display: inline-block;
  line-height: 1;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.88);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin: 0 5px;
  outline: none;
  border: 1px solid #dbe4f0;
}

.detail-panel {
  padding: 0 6px;
  overflow: visible;
  min-height: 320px;
}


.holding-box {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 14px;
  padding: 14px 10px 10px;

  h5 {
    margin: 0;
    padding: 0 0 10px;
    color: #475569;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  th,
  td {
    text-align: left;
    line-height: 24px;
    min-height: 24px;
    padding: 6px 8px;
  }

  th {
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
  }
}

.holding-box th.holding-box__th {
  text-align: left;
}

.holding-box__title {
  text-align: left;
}

.holding-section + .holding-section {
  margin-top: 14px;
}

.holding-section {
  padding: 12px 12px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.holding-section__header {
  margin: 0 0 8px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

.holding-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.holding-item__title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.holding-item__meta {
  font-size: 11px;
  color: #64748b;
}

.holding-ratio-pill,
.holding-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.holding-ratio-pill {
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.1);
}

.holding-status-pill--warn {
  color: #b45309;
  background: rgba(245, 158, 11, 0.14);
}

.holding-status-pill--muted {
  color: #475569;
  background: rgba(148, 163, 184, 0.14);
}

.holding-box__row {
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.holding-box__row--static {
  cursor: default;
}

.holding-box__row:hover {
  background: rgba(59, 130, 246, 0.06);
}

.holding-box td.holding-box__cell {
  text-align: left;
  color: #2563eb;
}

.holding-box td.holding-box__cell--rich {
  color: inherit;
}

.holding-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: #64748b;
}

.holding-state__title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.holding-state__desc {
  max-width: 320px;
  font-size: 12px;
  line-height: 1.6;
}

.holding-state--error .holding-state__title {
  color: #d14343;
}

.empty-cell {
  text-align: center;
  color: #94a3b8;
}

.up {
  color: #f56c6c;
  font-weight: bold;
}

.down {
  color: #4eb61b;
  font-weight: bold;
}

.fund-detail-shell.darkMode {
  .content-box {
    background: linear-gradient(180deg, #171b22 0%, #1d222b 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: none;
  }

  .detail-header__eyebrow,
  .detail-header__code,
  .detail-stat__label,
  .holding-state,
  .holding-state__desc {
    color: rgba($color: #ffffff, $alpha: 0.6);
  }

  .detail-header__main h5,
  .detail-stat__value,
  .holding-state__title {
    color: rgba($color: #ffffff, $alpha: 0.92);
  }

  .detail-stat.up .detail-stat__value {
    color: #ff8a80;
  }

  .detail-stat.down .detail-stat__value {
    color: #5ad08a;
  }

  .detail-header__back {
    color: rgba($color: #ffffff, $alpha: 0.72);
  }

  .detail-header__back:hover,
  .detail-header__back:focus-visible {
    color: rgba($color: #90c2ff, $alpha: 0.96);
  }

  .detail-stat {
    background: rgba($color: #ffffff, $alpha: 0.04);
    border-color: rgba($color: #ffffff, $alpha: 0.08);
    box-shadow: none;
  }

  .detail-stat.up {
    background: linear-gradient(180deg, rgba(122, 34, 34, 0.28), rgba(255, 255, 255, 0.04));
    border-color: rgba(245, 108, 108, 0.26);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);
  }

  .detail-stat.down {
    background: linear-gradient(180deg, rgba(24, 76, 31, 0.3), rgba(255, 255, 255, 0.04));
    border-color: rgba(78, 182, 27, 0.24);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);
  }

  .btn,
  .tab-btn {
    background-color: rgba($color: #ffffff, $alpha: 0.08);
    color: rgba($color: #ffffff, $alpha: 0.72);
    border: 1px solid rgba($color: #ffffff, $alpha: 0.1);
  }

  .manual-tabs {
    border-color: rgba($color: #ffffff, $alpha: 0.06);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .manual-tabs__cursor {
    border-color: rgba(90, 164, 255, 0.36);
    background: linear-gradient(135deg, rgba(90, 164, 255, 0.78), rgba(59, 130, 246, 0.78));
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.2);
  }

  .tab-btn {
    background: transparent;
    border-color: transparent;
    color: rgba($color: #ffffff, $alpha: 0.72);
  }

  .tab-btn:hover,
  .tab-btn:focus-visible {
    color: rgba($color: #ffffff, $alpha: 0.92);
    background: transparent;
    box-shadow: none;
  }

  .tab-btn.active {
    background: transparent;
    color: rgba($color: #ffffff, $alpha: 0.96);
    border-color: transparent;
    box-shadow: none;
  }

  .holding-box {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .holding-section {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: none;
  }

  .holding-box__row:hover {
    background: rgba(90, 164, 255, 0.12);
  }

  .holding-item__title {
    color: rgba($color: #ffffff, $alpha: 0.92);
  }

  .holding-item__meta {
    color: rgba($color: #ffffff, $alpha: 0.55);
  }

  .holding-ratio-pill {
    color: rgba($color: #9cc7ff, $alpha: 0.96);
    background: rgba(90, 164, 255, 0.14);
  }

  .holding-status-pill--warn {
    color: #f7c66b;
    background: rgba(245, 158, 11, 0.18);
  }

  .holding-status-pill--muted {
    color: rgba($color: #ffffff, $alpha: 0.66);
    background: rgba(148, 163, 184, 0.16);
  }

  .holding-box td {
    color: rgba($color: #ffffff, $alpha: 0.84);
  }

  .holding-box td.up {
    color: #f56c6c;
  }

  .holding-box td.down {
    color: #4eb61b;
  }

  .holding-box h5,
  .holding-box th,
  .empty-cell,
  .holding-section__header {
    color: rgba($color: #ffffff, $alpha: 0.6);
  }

  .holding-box__stock {
    color: rgba($color: #90c2ff, $alpha: 0.92);
  }

  ::v-deep .el-radio-button--mini .el-radio-button__inner {
    background-color: rgba($color: #ffffff, $alpha: 0.16);
    color: rgba($color: #ffffff, $alpha: 0.6);
    border: 1px solid rgba($color: #ffffff, $alpha: 0.37);
  }

  ::v-deep .el-radio-button__orig-radio:checked + .el-radio-button__inner {
    background-color: rgba($color: #409eff, $alpha: 0.6);
    color: rgba($color: #ffffff, $alpha: 0.6);
    border-color: rgba($color: #409eff, $alpha: 0.37);
  }
}
</style>
