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
    <div v-if="chartTrustNote" class="chart-trust-note">{{ chartTrustNote }}</div>
    <div v-if="modeHint" class="mode-hint">{{ modeHint }}</div>
    <div class="chart-toolbar">
      <div
        v-if="chartType === 'JZ'"
        class="chart-mode-group"
        role="radiogroup"
        aria-label="净值图展示模式"
      >
        <button
          type="button"
          class="chart-option chart-option--mode"
          :class="{ 'is-active': jzViewMode === 'nav' }"
          :aria-pressed="jzViewMode === 'nav' ? 'true' : 'false'"
          @click="selectJzViewMode('nav')"
        >
          净值走势
        </button>
        <button
          type="button"
          class="chart-option chart-option--mode"
          :class="{ 'is-active': jzViewMode === 'benchmark' }"
          :aria-pressed="jzViewMode === 'benchmark' ? 'true' : 'false'"
          @click="selectJzViewMode('benchmark')"
        >
          基金 vs 基准
        </button>
      </div>
      <div
        class="chart-range-group"
        role="radiogroup"
        aria-label="图表时间范围"
      >
        <button
          v-for="range in timeRangeOptions"
          :key="range.value"
          type="button"
          class="chart-option chart-option--range"
          :class="{ 'is-active': sltTimeRange === range.value }"
          :aria-pressed="sltTimeRange === range.value ? 'true' : 'false'"
          @click="selectTimeRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
let echarts = require("echarts/lib/echarts");

import "./js/customed.js";
import "./js/dark.js";
import {
  buildBenchmarkOverlaySeries,
  buildYieldTransactionMarkers,
  fetchFundNetDiagram,
  fetchFundYieldDiagram,
  normalizeDateText,
  normalizeNetHistory,
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
      jzViewMode: "nav",
      chartTrustNote: "",
      modeHint: "",
      showTransactionMarkers: true,
      transactionMarkersNote: "",
      benchmarkFallbackRanges: ["y", "3y", "6y", "n", "3n", "5n"],
      timeRangeOptions: [
        { value: "y", label: "月" },
        { value: "3y", label: "季" },
        { value: "6y", label: "半年" },
        { value: "n", label: "一年" },
        { value: "3n", label: "三年" },
        { value: "5n", label: "五年" },
      ],
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
    selectJzViewMode(value) {
      if (this.jzViewMode === value) {
        return;
      }
      this.jzViewMode = value;
      this.changeJzViewMode();
    },
    selectTimeRange(value) {
      if (this.sltTimeRange === value) {
        return;
      }
      this.sltTimeRange = value;
      this.changeTimeRange();
    },
    buildLineSeries({
      name,
      data = [],
      color,
      areaStart,
      areaEnd,
      showArea = true,
      latestLabelFormatter = null,
      markPoints = [],
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

      const markerData = [];
      if (typeof latestLabelFormatter === "function" && data.length) {
        const lastIndex = data.length - 1;
        const lastValue = Number(data[lastIndex]);
        if (Number.isFinite(lastValue)) {
          markerData.push({
            coord: [this.option.xAxis.data[lastIndex], lastValue],
            value: lastValue,
            dataIndex: lastIndex,
            isLatestPoint: true,
            symbol: "circle",
            symbolSize: 9,
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
          });
        }
      }

      const transactionMarkPoints = Array.isArray(markPoints) ? markPoints : [];
      if (transactionMarkPoints.length) {
        markerData.push(...transactionMarkPoints);
      }

      if (markerData.length) {
        series.markPoint = {
            symbol: "circle",
            symbolSize: 9,
            data: markerData,
            tooltip: {
              formatter: (params) => {
                return params && params.data && params.data.transactionType
                  ? this.formatTransactionMarkerTooltip(params)
                  : `${params.name || "当前"}：${Number(params.value).toFixed(2)}%`;
              },
            },
          };
      }

      return series;
    },
    getBaseLegend(show = true, selected = {}) {
      return {
        show,
        top: 0,
        right: 8,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
        selected,
        textStyle: {
          color: this.legendTextColor,
          fontSize: 11,
        },
      };
    },
    formatMoneyDisplay(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return "--";
      }
      return parsed.toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatTransactionMarkerTooltip(params) {
      const point = (params && params.data) || {};
      const value = Array.isArray(point.value) ? point.value : [];
      const yieldValue = Number(value[1]);
      return [
        `时间：${point.date || point.name || "--"}`,
        `操作：${point.transactionLabel || "交易"}`,
        point.amount !== undefined && point.amount !== null ? `金额：${this.formatMoneyDisplay(point.amount)}` : null,
        point.shares !== undefined && point.shares !== null ? `份额：${Number(point.shares).toFixed(2)}` : null,
        point.fee !== undefined && point.fee !== null ? `手续费：${this.formatMoneyDisplay(point.fee)}` : null,
        point.nav !== undefined && point.nav !== null ? `净值：${Number(point.nav).toFixed(4)}` : null,
        Number.isFinite(yieldValue) ? `对应收益：${yieldValue.toFixed(2)}%` : null,
        point.note ? `说明：${point.note}` : null,
      ]
        .filter(Boolean)
        .join("<br />");
    },
    buildTransactionMarkPoints(transactionMarkers) {
      if (!transactionMarkers || !transactionMarkers.markers.length) {
        return [];
      }

      return transactionMarkers.markers.map((marker) => {
        const isReduce = marker.transactionType === "reduce";
        return {
          ...marker,
          name: marker.transactionLabel || marker.name,
          coord: marker.value,
          value: Array.isArray(marker.value) ? marker.value[1] : marker.value,
          symbol: isReduce ? "triangle" : "pin",
          symbolRotate: 0,
          symbolSize: isReduce ? 20 : 30,
          symbolOffset: isReduce ? [0, 8] : [0, -17],
          label: {
            show: true,
            color: "#ffffff",
            fontSize: 10,
            fontWeight: 700,
            position: isReduce ? "bottom" : "inside",
            formatter: isReduce ? "卖" : "买",
          },
          itemStyle: {
            color: isReduce ? "#2563eb" : "#ef4444",
            borderColor: this.darkMode ? "#0f172a" : "#ffffff",
            borderWidth: 3,
            shadowBlur: 18,
            shadowColor: this.darkMode
              ? "rgba(15, 23, 42, 0.72)"
              : isReduce
                ? "rgba(37, 99, 235, 0.38)"
                : "rgba(239, 68, 68, 0.4)",
          },
        };
      });
    },
    buildTransactionLegendSeries(markPoints = [], legendName = "交易点") {
      return {
        type: "line",
        name: legendName,
        data: [],
        showSymbol: false,
        lineStyle: {
          opacity: 0,
        },
        tooltip: {
          show: false,
        },
        markPoint: {
          symbol: "circle",
          symbolSize: 9,
          data: markPoints,
          tooltip: {
            formatter: this.formatTransactionMarkerTooltip,
          },
        },
      };
    },
    splitTransactionMarkPoints(markPoints = []) {
      return {
        buy: markPoints.filter((point) => point.transactionType !== "reduce"),
        sell: markPoints.filter((point) => point.transactionType === "reduce"),
      };
    },
    buildTransactionLegendSeriesList(markPoints = []) {
      const groupedMarkPoints = this.splitTransactionMarkPoints(markPoints);
      return []
        .concat(groupedMarkPoints.buy.length ? [this.buildTransactionLegendSeries(groupedMarkPoints.buy, "买入")] : [])
        .concat(groupedMarkPoints.sell.length ? [this.buildTransactionLegendSeries(groupedMarkPoints.sell, "卖出")] : []);
    },
    buildYieldLegend(selected = {}) {
      return {
        ...this.getBaseLegend(true, selected),
        data: ["买入", "卖出"],
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
      const transactionMarkers = buildYieldTransactionMarkers({
        yieldList: dataList,
        transactions: Array.isArray(this.fund && this.fund.transactions) ? this.fund.transactions : [],
      });
      const transactionMarkPoints = this.showTransactionMarkers
        ? this.buildTransactionMarkPoints(transactionMarkers)
        : [];
      this.transactionMarkersNote = transactionMarkers.note;
      this.option.legend = this.buildYieldLegend({
        买入: this.showTransactionMarkers,
        卖出: this.showTransactionMarkers,
      });
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
      ].concat(this.buildTransactionLegendSeriesList(transactionMarkPoints));
      this.option.series[1].tooltip.show = false;
      if (this.showTransactionMarkers && transactionMarkers.markers.length) {
        this.modeHint = transactionMarkers.note;
      }
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
    renderBenchmarkNetChart(netHistoryList = [], yieldResponse = null) {
      const normalizedNetHistory = normalizeNetHistory(netHistoryList);
      const benchmarkName =
        (yieldResponse && yieldResponse.expansion && yieldResponse.expansion.INDEXNAME
          ? `${yieldResponse.expansion.INDEXNAME}（参考基准）`
          : "参考基准");
      const benchmarkOverlay = buildBenchmarkOverlaySeries(
        netHistoryList,
        (yieldResponse && yieldResponse.dataList) || [],
        benchmarkName
      );

      if (!benchmarkOverlay.hasBenchmark) {
        return false;
      }

      this.option.legend = this.getBaseLegend(true);
      this.option.xAxis.data = benchmarkOverlay.xAxis;
      this.option.series = [
        this.buildLineSeries({
          name: "基金净值",
          data: benchmarkOverlay.fundSeries,
          color: this.palette.primary,
          areaStart: this.palette.primaryAreaStart,
          areaEnd: this.palette.primaryAreaEnd,
          latestLabelFormatter: ({ value }) => `当前 ${Number(value).toFixed(3)}`,
        }),
        this.buildLineSeries({
          name: benchmarkOverlay.benchmarkLabel,
          data: benchmarkOverlay.benchmarkSeries,
          color: this.palette.secondary,
          areaStart: this.palette.secondaryAreaStart,
          areaEnd: this.palette.secondaryAreaEnd,
          showArea: false,
        }),
      ];
      this.option.series[1].tooltip.show = false;
      this.option.tooltip.formatter = (p) => {
        const fundPoint = p.find((item) => item.seriesName === "基金净值") || p[0];
        const benchmarkPoint = p.find((item) => item.seriesName === benchmarkOverlay.benchmarkLabel);
        const current = normalizedNetHistory.find((item) => item.date === fundPoint.name) || {};
        const benchmarkText = benchmarkPoint
          ? `<br />${benchmarkPoint.seriesName}：${Number(benchmarkPoint.value).toFixed(3)}`
          : "";
        const growthText = current.dayChangeRate !== null && current.dayChangeRate !== undefined
          ? `${current.dayChangeRate.toFixed(2)}%`
          : "--";
        return `时间：${fundPoint.name}<br />${fundPoint.seriesName}：${Number(fundPoint.value).toFixed(
          3
        )}${benchmarkText}<br />日增长率：${growthText}`;
      };
      this.myChart.setOption(this.option);
      return true;
    },
    renderFallbackYieldChart(dataList = []) {
      const fallbackSeries = this.buildFallbackYieldSeries(dataList);
      if (!fallbackSeries.length) {
        this.resetChartWithEmptyState("暂无累计收益数据");
        return;
      }

      const fallbackYieldList = dataList.map((item, index) => ({
        PDATE: item && item.FSRQ,
        YIELD: fallbackSeries[index],
      }));
      const transactionMarkers = buildYieldTransactionMarkers({
        yieldList: fallbackYieldList,
        transactions: Array.isArray(this.fund && this.fund.transactions) ? this.fund.transactions : [],
      });
      const transactionMarkPoints = this.showTransactionMarkers
        ? this.buildTransactionMarkPoints(transactionMarkers)
        : [];
      this.transactionMarkersNote = transactionMarkers.note;

      this.option.legend = this.buildYieldLegend({
        买入: this.showTransactionMarkers,
        卖出: this.showTransactionMarkers,
      });
      this.option.tooltip.formatter = (p) => {
        const mainPoint = p.find((item) => item.seriesName === "累计收益") || p[0];
        return `时间：${mainPoint.name}<br />累计收益：${Number(mainPoint.value).toFixed(2)}%`;
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
      ].concat(this.buildTransactionLegendSeriesList(transactionMarkPoints));
      if (this.showTransactionMarkers && transactionMarkers.markers.length) {
        this.modeHint = transactionMarkers.note;
      }
      this.myChart.setOption(this.option);
    },
    fetchNetDiagramData() {
      return fetchFundNetDiagram(this.fund.fundcode, this.sltTimeRange);
    },
    getRangeLabel(range) {
      const rangeLabelMap = {
        y: "近1月",
        "3y": "近3月",
        "6y": "近6月",
        n: "近1年",
        "3n": "近3年",
        "5n": "近5年",
      };
      return rangeLabelMap[range] || range;
    },
    getLatestDateText(list = [], dateKey = "") {
      const dates = (Array.isArray(list) ? list : [])
        .map((item) => normalizeDateText(item && item[dateKey]))
        .filter(Boolean)
        .sort();
      return dates.length ? dates[dates.length - 1] : "";
    },
    isYieldHistoryStale(dataList = []) {
      const latestYieldDate = this.getLatestDateText(dataList, "PDATE");
      if (!latestYieldDate) {
        return false;
      }

      const referenceDate = normalizeDateText(this.fund && this.fund.jzrq) || normalizeDateText(new Date().toISOString());
      if (!referenceDate) {
        return false;
      }

      const latestDate = new Date(`${latestYieldDate}T00:00:00`);
      const currentDate = new Date(`${referenceDate}T00:00:00`);
      if (Number.isNaN(latestDate.getTime()) || Number.isNaN(currentDate.getTime())) {
        return false;
      }

      const diffDays = (currentDate.getTime() - latestDate.getTime()) / (24 * 60 * 60 * 1000);
      return diffDays > 45;
    },
    async resolveBenchmarkNetView(fundCode, preferredRange) {
      const candidateRanges = [preferredRange].concat(
        this.benchmarkFallbackRanges.filter((range) => range !== preferredRange)
      );

      for (let index = 0; index < candidateRanges.length; index += 1) {
        const range = candidateRanges[index];
        const [netHistoryList, yieldResponse] = await Promise.all([
          fetchFundNetDiagram(fundCode, range),
          fetchFundYieldDiagram(fundCode, range).catch(() => ({ dataList: [], expansion: {} })),
        ]);
        const benchmarkName =
          (yieldResponse && yieldResponse.expansion && yieldResponse.expansion.INDEXNAME
            ? `${yieldResponse.expansion.INDEXNAME}（参考基准）`
            : "参考基准");
        const benchmarkOverlay = buildBenchmarkOverlaySeries(
          netHistoryList,
          (yieldResponse && yieldResponse.dataList) || [],
          benchmarkName
        );

        if (benchmarkOverlay.hasBenchmark) {
          return {
            found: true,
            range,
            netHistoryList,
            yieldResponse,
          };
        }
      }

      const fallbackNetHistoryList = await fetchFundNetDiagram(fundCode, preferredRange);
      return {
        found: false,
        range: preferredRange,
        netHistoryList: fallbackNetHistoryList,
        yieldResponse: { dataList: [], expansion: {} },
      };
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
      this.myChart.on("legendselectchanged", (event) => {
        if (event && (event.name === "买入" || event.name === "卖出")) {
          const selected = event.selected || {};
          this.showTransactionMarkers = selected["买入"] !== false || selected["卖出"] !== false;
          this.modeHint = this.showTransactionMarkers ? this.transactionMarkersNote : "";
        }
      });
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
    changeJzViewMode() {
      if (this.chartType === "JZ") {
        this.getData();
      }
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
      this.chartTrustNote = "";
      this.modeHint = "";
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
              if (this.isYieldHistoryStale(dataList)) {
                return this.fetchNetDiagramData().then((fallbackDataList) => {
                  if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode || timeRange !== this.sltTimeRange) {
                    return;
                  }
                  if (fallbackDataList.length) {
                    this.renderFallbackYieldChart(fallbackDataList);
                  } else {
                    this.renderYieldChart(
                      dataList,
                      yieldResponse && yieldResponse.expansion && yieldResponse.expansion.INDEXNAME
                        ? `${yieldResponse.expansion.INDEXNAME}（参考基准）`
                        : "参考基准"
                    );
                    this.modeHint = "累计收益接口数据可能过旧，且最新历史净值加载失败";
                  }
                });
              }
              this.chartTrustNote = "以下收益对比基于参考基准，仅供辅助判断";
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
        const viewTask = this.jzViewMode === "benchmark"
          ? this.resolveBenchmarkNetView(fundCode, timeRange)
          : Promise.resolve({ found: false, range: timeRange, netHistoryList: null, yieldResponse: null });

        Promise.all([
          this.fetchNetDiagramData(),
          viewTask,
        ])
          .then(([dataList, benchmarkView]) => {
            if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode || timeRange !== this.sltTimeRange) {
              return;
            }
            if (this.jzViewMode === "benchmark") {
              const rendered = benchmarkView && benchmarkView.found
                ? this.renderBenchmarkNetChart(benchmarkView.netHistoryList, benchmarkView.yieldResponse)
                : false;
              if (!rendered) {
                this.modeHint = "当前所有可探测区间暂无可用基准数据，已回退为净值走势";
                this.renderNetValueChart(dataList);
              } else {
                this.chartTrustNote = "以下对比仅供辅助判断";
                this.modeHint = benchmarkView.range === timeRange
                  ? "当前展示为基金净值 vs 参考基准"
                  : `当前区间无可用基准数据，已自动切换到${this.getRangeLabel(benchmarkView.range)}展示基金净值 vs 参考基准`;
              }
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

.chart-trust-note {
  margin: 2px 0 6px;
  font-size: 11px;
  line-height: 1.5;
  text-align: center;
  color: #64748b;
}

.mode-hint {
  margin: 2px 0 8px;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  color: #64748b;
}

.chart-toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.chart-mode-group,
.chart-range-group {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
}

.chart-option {
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: none;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease,
    color 0.16s ease;
}

.chart-option:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}

.chart-option--mode {
  min-width: 88px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.72);
  color: #475569;
}

.chart-mode-group .chart-option:first-child {
  border-radius: 10px 0 0 10px;
}

.chart-mode-group .chart-option:last-child {
  border-radius: 0 10px 10px 0;
}

.chart-option--mode.is-active {
  background: rgba(37, 99, 235, 0.1);
  border-color: rgba(37, 99, 235, 0.4);
  color: #1d4ed8;
}

.chart-option--range {
  min-width: 48px;
  padding: 7px 11px;
  background: rgba(255, 255, 255, 0.7);
  color: #475569;
}

.chart-range-group .chart-option:first-child {
  border-radius: 10px 0 0 10px;
}

.chart-range-group .chart-option:last-child {
  border-radius: 0 10px 10px 0;
}

.chart-option--range.is-active {
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

.box--dark .chart-trust-note {
  color: rgba(191, 219, 254, 0.68);
}

.box--dark .mode-hint {
  color: rgba(191, 219, 254, 0.72);
}

:global(.darkMode) .chart-option {
  border-color: rgba(96, 165, 250, 0.16);
  background: rgba(15, 23, 42, 0.72);
  color: rgba(226, 232, 240, 0.78);
}

:global(.darkMode) .chart-option--mode.is-active {
  background: rgba(96, 165, 250, 0.16);
  border-color: rgba(96, 165, 250, 0.34);
  color: #bfdbfe;
  box-shadow: none;
}

:global(.darkMode) .chart-option--range.is-active {
  background: #60a5fa;
  border-color: #60a5fa;
  color: #0f172a;
  box-shadow: 0 8px 18px rgba(96, 165, 250, 0.24);
}
</style>
