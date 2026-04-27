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
        <span class="panel-summary__eyebrow">行业热度</span>
        <strong>净流入靠前板块</strong>
        <span class="panel-summary__tag">跟基金行业暴露更贴近</span>
      </div>
      <div class="panel-summary__side">
        <div class="panel-summary__hint">看今天哪些行业更受资金偏好。</div>
        <div class="panel-summary__chips">
          <span class="panel-chip">Top 500</span>
          <span class="panel-chip">净流入排序</span>
        </div>
      </div>
    </div>
    <div class="main-echarts" ref="mainCharts"></div>
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

export default {
  name: "marketBar",
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
    };
  },

  watch: {},
    computed: {
      defaultColor() {
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
              { offset: 0, color: "rgba(252, 165, 165, 0.94)" },
              { offset: 1, color: "rgba(248, 113, 113, 0.42)" },
            ])
          : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(248, 113, 113, 0.9)" },
              { offset: 1, color: "rgba(239, 68, 68, 0.32)" },
            ]);
      },
      negativeBarColor() {
        return this.darkMode
          ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(134, 239, 172, 0.92)" },
              { offset: 1, color: "rgba(74, 222, 128, 0.38)" },
            ])
          : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(74, 222, 128, 0.88)" },
              { offset: 1, color: "rgba(34, 197, 94, 0.3)" },
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
      this.myChart = echarts.init(
        this.chartEL,
        this.darkMode ? "dark" : "customed"
      );
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
          formatter: (p) => {
            const rawValue = Number(p[0].value || 0);
            return `<div style="display:flex;flex-direction:column;gap:8px;min-width:160px;">
              <div style="font-size:11px;opacity:0.72;">${p[0].name}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                <span>净流入</span>
                <strong style="font-weight:700;">${(rawValue / 100000000).toFixed(2)} 亿元</strong>
              </div>
            </div>`;
          },
        },
        grid: {
          top: 20,
          left: 28,
          bottom: 88,
          right: 10,
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: [],
          axisLabel: {
            color: this.axisLabelColor,
            fontSize: 11,
            margin: 12,
            formatter: (value) => {
              return value.split("").join("\n");
            },
          },
          axisLine: {
            lineStyle: {
              color: this.defaultColor,
            },
          },
          axisTick: {
            show: false,
          },
        },
        yAxis: {
          type: "value",
          name: "单位：亿元",
          scale: true,
          nameLocation: "middle",
          nameGap: 36,
          splitNumber: 4,
          nameTextStyle: {
            color: this.axisLabelColor,
            padding: [0, 0, 10, 0],
          },
          axisLabel: {
            color: this.axisLabelColor,
            margin: 14,
            hideOverlap: true,
            formatter: (val) => {
              return (val / 100000000).toFixed(2);
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: "dashed",
              color: this.defaultColor,
            },
          },
          data: [],
        },
        dataZoom: [
          {
            type: "slider",
            show: true,
            xAxisIndex: [0],
            start: 0,
            end: 30,
            height: 16,
            bottom: 22,
            borderColor: "transparent",
            backgroundColor: this.darkMode
              ? "rgba(148, 163, 184, 0.08)"
              : "rgba(148, 163, 184, 0.12)",
            fillerColor: this.darkMode
              ? "rgba(96, 165, 250, 0.18)"
              : "rgba(59, 130, 246, 0.16)",
            handleStyle: {
              color: this.darkMode ? "rgba(148, 163, 184, 0.36)" : "rgba(148, 163, 184, 0.42)",
            },
          },
          {
            type: "inside",
            xAxisIndex: [0],
            start: 1,
            end: 30,
          },
        ],
        series: [
          {
            type: "bar",
            data: [],
          },
        ],
      };
      this.getData();
    },

    getData() {
      this.loading = true;
      let url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=500&po=1&np=1&fields=f12,f13,f14,f62&fid=f62&fs=m:90+t:2&_=${new Date().getTime()}`;
      requestWithBackground({ method: "get", url })
        .then((res) => {
          let dataList =
            res.data && res.data.data && Array.isArray(res.data.data.diff)
              ? res.data.data.diff
              : [];
          let xdata = [];
          let sdata = [];

          dataList.forEach((el) => {
            xdata.push(el.f14);
            sdata.push(el.f62);
          });

          this.option.xAxis.data = xdata;

          this.option.series = [
            {
              type: "bar",
              data: sdata,
              itemStyle: {
                color: data => {
                  return data.value >= 0 ? this.positiveBarColor : this.negativeBarColor;
                },
                borderRadius: [10, 10, 4, 4],
                shadowBlur: 10,
                shadowColor: data => {
                  return data.value >= 0
                    ? this.darkMode
                      ? "rgba(248, 113, 113, 0.2)"
                      : "rgba(239, 68, 68, 0.12)"
                    : this.darkMode
                    ? "rgba(74, 222, 128, 0.18)"
                    : "rgba(34, 197, 94, 0.1)";
                },
              },
              barMaxWidth: 18,
            },
          ];
          this.myChart.setOption(this.option);
        })
        .catch(() => {
          this.option.xAxis.data = [];
          this.option.series = [
            {
              type: "bar",
              data: [],
            },
          ];
          this.myChart.setOption(this.option);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    fmtAxis(val, ind) {
      if (val == "11:30") {
        return "11:30/13:00";
      } else {
        return val;
      }
    },
    fmtVal(ind, val) {
      let arr = ["09:30", "10:30", "11:30", "14:00", "15:00"];
      if (arr.indexOf(val) != -1) {
        return true;
      } else {
        return false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.box {
  width: 100%;
  height: 100%;
  padding: 16px 16px 14px;
  box-sizing: border-box;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 36%),
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

.panel-summary__tag {
  display: inline-flex;
  width: fit-content;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  color: #2563eb;
  font-size: 11px;
  font-weight: 600;
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

.box--dark .panel-summary__tag {
  background: rgba(96, 165, 250, 0.12);
  color: rgba(191, 219, 254, 0.94);
}

.panel-summary__hint {
  max-width: 180px;
  text-align: right;
  font-size: 11px;
  line-height: 1.6;
  color: #64748b;
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
  height: 316px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(248, 250, 252, 0.52));
  border: 1px solid rgba(226, 232, 240, 0.74);
}
</style>
