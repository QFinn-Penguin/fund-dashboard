<template>
  <div
    class="box"
    :class="{ 'box--dark': darkMode }"
    v-loading="loading"
    :element-loading-background="
      darkMode ? 'rgba(2, 6, 23, 0.82)' : 'rgba(255, 255, 255, 0.82)'
    "
  >
    <div class="panel-summary">
      <div class="panel-summary__meta">
        <span class="panel-summary__eyebrow">债市风向</span>
        <strong>{{ strongestBond.name }}</strong>
        <span :class="changeClass(strongestBond.change)">
          {{ formatChange(strongestBond.change) }}
        </span>
      </div>
      <div class="panel-summary__side">
        <div class="panel-summary__hint">
          用债券 ETF 的日内涨跌，快速感知固收资产今天偏稳还是偏强。
        </div>
        <div class="panel-summary__chips">
          <span class="panel-chip">债券 ETF</span>
          <span class="panel-chip">固收体感</span>
        </div>
      </div>
    </div>

    <div class="main-echarts" ref="mainCharts"></div>

    <ul class="metric-list">
      <li v-for="item in bondList" :key="item.code" class="metric-item">
        <div class="metric-item__title-row">
          <span class="metric-item__title">{{ item.shortName }}</span>
          <span class="metric-item__price">{{ formatPrice(item.price) }}</span>
        </div>
        <div class="metric-item__meta-row">
          <span class="metric-item__label">{{ item.name }}</span>
          <span :class="['metric-item__change', changeClass(item.change)]">
            {{ formatChange(item.change) }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
let echarts = require("echarts/lib/echarts");
import "./js/customed.js";
import "./js/dark.js";
import { requestWithBackground } from "./request";

require("echarts/lib/chart/bar");
require("echarts/lib/component/tooltip");
require("echarts/lib/component/legend");

const BOND_ITEMS = [
  { code: "1.511130", shortName: "30年国债", name: "30年国债ETF" },
  { code: "1.511060", shortName: "地方债", name: "5年地方债ETF" },
  { code: "1.511260", shortName: "10年国债", name: "十年国债ETF" },
  { code: "1.511010", shortName: "国债ETF", name: "国债ETF" },
  { code: "1.511220", shortName: "城投债", name: "城投债ETF" },
];

export default {
  name: "marketBondRadar",
  props: {
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      chartEL: null,
      myChart: null,
      option: {},
      loading: false,
      bondList: BOND_ITEMS.map(item => ({
        ...item,
        price: 0,
        change: 0,
      })),
    };
  },
  computed: {
    strongestBond() {
      return this.bondList.reduce((best, item) => {
        return Number(item.change) > Number(best.change) ? item : best;
      }, this.bondList[0] || { name: "--", change: 0 });
    },
    axisColor() {
      return this.darkMode ? "rgba(148, 163, 184, 0.34)" : "rgba(148, 163, 184, 0.26)";
    },
    axisLabelColor() {
      return this.darkMode ? "rgba(226, 232, 240, 0.72)" : "#64748b";
    },
    tooltipTheme() {
      return this.darkMode
        ? {
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            borderColor: "rgba(96, 165, 250, 0.2)",
            textColor: "rgba(241, 245, 249, 0.94)",
          }
        : {
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            borderColor: "rgba(148, 163, 184, 0.22)",
            textColor: "#0f172a",
          };
    },
    positiveBarColor() {
      return this.darkMode
        ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(125, 211, 252, 0.94)" },
            { offset: 1, color: "rgba(56, 189, 248, 0.42)" },
          ])
        : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(56, 189, 248, 0.88)" },
            { offset: 1, color: "rgba(14, 165, 233, 0.3)" },
          ]);
    },
    negativeBarColor() {
      return this.darkMode
        ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(226, 232, 240, 0.82)" },
            { offset: 1, color: "rgba(148, 163, 184, 0.32)" },
          ])
        : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(203, 213, 225, 0.86)" },
            { offset: 1, color: "rgba(148, 163, 184, 0.26)" },
          ]);
    },
  },
  mounted() {
    this.init();
  },
  beforeDestroy() {
    if (this.myChart) {
      if (typeof this.myChart.clear === "function") {
        this.myChart.clear();
      }
      if (typeof this.myChart.dispose === "function") {
        this.myChart.dispose();
      }
      this.myChart = null;
    }
  },
  methods: {
    init() {
      this.chartEL = this.$refs.mainCharts;
      this.myChart = echarts.init(this.chartEL, this.darkMode ? "dark" : "customed");
      this.option = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
            shadowStyle: {
              color: this.darkMode ? "rgba(96, 165, 250, 0.08)" : "rgba(59, 130, 246, 0.06)",
            },
          },
          backgroundColor: this.tooltipTheme.backgroundColor,
          borderColor: this.tooltipTheme.borderColor,
          borderWidth: 1,
          padding: [10, 12],
          textStyle: {
            color: this.tooltipTheme.textColor,
          },
          extraCssText:
            "border-radius: 14px; box-shadow: 0 16px 36px rgba(15, 23, 42, 0.16);",
          formatter: params => {
            const item = this.bondList[params[0].dataIndex] || {};
            return `<div style="display:flex;flex-direction:column;gap:8px;min-width:180px;">
              <div style="font-size:11px;opacity:0.72;">${item.name}</div>
              <div style="display:flex;justify-content:space-between;gap:12px;"><span>现价</span><strong>${this.formatPrice(
                item.price
              )}</strong></div>
              <div style="display:flex;justify-content:space-between;gap:12px;"><span>涨跌幅</span><strong>${this.formatChange(
                item.change
              )}</strong></div>
            </div>`;
          },
        },
        grid: {
          top: 20,
          left: 10,
          right: 10,
          bottom: 10,
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: this.bondList.map(item => item.shortName),
          axisLabel: {
            color: this.axisLabelColor,
            fontSize: 11,
            margin: 12,
          },
          axisLine: {
            lineStyle: {
              color: this.axisColor,
            },
          },
          axisTick: {
            show: false,
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            color: this.axisLabelColor,
            formatter: val => `${Number(val).toFixed(2)}%`,
          },
          splitLine: {
            lineStyle: {
              type: "dashed",
              color: this.axisColor,
            },
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
        },
        series: [
          {
            type: "bar",
            barWidth: 18,
            data: [],
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
              color: params => this.getBarColor(params.value),
            },
            barMaxWidth: 18,
          },
        ],
      };
      this.getData();
    },
    getData() {
      this.loading = true;
      let url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f12,f13,f14&secids=${BOND_ITEMS.map(
        item => item.code
      ).join(",")}&_=${new Date().getTime()}`;
      requestWithBackground({ method: "get", url })
        .then(res => {
          let diff =
            res.data && res.data.data && Array.isArray(res.data.data.diff)
              ? res.data.data.diff
              : [];

          this.bondList = BOND_ITEMS.map(item => {
            const found = diff.find(entry => `${entry.f13}.${entry.f12}` === item.code) || {};
            return {
              ...item,
              price: Number(found.f2) || 0,
              change: Number(found.f3) || 0,
            };
          });

          this.option.xAxis.data = this.bondList.map(item => item.shortName);
          this.option.series[0].data = this.bondList.map(item => Number(item.change) || 0);
          this.myChart.setOption(this.option, true);
        })
        .catch(() => {
          this.bondList = BOND_ITEMS.map(item => ({
            ...item,
            price: 0,
            change: 0,
          }));
          this.option.xAxis.data = this.bondList.map(item => item.shortName);
          this.option.series[0].data = [];
          this.myChart.setOption(this.option, true);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    getBarColor(value) {
      return value >= 0 ? this.positiveBarColor : this.negativeBarColor;
    },
    changeClass(value) {
      return Number(value) >= 0 ? "is-up" : "is-down";
    },
    formatChange(value) {
      const num = Number(value) || 0;
      return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
    },
    formatPrice(value) {
      const num = Number(value) || 0;
      return num.toFixed(3);
    },
  },
};
</script>

<style lang="scss" scoped>
.box {
  width: 100%;
  min-height: 100%;
  padding: 16px 16px 14px;
  box-sizing: border-box;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.92));
  border: 1px solid rgba(226, 232, 240, 0.96);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.box--dark {
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.14), transparent 36%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.82));
  border-color: rgba(148, 163, 184, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.panel-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 10px;
}

.panel-summary__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #0f172a;

  strong {
    font-size: 16px;
    line-height: 1.2;
  }
}

.box--dark .panel-summary__meta {
  color: rgba(241, 245, 249, 0.94);
}

.panel-summary__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.panel-summary__hint {
  max-width: 180px;
  text-align: right;
  font-size: 11px;
  line-height: 1.6;
  color: #64748b;
}

.panel-summary__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.panel-summary__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.panel-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.78);
  color: #475569;
  font-size: 10px;
  font-weight: 700;
}

.box--dark .panel-summary__hint {
  color: rgba(148, 163, 184, 0.78);
}

.box--dark .panel-chip {
  background: rgba(15, 23, 42, 0.72);
  border-color: rgba(148, 163, 184, 0.18);
  color: rgba(226, 232, 240, 0.82);
}

.main-echarts {
  width: 100%;
  height: 214px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(248, 250, 252, 0.52));
  border: 1px solid rgba(226, 232, 240, 0.74);
}

.metric-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.metric-item {
  padding: 11px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84), 0 10px 22px rgba(15, 23, 42, 0.04);
}

.box--dark .metric-item {
  background: rgba(15, 23, 42, 0.56);
  border-color: rgba(148, 163, 184, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.metric-item__title-row,
.metric-item__meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.metric-item__meta-row {
  margin-top: 8px;
}

.metric-item__title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.box--dark .metric-item__title {
  color: rgba(241, 245, 249, 0.94);
}

.metric-item__price,
.metric-item__label {
  font-size: 11px;
  color: #64748b;
}

.metric-item__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.box--dark .metric-item__price,
.box--dark .metric-item__label {
  color: rgba(148, 163, 184, 0.78);
}

.metric-item__change,
.panel-summary__meta .is-up,
.panel-summary__meta .is-down {
  font-size: 12px;
  font-weight: 700;
}

.is-up {
  color: #0284c7;
}

.is-down {
  color: #64748b;
}

.box--dark .is-up {
  color: rgba(125, 211, 252, 0.94);
}

.box--dark .is-down {
  color: rgba(203, 213, 225, 0.88);
}
</style>
