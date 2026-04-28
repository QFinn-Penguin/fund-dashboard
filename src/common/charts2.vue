<template>
  <div
    class="box"
    :class="{ 'box--dark': darkMode }"
    v-loading="loading"
    :element-loading-background="
      darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    "
  >
    <div class="main-echarts" ref="mainCharts"></div>
    <div v-if="emptyText" class="empty-text">{{ emptyText }}</div>
    <div class="chart-toolbar">
      <el-radio-group
        v-model="sltTimeRange"
        class="chart-range-group"
        @change="changeTimeRange"
      >
        <el-radio-button label="y">月</el-radio-button>
        <el-radio-button label="3y">季</el-radio-button>
        <el-radio-button label="6y">半年</el-radio-button>
        <el-radio-button label="n">一年</el-radio-button>
        <el-radio-button label="3n">三年</el-radio-button>
        <el-radio-button label="5n">五年</el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script>
let echarts = require("echarts/lib/echarts");

import "./js/customed.js";
import "./js/dark.js";
import {
  fetchFundNetDiagram,
  fetchFundYieldDiagram,
} from "./fundDetailEnhance";
require("echarts/lib/chart/line");

require("echarts/lib/component/tooltip");
require("echarts/lib/component/legend");
require("echarts/lib/component/markPoint");

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
    chartType: {
      type: String,
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
      sltTimeRange: "y",
      chartTypeList: {
        JZ: {
          name: "历史净值",
        },
        LJSY: {
          name: "累计收益",
        },
      },
      option: {},
      loading: false,
      emptyText: "",
      requestVersion: 0,
    };
  },

  watch: {
    "fund.fundcode": {
      handler(val) {
        if (!val || !this.myChart) {
          return;
        }
        this.sltTimeRange = "y";
        this.getData();
      },
    },
  },
  computed: {
    defaultColor() {
      return this.darkMode ? "rgba(148,163,184,0.26)" : "rgba(148,163,184,0.22)";
    },
    defaultLabelColor() {
      return this.darkMode ? "rgba(226,232,240,0.72)" : "#475569";
    },
    tooltipTheme() {
      return this.darkMode
        ? {
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            borderColor: "rgba(96, 165, 250, 0.24)",
            textColor: "rgba(241, 245, 249, 0.94)",
          }
        : {
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            borderColor: "rgba(148, 163, 184, 0.22)",
            textColor: "#0f172a",
          };
    },
    legendTextColor() {
      return this.darkMode ? "rgba(226,232,240,0.78)" : "#475569";
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
    palette() {
      return {
        primary: this.darkMode ? "#60a5fa" : "#2563eb",
        primaryAreaStart: this.darkMode
          ? "rgba(96, 165, 250, 0.24)"
          : "rgba(59, 130, 246, 0.18)",
        primaryAreaEnd: this.darkMode
          ? "rgba(96, 165, 250, 0.03)"
          : "rgba(59, 130, 246, 0.02)",
        secondary: this.darkMode ? "#34d399" : "#10b981",
        secondaryAreaStart: this.darkMode
          ? "rgba(52, 211, 153, 0.18)"
          : "rgba(16, 185, 129, 0.14)",
        secondaryAreaEnd: this.darkMode
          ? "rgba(52, 211, 153, 0.02)"
          : "rgba(16, 185, 129, 0.01)",
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
    buildLineSeries({
      name,
      data = [],
      color,
      areaStart,
      areaEnd,
      showArea = true,
      latestLabelFormatter = null,
    }) {
      const series = {
        type: "line",
        name,
        smooth: true,
        showSymbol: false,
        symbol: "circle",
        symbolSize: 6,
        data,
        lineStyle: {
          width: 2.5,
          color,
        },
        emphasis: {
          focus: "series",
          itemStyle: {
            color,
            borderColor: this.darkMode ? "#0f172a" : "#ffffff",
            borderWidth: 2,
          },
        },
        tooltip: {
          show: true,
        },
      };

      if (showArea) {
        series.areaStyle = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: areaStart,
            },
            {
              offset: 1,
              color: areaEnd,
            },
          ]),
        };
      }

      if (typeof latestLabelFormatter === "function" && data.length) {
        const lastIndex = data.length - 1;
        const lastValue = Number(data[lastIndex]);
        if (Number.isFinite(lastValue)) {
          series.markPoint = {
            symbol: "circle",
            symbolSize: 9,
            data: [
              {
                coord: [this.option.xAxis.data[lastIndex], lastValue],
                value: lastValue,
                dataIndex: lastIndex,
              },
            ],
            label: {
              show: true,
              position: "left",
              distance: 14,
              padding: [4, 8],
              borderRadius: 999,
              backgroundColor: this.latestLabelTheme.backgroundColor,
              borderColor: this.latestLabelTheme.borderColor,
              borderWidth: 1,
              color: this.latestLabelTheme.color,
              fontSize: 10,
              fontWeight: 700,
              formatter: latestLabelFormatter,
            },
            itemStyle: {
              color: this.darkMode ? "#bfdbfe" : "#ffffff",
              borderColor: color,
              borderWidth: 3,
              shadowBlur: 12,
              shadowColor: this.darkMode
                ? "rgba(96, 165, 250, 0.28)"
                : "rgba(37, 99, 235, 0.22)",
            },
          };
        }
      }

      return series;
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
    resetChartWithEmptyState(message = "") {
      this.option.legend = this.getBaseLegend(false);
      this.option.series = [
        {
          type: "line",
          smooth: true,
          data: [],
        },
      ];
      this.option.xAxis.data = [];
      this.myChart.setOption(this.option);
      this.emptyText = message;
    },
    buildFallbackYieldSeries(dataList = []) {
      const normalizedList = Array.isArray(dataList)
        ? dataList.filter((item) => item && item.FSRQ)
        : [];

      if (!normalizedList.length) {
        return [];
      }

      const baselineValue = Number(normalizedList[0] && normalizedList[0].DWJZ);
      if (!Number.isFinite(baselineValue) || baselineValue === 0) {
        return [];
      }

      return normalizedList.map((item) => {
        const currentValue = Number(item && item.DWJZ);
        if (!Number.isFinite(currentValue)) {
          return null;
        }
        return +(((currentValue / baselineValue) - 1) * 100).toFixed(2);
      });
    },
    renderYieldChart(dataList = [], indexName = "指数") {
      this.option.legend = this.getBaseLegend(true);
      this.option.tooltip.formatter = (p) => {
        const mainPoint = p.find((item) => item.seriesName === "基金") || p[0];
        const secondaryPoint = p.find((item) => item.seriesName === indexName);
        const secondaryText = secondaryPoint
          ? `<br />${secondaryPoint.seriesName}：${Number(secondaryPoint.value).toFixed(2)}%`
          : "";
        return `时间：${mainPoint.name}<br />${mainPoint.seriesName}：${Number(
          mainPoint.value
        ).toFixed(2)}%${secondaryText}`;
      };
      this.option.xAxis.data = dataList.map((item) => item.PDATE);
      this.option.series = [
        this.buildLineSeries({
          name: "基金",
          data: dataList.map((item) => +item.YIELD),
          color: this.palette.primary,
          areaStart: this.palette.primaryAreaStart,
          areaEnd: this.palette.primaryAreaEnd,
          latestLabelFormatter: ({ value }) => `当前 ${Number(value).toFixed(2)}%`,
        }),
        this.buildLineSeries({
          name: indexName,
          data: dataList.map((item) => +item.INDEXYIED),
          color: this.palette.secondary,
          areaStart: this.palette.secondaryAreaStart,
          areaEnd: this.palette.secondaryAreaEnd,
          showArea: false,
        }),
      ];
      this.option.series[1].tooltip.show = false;
      this.myChart.setOption(this.option);
    },
    renderNetValueChart(dataList = []) {
      if (!dataList.length) {
        this.resetChartWithEmptyState("暂无历史净值数据");
        return;
      }

      this.option.legend = this.getBaseLegend(true);
      this.option.xAxis.data = dataList.map((item) => item.FSRQ);
      this.option.series = [
        this.buildLineSeries({
          name: "单位净值",
          data: dataList.map((item) => +item.DWJZ),
          color: this.palette.primary,
          areaStart: this.palette.primaryAreaStart,
          areaEnd: this.palette.primaryAreaEnd,
          latestLabelFormatter: ({ value }) => `当前 ${Number(value).toFixed(3)}`,
        }),
        this.buildLineSeries({
          name: "累计净值",
          data: dataList.map((item) => +item.LJJZ),
          color: this.palette.secondary,
          areaStart: this.palette.secondaryAreaStart,
          areaEnd: this.palette.secondaryAreaEnd,
          showArea: false,
        }),
      ];
      this.option.series[1].tooltip.show = false;
      this.option.tooltip.formatter = (p) => {
        const mainPoint = p.find((item) => item.seriesName === "单位净值") || p[0];
        const secondaryPoint = p.find((item) => item.seriesName === "累计净值");
        const secondaryText = secondaryPoint
          ? `<br />${secondaryPoint.seriesName}：${Number(secondaryPoint.value).toFixed(3)}`
          : "";
        const current = dataList[p[0].dataIndex] || {};
        const growthText = current.JZZZL !== undefined && current.JZZZL !== null && current.JZZZL !== ""
          ? `${current.JZZZL}%`
          : "--";
        return `时间：${mainPoint.name}<br />${mainPoint.seriesName}：${Number(mainPoint.value).toFixed(
          3
        )}${secondaryText}<br />日增长率：${growthText}`;
      };
      this.myChart.setOption(this.option);
    },
    renderFallbackYieldChart(dataList = []) {
      const fallbackSeries = this.buildFallbackYieldSeries(dataList);
      if (!fallbackSeries.length) {
        this.resetChartWithEmptyState("暂无累计收益数据");
        return;
      }

      this.option.legend = this.getBaseLegend(false);
      this.option.tooltip.formatter = (p) => {
        return `时间：${p[0].name}<br />累计收益：${Number(p[0].value).toFixed(2)}%`;
      };
      this.option.xAxis.data = dataList.map((item) => item.FSRQ);
      this.option.series = [
        this.buildLineSeries({
          name: "累计收益",
          data: fallbackSeries,
          color: this.palette.primary,
          areaStart: this.palette.primaryAreaStart,
          areaEnd: this.palette.primaryAreaEnd,
          latestLabelFormatter: ({ value }) => `当前 ${Number(value).toFixed(2)}%`,
        }),
      ];
      this.myChart.setOption(this.option);
    },
    fetchNetDiagramData() {
      return fetchFundNetDiagram(this.fund.fundcode, this.sltTimeRange);
    },
    init() {
      if (this.myChart && typeof this.myChart.dispose === "function") {
        this.myChart.dispose();
        this.myChart = null;
      }
      this.chartEL = this.$refs.mainCharts;
      this.myChart = echarts.init(
        this.chartEL,
        this.darkMode ? "dark" : "customed"
      );
      this.option = {
        tooltip: {
          trigger: "axis",
          backgroundColor: this.tooltipTheme.backgroundColor,
          borderColor: this.tooltipTheme.borderColor,
          borderWidth: 1,
          padding: [10, 12],
          textStyle: {
            color: this.tooltipTheme.textColor,
          },
          extraCssText:
            "border-radius: 12px; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);",
          formatter: (p) => {
            return `时间：${p[0].name}<br />${
              this.chartTypeList[this.chartType].name
            }：${p[0].value}`;
          },
        },
        grid: {
          top: 52,
          right: 10,
          bottom: 30,
          left: 12,
          containLabel: true,
        },
        legend: this.getBaseLegend(this.chartType !== "LJSY" ? true : false),
        xAxis: {
          type: "category",
          data: [],
          boundaryGap: false,
          axisLabel: {
            color: this.defaultLabelColor,
            fontSize: 10,
            margin: 12,
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
          scale: true,
          axisLabel: {
            color: this.defaultLabelColor,
            formatter: (val) => {
              if (this.chartType == "LJSY") {
                return val.toFixed(1) + "%";
              } else {
                return val.toFixed(3);
              }
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
        series: [
          {
            type: "line",
            smooth: true,
            data: [],
          },
        ],
      };
      this.getData();
    },
    changeTimeRange(val) {
      this.getData();
    },
    handle_num_range(data) {
      var _aa = Math.max.apply(null, data);
      var _bb = Math.min.apply(null, data);
      return [_aa, _bb];
    },
    getData() {
      const requestId = ++this.requestVersion;
      const fundCode = this.fund.fundcode;
      const timeRange = this.sltTimeRange;
      this.loading = true;
      this.emptyText = "";
      if (this.chartType == "LJSY") {
        fetchFundYieldDiagram(fundCode, timeRange)
          .then((yieldResponse) => {
            if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode || timeRange !== this.sltTimeRange) {
              return;
            }
            let dataList = Array.isArray(yieldResponse && yieldResponse.dataList)
              ? yieldResponse.dataList
              : [];
            if (dataList.length) {
              this.renderYieldChart(
                dataList,
                yieldResponse && yieldResponse.expansion && yieldResponse.expansion.INDEXNAME
                  ? `${yieldResponse.expansion.INDEXNAME}（参考基准）`
                  : "参考基准"
              );
            } else {
              return this.fetchNetDiagramData().then((fallbackDataList) => {
                if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode || timeRange !== this.sltTimeRange) {
                  return;
                }
                if (fallbackDataList.length) {
                  this.renderFallbackYieldChart(fallbackDataList);
                } else {
                  this.resetChartWithEmptyState("暂无累计收益数据");
                }
              });
            }
          })
          .catch(() => {
            return this.fetchNetDiagramData()
              .then((fallbackDataList) => {
                if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode || timeRange !== this.sltTimeRange) {
                  return;
                }
                if (fallbackDataList.length) {
                  this.renderFallbackYieldChart(fallbackDataList);
                } else {
                  this.resetChartWithEmptyState("累计收益加载失败");
                }
              })
              .catch(() => {
                if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode || timeRange !== this.sltTimeRange) {
                  return;
                }
                this.resetChartWithEmptyState("累计收益加载失败");
              });
          })
          .finally(() => {
            if (requestId === this.requestVersion) {
              this.loading = false;
            }
          });
      } else {
        this.fetchNetDiagramData()
          .then((dataList) => {
            if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode || timeRange !== this.sltTimeRange) {
              return;
            }
            this.renderNetValueChart(dataList);
          })
          .catch(() => {
            if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode || timeRange !== this.sltTimeRange) {
              return;
            }
            this.resetChartWithEmptyState("历史净值加载失败");
          })
          .finally(() => {
            if (requestId === this.requestVersion) {
              this.loading = false;
            }
          });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.box {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 10px 10px 8px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(248, 250, 252, 0.66));
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.main-echarts {
  width: 100%;
  height: 248px;
}

.empty-text {
  margin: 2px 0 10px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.chart-toolbar {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.chart-range-group {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
}

.chart-range-group:deep(.el-radio-button__inner) {
  min-width: 48px;
  padding: 7px 11px;
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.7);
  color: #475569;
  box-shadow: none;
}

.chart-range-group:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 10px 0 0 10px;
}

.chart-range-group:deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 10px 10px 0;
}

.chart-range-group:deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2);
}

.box:deep(.echarts) {
  border-radius: 12px;
}

.box--dark {
  background: linear-gradient(180deg, rgba(12, 18, 30, 0.96), rgba(7, 11, 20, 0.98));
  border-color: rgba(15, 23, 42, 0.92);
  box-shadow: 0 0 0 1px rgba(2, 6, 23, 0.45);
}

.box--dark .empty-text {
  color: rgba(191, 219, 254, 0.66);
}

:global(.darkMode) .chart-range-group .el-radio-button__inner {
  border-color: rgba(96, 165, 250, 0.16);
  background: rgba(15, 23, 42, 0.72);
  color: rgba(226, 232, 240, 0.78);
}

:global(.darkMode) .chart-range-group .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background: #60a5fa;
  border-color: #60a5fa;
  color: #0f172a;
  box-shadow: 0 8px 18px rgba(96, 165, 250, 0.24);
}
</style>
