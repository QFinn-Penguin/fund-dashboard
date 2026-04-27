<template>
  <div
    class="box"
    :class="{ 'box--dark': darkMode }"
    v-loading="loading"
    :element-loading-background="
      darkMode ? 'rgba(2, 6, 23, 0.82)' : 'rgba(255, 255, 255, 0.82)'
    "
  >
    <div class="panel-summary" v-if="turnoverData[1]">
      <div class="panel-summary__meta">
        <span class="panel-summary__eyebrow">大盘资金</span>
        <strong>两市合计成交额</strong>
        <span class="panel-summary__turnover"
          >{{ ((turnoverData[0].f6 + turnoverData[1].f6) / 100000000).toFixed(2) }}亿元</span
        >
      </div>
      <div class="panel-summary__side">
        <div class="turnover">
          <span class="turnover__label">上涨</span>
          <span class="up">{{ turnoverData[0].f104 + turnoverData[1].f104 }}</span>
          <span class="turnover__label">平盘</span>
          <span>{{ turnoverData[0].f106 + turnoverData[1].f106 }}</span>
          <span class="turnover__label">下跌</span>
          <span class="down">{{ turnoverData[0].f105 + turnoverData[1].f105 }}</span>
        </div>
        <div class="panel-summary__chips">
          <span v-for="item in flowTags" :key="item" class="panel-chip">{{ item }}</span>
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

require("echarts/lib/chart/line");

require("echarts/lib/component/tooltip");
require("echarts/lib/component/legend");

export default {
  name: "marketLine",
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
      minVal: null,
      option: {},
      loading: false,
      turnoverData: [],
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
    flowTags() {
      return ["主力", "超大单", "大单", "中单", "小单"];
    },
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
    flowSeriesPalette() {
      return this.darkMode
        ? [
            { line: "#93c5fd", area: ["rgba(147, 197, 253, 0.26)", "rgba(147, 197, 253, 0.03)"] },
            { line: "rgba(191, 219, 254, 0.82)" },
            { line: "rgba(125, 211, 252, 0.78)" },
            { line: "rgba(196, 181, 253, 0.72)" },
            { line: "rgba(250, 204, 21, 0.7)" },
          ]
        : [
            { line: "#2563eb", area: ["rgba(59, 130, 246, 0.22)", "rgba(59, 130, 246, 0.03)"] },
            { line: "rgba(59, 130, 246, 0.72)" },
            { line: "rgba(14, 165, 233, 0.76)" },
            { line: "rgba(139, 92, 246, 0.68)" },
            { line: "rgba(245, 158, 11, 0.76)" },
          ];
    },
  },
  mounted() {
    this.getTurnover();
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
          backgroundColor: this.tooltipTheme.backgroundColor,
          borderColor: this.tooltipTheme.borderColor,
          borderWidth: 1,
          padding: [10, 12],
          textStyle: {
            color: this.tooltipTheme.textColor,
          },
          extraCssText:
            "border-radius: 14px; box-shadow: 0 16px 36px rgba(15, 23, 42, 0.16);",
          axisPointer: {
            type: "line",
            lineStyle: {
              color: this.darkMode ? "rgba(96, 165, 250, 0.24)" : "rgba(59, 130, 246, 0.2)",
              width: 1,
            },
          },
          formatter: this.formatFlowTooltip,
        },
        legend: {
          top: 0,
          right: 0,
          icon: "roundRect",
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 12,
          textStyle: {
            color: this.axisLabelColor,
            fontSize: 10,
          },
        },
        grid: {
          top: 48,
          left: 10,
          bottom: 20,
          right: 10,
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: this.timeData,
          axisLabel: {
            color: this.axisLabelColor,
            fontSize: 10,
            margin: 12,
            formatter: this.fmtAxis,
            interval: this.fmtVal,
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
        yAxis: {
          type: "value",
          name: "单位：亿元",
          scale: true,
          nameTextStyle: {
            color: this.axisLabelColor,
            padding: [0, 0, 0, 6],
          },
          axisLabel: {
            color: this.axisLabelColor,
            formatter: value => Number(value).toFixed(2),
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
        series: [
          {
            type: "line",
            data: [],
          },
        ],
      };
      this.getData();
    },
    getTurnover() {
      let url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001,0.399001&fields=f1,f2,f3,f4,f6,f12,f13,f104,f105,f106&_=${new Date().getTime()}`;
      requestWithBackground({ method: "get", url })
        .then((res) => {
          this.turnoverData =
            res.data && res.data.data && Array.isArray(res.data.data.diff)
              ? res.data.data.diff
              : [];
        })
        .catch(() => {
          this.turnoverData = [];
        });
    },

    getData() {
      this.loading = true;
      let url = `https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?lmt=0&klt=1&secid=1.000001&secid2=0.399001&fields1=f1,f2,f3,f7&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63&_=${new Date().getTime()}`;
      requestWithBackground({ method: "get", url })
        .then((res) => {
          let dataList =
            res.data && res.data.data && Array.isArray(res.data.data.klines)
              ? res.data.data.klines
              : [];
          let data1 = [0];
          let data2 = [0];
          let data3 = [0];
          let data4 = [0];
          let data5 = [0];

          dataList.forEach((el) => {
            let arr = el.split(",");
            data1.push((arr[1] / 100000000).toFixed(4));
            data2.push((arr[2] / 100000000).toFixed(4));
            data3.push((arr[3] / 100000000).toFixed(4));
            data4.push((arr[4] / 100000000).toFixed(4));
            data5.push((arr[5] / 100000000).toFixed(4));
          });
          this.option.series = [
            {
              type: "line",
              name: "主力净流入",
              data: data1,
              smooth: true,
              symbol: "none",
              z: 5,
              lineStyle: {
                width: 3,
                color: this.flowSeriesPalette[0].line,
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: this.flowSeriesPalette[0].area[0],
                  },
                  {
                    offset: 1,
                    color: this.flowSeriesPalette[0].area[1],
                  },
                ]),
              },
              emphasis: {
                focus: "series",
              },
            },
            {
              type: "line",
              name: "超大单净流入",
              data: data5,
              smooth: true,
              symbol: "none",
              lineStyle: {
                width: 1.8,
                color: this.flowSeriesPalette[1].line,
              },
              emphasis: {
                focus: "series",
              },
            },
            {
              type: "line",
              name: "大单净流入",
              data: data4,
              smooth: true,
              symbol: "none",
              lineStyle: {
                width: 1.8,
                color: this.flowSeriesPalette[2].line,
              },
              emphasis: {
                focus: "series",
              },
            },
            {
              type: "line",
              name: "中单净流入",
              data: data3,
              smooth: true,
              symbol: "none",
              lineStyle: {
                width: 1.6,
                color: this.flowSeriesPalette[3].line,
              },
              emphasis: {
                focus: "series",
              },
            },
            {
              type: "line",
              name: "小单净流入",
              data: data2,
              smooth: true,
              symbol: "none",
              lineStyle: {
                width: 1.6,
                color: this.flowSeriesPalette[4].line,
              },
              emphasis: {
                focus: "series",
              },
            },
          ];
          this.myChart.setOption(this.option);
        })
        .catch(() => {
          this.option.series = [
            {
              type: "line",
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
    formatFlowTooltip(params) {
      if (!Array.isArray(params) || !params.length) {
        return "";
      }
      const rows = params
        .map(item => {
          return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:180px;">
            <span style="display:inline-flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:999px;background:${item.color};display:inline-block;"></span>
              ${item.seriesName}
            </span>
            <strong style="font-weight:700;">${Number(item.value || 0).toFixed(2)} 亿</strong>
          </div>`;
        })
        .join("");
      return `<div style="display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:11px;opacity:0.72;">${params[0].axisValue}</div>
        ${rows}
      </div>`;
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
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.92));
  border: 1px solid rgba(226, 232, 240, 0.96);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.82);

  &.box--dark {
    background:
      radial-gradient(circle at top right, rgba(96, 165, 250, 0.14), transparent 36%),
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

  .panel-summary__eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #94a3b8;
  }

  .panel-summary__turnover {
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
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
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
    letter-spacing: 0.04em;
  }

  .turnover {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
    max-width: 220px;
    padding: 2px 0 0;
    font-size: 12px;
    color: #64748b;

    .turnover__label {
      font-size: 11px;
      color: #94a3b8;
      margin: 0;
    }

    span {
      font-weight: bold;
      margin: 0;
    }
    .up {
      color: #f56c6c;
    }

    .down {
      color: #4eb61b;
    }
  }

  &.box--dark {
    .panel-summary__meta {
      color: rgba(241, 245, 249, 0.94);
    }

    .panel-summary__turnover {
      background: rgba(96, 165, 250, 0.12);
      color: rgba(191, 219, 254, 0.94);
    }

    .turnover {
      color: rgba(148, 163, 184, 0.78);
    }

    .turnover__label {
      color: rgba(148, 163, 184, 0.72);
    }

    .panel-chip {
      background: rgba(15, 23, 42, 0.72);
      border-color: rgba(148, 163, 184, 0.18);
      color: rgba(226, 232, 240, 0.82);
    }
  }
}
.main-echarts {
  width: 100%;
  height: 252px;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(248, 250, 252, 0.52));
  border: 1px solid rgba(226, 232, 240, 0.74);
}
</style>
