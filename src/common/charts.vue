<template>
  <div class="chart-wrap" :class="{ 'chart-wrap--dark': darkMode }">
    <div
      v-loading="loading"
      :element-loading-background="
        darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
      "
      class="main-echarts"
      ref="mainCharts"
    ></div>
    <div v-if="emptyText" class="empty-text">{{ emptyText }}</div>
    <div v-if="chartTrustNote" class="chart-trust-note">{{ chartTrustNote }}</div>
  </div>
</template>

<script>
let echarts = require("echarts/lib/echarts");

import "./js/customed.js";
import "./js/dark.js";
import { requestWithBackground } from "./request";

require("echarts/lib/chart/line");

require("echarts/lib/component/markArea");
require("echarts/lib/component/markLine");
require("echarts/lib/component/markPoint");
require("echarts/lib/component/tooltip");
require("echarts/lib/component/legend");

export default {
  name: "chatrs",
  props: {
    darkMode: {
      type: Boolean,
      default: false,
    },
    fund: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      chartEL: null,
      myChart: null,
      minVal: null,
      maxVal: null,
      interVal: null,
      option: {},
      DWJZ: 0,
      loading: false,
      emptyText: "",
      chartTrustNote: "盘中估值为实时估算值，最终以正式净值为准",
      timeData: [
        "09:30",
        "09:31",
        "09:32",
        "09:33",
        "09:34",
        "09:35",
        "09:36",
        "09:37",
        "09:38",
        "09:39",
        "09:40",
        "09:41",
        "09:42",
        "09:43",
        "09:44",
        "09:45",
        "09:46",
        "09:47",
        "09:48",
        "09:49",
        "09:50",
        "09:51",
        "09:52",
        "09:53",
        "09:54",
        "09:55",
        "09:56",
        "09:57",
        "09:58",
        "09:59",
        "10:00",
        "10:01",
        "10:02",
        "10:03",
        "10:04",
        "10:05",
        "10:06",
        "10:07",
        "10:08",
        "10:09",
        "10:10",
        "10:11",
        "10:12",
        "10:13",
        "10:14",
        "10:15",
        "10:16",
        "10:17",
        "10:18",
        "10:19",
        "10:20",
        "10:21",
        "10:22",
        "10:23",
        "10:24",
        "10:25",
        "10:26",
        "10:27",
        "10:28",
        "10:29",
        "10:30",
        "10:31",
        "10:32",
        "10:33",
        "10:34",
        "10:35",
        "10:36",
        "10:37",
        "10:38",
        "10:39",
        "10:40",
        "10:41",
        "10:42",
        "10:43",
        "10:44",
        "10:45",
        "10:46",
        "10:47",
        "10:48",
        "10:49",
        "10:50",
        "10:51",
        "10:52",
        "10:53",
        "10:54",
        "10:55",
        "10:56",
        "10:57",
        "10:58",
        "10:59",
        "11:00",
        "11:01",
        "11:02",
        "11:03",
        "11:04",
        "11:05",
        "11:06",
        "11:07",
        "11:08",
        "11:09",
        "11:10",
        "11:11",
        "11:12",
        "11:13",
        "11:14",
        "11:15",
        "11:16",
        "11:17",
        "11:18",
        "11:19",
        "11:20",
        "11:21",
        "11:22",
        "11:23",
        "11:24",
        "11:25",
        "11:26",
        "11:27",
        "11:28",
        "11:29",
        "11:30",
        "13:00",
        "13:01",
        "13:02",
        "13:03",
        "13:04",
        "13:05",
        "13:06",
        "13:07",
        "13:08",
        "13:09",
        "13:10",
        "13:11",
        "13:12",
        "13:13",
        "13:14",
        "13:15",
        "13:16",
        "13:17",
        "13:18",
        "13:19",
        "13:20",
        "13:21",
        "13:22",
        "13:23",
        "13:24",
        "13:25",
        "13:26",
        "13:27",
        "13:28",
        "13:29",
        "13:30",
        "13:31",
        "13:32",
        "13:33",
        "13:34",
        "13:35",
        "13:36",
        "13:37",
        "13:38",
        "13:39",
        "13:40",
        "13:41",
        "13:42",
        "13:43",
        "13:44",
        "13:45",
        "13:46",
        "13:47",
        "13:48",
        "13:49",
        "13:50",
        "13:51",
        "13:52",
        "13:53",
        "13:54",
        "13:55",
        "13:56",
        "13:57",
        "13:58",
        "13:59",
        "14:00",
        "14:01",
        "14:02",
        "14:03",
        "14:04",
        "14:05",
        "14:06",
        "14:07",
        "14:08",
        "14:09",
        "14:10",
        "14:11",
        "14:12",
        "14:13",
        "14:14",
        "14:15",
        "14:16",
        "14:17",
        "14:18",
        "14:19",
        "14:20",
        "14:21",
        "14:22",
        "14:23",
        "14:24",
        "14:25",
        "14:26",
        "14:27",
        "14:28",
        "14:29",
        "14:30",
        "14:31",
        "14:32",
        "14:33",
        "14:34",
        "14:35",
        "14:36",
        "14:37",
        "14:38",
        "14:39",
        "14:40",
        "14:41",
        "14:42",
        "14:43",
        "14:44",
        "14:45",
        "14:46",
        "14:47",
        "14:48",
        "14:49",
        "14:50",
        "14:51",
        "14:52",
        "14:53",
        "14:54",
        "14:55",
        "14:56",
        "14:57",
        "14:58",
        "14:59",
        "15:00",
      ],
    };
  },
  watch: {},
  computed: {
    defaultColor() {
      return this.darkMode ? "rgba(148,163,184,0.26)" : "rgba(148,163,184,0.22)";
    },
    defaultLabelColor() {
      return this.darkMode ? "rgba(226,232,240,0.72)" : "#475569";
    },
    legendTextColor() {
      return this.darkMode ? "rgba(226,232,240,0.78)" : "#475569";
    },
    tooltipTheme() {
      return this.darkMode
        ? {
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            borderColor: "rgba(96, 165, 250, 0.24)",
            textStyle: {
              color: "rgba(241, 245, 249, 0.94)",
            },
          }
        : {
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            borderColor: "rgba(148, 163, 184, 0.22)",
            textStyle: {
              color: "#0f172a",
            },
          };
    },
    chartLineColor() {
      return this.darkMode ? "#60a5fa" : "#2563eb";
    },
    chartSecondaryColor() {
      return this.darkMode ? "#34d399" : "#10b981";
    },
    chartAreaStart() {
      return this.darkMode ? "rgba(96, 165, 250, 0.26)" : "rgba(59, 130, 246, 0.2)";
    },
    chartAreaEnd() {
      return this.darkMode ? "rgba(96, 165, 250, 0.03)" : "rgba(59, 130, 246, 0.02)";
    },
    positiveZoneColor() {
      return this.darkMode ? "rgba(245, 108, 108, 0.06)" : "rgba(245, 108, 108, 0.08)";
    },
    negativeZoneColor() {
      return this.darkMode ? "rgba(78, 182, 27, 0.06)" : "rgba(78, 182, 27, 0.08)";
    },
    latestPointFillColor() {
      return this.darkMode ? "#bfdbfe" : "#ffffff";
    },
    latestLabelTheme() {
      return {
        backgroundColor: this.darkMode
          ? "rgba(15, 23, 42, 0.92)"
          : "rgba(255, 255, 255, 0.96)",
        borderColor: this.darkMode
          ? "rgba(96, 165, 250, 0.3)"
          : "rgba(37, 99, 235, 0.18)",
        color: this.darkMode ? "#eff6ff" : "#1e3a8a",
      };
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
        legend: this.getBaseLegend(false),
        tooltip: {
          trigger: "axis",
          backgroundColor: this.tooltipTheme.backgroundColor,
          borderColor: this.tooltipTheme.borderColor,
          borderWidth: 1,
          padding: [10, 12],
          textStyle: this.tooltipTheme.textStyle,
          extraCssText: "border-radius: 12px; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);",
          formatter: (p) => {
            return `时间：${p[0].name}<br />估算涨跌幅：${
              Number(p[0].value).toFixed(2)
            }%<br />估算净值：${(this.DWJZ * (1 + 0.01 * p[0].value)).toFixed(
              4
            )}元`;
          },
        },
        grid: {
          top: 24,
          right: 10,
          bottom: 26,
          left: 10,
          containLabel: true,
        },
        graphic: [],
        xAxis: {
          type: "category",
          data: this.timeData,
          position: "bottom",
          axisLabel: {
            formatter: this.fmtAxis,
            interval: this.fmtVal,
            color: this.defaultLabelColor,
            fontSize: 10,
            margin: 12,
          },
          axisLine: {
            onZero: false,
            lineStyle: {
              color: this.defaultColor,
            },
          },
          axisTick: {
            show: false,
          },
        },
        yAxis: [
          {
            type: "value",
            axisLabel: {
              color: this.yAxisLabelColor,
              formatter: (val) => {
                return val.toFixed(2) + "%";
              },
            },
            splitLine: {
              show: true,
              lineStyle: {
                type: "dashed",
                color: this.defaultColor,
              },
            },
            axisLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            data: [],
          },
          {
            type: "value",
            axisLabel: {
              color: this.yAxisLabelColor,
              formatter: (val) => {
                return (this.DWJZ * (1 + 0.01 * val)).toFixed(4);
              },
            },
            splitLine: {
              show: false,
            },
            axisLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            data: [],
          },
        ],
        series: [
          {
            name: "估算涨跌幅",
            type: "line",
            smooth: true,
            showSymbol: false,
            symbol: "circle",
            symbolSize: 6,
            data: [],
            lineStyle: {
              width: 2.5,
              color: this.chartLineColor,
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: this.chartAreaStart,
                },
                {
                  offset: 1,
                  color: this.chartAreaEnd,
                },
              ]),
            },
            emphasis: {
              focus: "series",
              itemStyle: {
                color: this.chartLineColor,
                borderColor: this.darkMode ? "#0f172a" : "#ffffff",
                borderWidth: 2,
              },
            },
            markArea: {
              silent: true,
              animation: false,
              label: {
                show: false,
              },
              data: [],
            },
            markPoint: {
              symbol: "circle",
              symbolSize: 10,
              label: {
                show: true,
                position: "top",
                distance: 10,
                padding: [4, 8],
                borderRadius: 999,
                backgroundColor: this.latestLabelTheme.backgroundColor,
                borderColor: this.latestLabelTheme.borderColor,
                borderWidth: 1,
                color: this.latestLabelTheme.color,
                fontSize: 10,
                fontWeight: 700,
                formatter: ({ value }) => `${Number(value).toFixed(2)}%`,
              },
              itemStyle: {
                color: this.latestPointFillColor,
                borderColor: this.chartLineColor,
                borderWidth: 3,
                shadowBlur: 12,
                shadowColor: this.darkMode ? "rgba(96, 165, 250, 0.28)" : "rgba(37, 99, 235, 0.22)",
              },
              data: [],
            },
            markLine: {
              silent: true,
              symbol: "none",
              animation: false,
              label: {
                show: false,
              },
              lineStyle: {
                type: "solid",
                color: this.darkMode ? "rgba(148,163,184,0.44)" : "rgba(148,163,184,0.54)",
              },
              data: [
                {
                  yAxis: 0,
                },
              ],
            },
          },
          {
            name: "估算净值",
            type: "line",
            symbol: "none",
            data: [],
            yAxisIndex: 1,
            lineStyle: {
              width: 1.75,
              color: this.chartSecondaryColor,
              opacity: 0.72,
            },
            tooltip: {
              show: false,
            },
          },
        ],
      };
      this.getData();
    },
    getBaseLegend(show = true) {
      return {
        show,
        top: 0,
        right: 8,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
        textStyle: {
          color: this.legendTextColor,
          fontSize: 11,
        },
      };
    },

    fmtAxis(val, ind) {
      if (val == "13:00") {
        return "11:30/13:00";
      } else {
        return val;
      }
    },
    fmtVal(ind, val) {
      let arr = ["09:30", "10:30", "13:00", "14:00", "15:00"];
      if (arr.indexOf(val) != -1) {
        return true;
      } else {
        return false;
      }
    },
    yAxisLabelColor(val, ind) {
      return val > 0
        ? "#f56c6c"
        : val == 0
        ? this.defaultLabelColor
        : "#4eb61b";
    },
    handle_num(data) {
      var _aa = Math.abs(Math.max.apply(null, data)).toFixed(2);
      var _bb = Math.abs(Math.min.apply(null, data)).toFixed(2);
      return _aa > _bb ? _aa : _bb;
    },
    buildZoneAreas(axisMin, axisMax) {
      const areas = [];

      if (axisMax > 0) {
        areas.push([
          {
            yAxis: 0,
            itemStyle: {
              color: this.positiveZoneColor,
            },
          },
          {
            yAxis: axisMax,
          },
        ]);
      }

      if (axisMin < 0) {
        areas.push([
          {
            yAxis: axisMin,
            itemStyle: {
              color: this.negativeZoneColor,
            },
          },
          {
            yAxis: 0,
          },
        ]);
      }

      return areas;
    },
    updateChartVisuals(seriesData = [], labelFormatter) {
      const numericSeries = seriesData.map((item) => Number(item) || 0);
      const lastIndex = numericSeries.length - 1;
      const latestValue = lastIndex >= 0 ? numericSeries[lastIndex] : 0;
      const xAxisData = Array.isArray(this.option.xAxis.data)
        ? this.option.xAxis.data
        : [];
      const latestXAxis = lastIndex >= 0 ? xAxisData[lastIndex] : undefined;

      this.option.series[0].markPoint.data =
        lastIndex >= 0 && latestXAxis !== undefined
          ? [
              {
                coord: [latestXAxis, latestValue],
                value: latestValue,
                dataIndex: lastIndex,
              },
            ]
          : [];

      if (this.option.series[0].markPoint.label) {
        this.option.series[0].markPoint.label.formatter = labelFormatter;
      }

      const axisMax = Number(this.option.yAxis[0].max) || 0;
      const axisMin = Number(this.option.yAxis[0].min) || 0;
      this.option.series[0].markArea.data = this.buildZoneAreas(
        axisMin,
        axisMax
      );
      this.option.legend = this.getBaseLegend(false);
      this.option.graphic = [];
    },
    getData() {
      this.loading = true;
      this.emptyText = "";
      let url = `https://fundmobapi.eastmoney.com/FundMApi/FundVarietieValuationDetail.ashx?FCODE=${
        this.fund.fundcode
      }&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${new Date().getTime()}`;
      requestWithBackground({
        method: "get",
        url,
      })
        .then((res) => {
          const rawDataList = Array.isArray(res.data && res.data.Datas)
            ? res.data.Datas
            : [];

          if (!rawDataList.length) {
            return this.loadNetDiagramFallback();
          }

          let dataList = rawDataList.map((item) => item.split(","));
          this.option.series[0].data = dataList.map((item) =>
            (+item[2]).toFixed(2)
          );
          this.option.series[1].data = dataList.map((item) =>
            (+item[2]).toFixed(2)
          );
          let aa = this.handle_num(this.option.series[0].data);
          this.DWJZ = res.data.Expansion ? res.data.Expansion.DWJZ : 0;
          this.option.yAxis[0].min = -aa;
          this.option.yAxis[0].max = aa;
          this.option.yAxis[0].interval = aa / 4;
          this.option.yAxis[1].min = -aa;
          this.option.yAxis[1].max = aa;
          this.option.yAxis[1].interval = aa / 4;
          this.option.xAxis.data = this.timeData;
          this.updateChartVisuals(
            this.option.series[0].data,
            ({ value }) => `当前 ${Number(value).toFixed(2)}%`
          );
          this.myChart.setOption(this.option);
        })
        .catch(() => {
          return this.loadNetDiagramFallback();
        })
        .finally(() => {
          this.loading = false;
        });
    },
    loadNetDiagramFallback() {
      let fallbackUrl = `https://fundmobapi.eastmoney.com/FundMApi/FundNetDiagram.ashx?FCODE=${
        this.fund.fundcode
      }&RANGE=y&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&_=${new Date().getTime()}`;

      return requestWithBackground({
        method: "get",
        url: fallbackUrl,
      })
        .then((res) => {
          const rawDataList = Array.isArray(res.data && res.data.Datas)
            ? res.data.Datas
            : [];

          if (!rawDataList.length) {
            this.option.series[0].data = [];
            this.option.series[1].data = [];
            this.myChart.setOption(this.option);
            this.emptyText = "暂无净值估算数据";
            return;
          }

          const latestList = rawDataList.slice(-20);
          const percentSeries = latestList.map((item) => +item.JZZZL || 0);
          const maxRange = Number(this.handle_num(percentSeries)) || 1;
          this.DWJZ = +latestList[latestList.length - 1].DWJZ || 0;
          this.option.tooltip.formatter = (p) => {
            const current = latestList[p[0].dataIndex] || {};
            return `日期：${p[0].name}<br />日涨跌幅：${p[0].value}%<br />单位净值：${
              current.DWJZ || "--"
            }`;
          };
          this.option.xAxis.data = latestList.map((item) => item.FSRQ);
          this.option.series[0].data = percentSeries.map((item) => item.toFixed(2));
          this.option.series[1].data = latestList.map((item) => +item.DWJZ || 0);
          this.option.yAxis[0].min = -maxRange;
          this.option.yAxis[0].max = maxRange;
          this.option.yAxis[0].interval = maxRange / 4;
          this.option.yAxis[1].min = -maxRange;
          this.option.yAxis[1].max = maxRange;
          this.option.yAxis[1].interval = maxRange / 4;
          this.updateChartVisuals(
            this.option.series[0].data,
            ({ dataIndex }) => {
              const current = latestList[dataIndex] || {};
              return `当前 ${current.DWJZ || "--"}`;
            }
          );
          this.myChart.setOption(this.option);
          this.emptyText = "当前无盘中估算，已展示最近净值走势";
        })
        .catch(() => {
          this.option.series[0].data = [];
          this.option.series[1].data = [];
          this.myChart.setOption(this.option);
          this.emptyText = "暂无净值估算数据";
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.chart-wrap {
  position: relative;
  padding: 10px 10px 4px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(248, 250, 252, 0.66));
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.main-echarts {
  width: 100%;
  height: 260px;
}

.empty-text {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  text-align: center;
  font-size: 12px;
  color: #909399;
}

.chart-trust-note {
  margin-top: 4px;
  text-align: center;
  font-size: 11px;
  line-height: 1.5;
  color: #64748b;
}

.chart-wrap:deep(.echarts) {
  border-radius: 12px;
}

.chart-wrap--dark {
  background: linear-gradient(180deg, rgba(12, 18, 30, 0.96), rgba(7, 11, 20, 0.98));
  border-color: rgba(15, 23, 42, 0.92);
  box-shadow: 0 0 0 1px rgba(2, 6, 23, 0.45);
}

.chart-wrap--dark .empty-text {
  color: rgba(191, 219, 254, 0.66);
}

.chart-wrap--dark .chart-trust-note {
  color: rgba(191, 219, 254, 0.68);
}
</style>
