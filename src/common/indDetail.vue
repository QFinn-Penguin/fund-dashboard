<template>
  <div v-if="boxShadow" class="shadow" :class="boxClass">
      <div class="content-box">
        <div class="detail-header">
          <div class="detail-header__topbar">
            <button type="button" class="detail-header__back" @click="close">
            <span class="detail-header__back-icon" aria-hidden="true">←</span>
            <span>返回列表</span>
          </button>
          </div>
          <div class="detail-header__main">
            <div class="detail-header__eyebrow">大盘指数详情</div>
            <h5>{{ codeData.f14 }}</h5>
            <div class="detail-header__code">{{ codeData.f13 + "." + codeData.f12 }}</div>
          </div>
          <div class="detail-header__stats">
            <div class="detail-stat">
              <div class="detail-stat__label">最新点位</div>
              <div class="detail-stat__value">{{ detailPriceValue }}</div>
            </div>
            <div class="detail-stat" :class="detailChangeClass">
              <div class="detail-stat__label">今日涨跌</div>
              <div class="detail-stat__value">{{ detailChangeValue }}</div>
            </div>
            <div class="detail-stat">
              <div class="detail-stat__label">涨跌额</div>
              <div class="detail-stat__value" :class="detailChangeClass">{{ detailAmountChangeValue }}</div>
            </div>
          </div>
        </div>
        <div
          v-loading="loading"
        :element-loading-background="
          darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
        "
        :class="[
          mini ? 'mini-charts' : '',
          darkMode ? 'main-echarts--dark' : ''
        ]"
        class="main-echarts"
        ref="mainCharts"
      ></div>

    </div>
  </div>
</template>

<script>
let echarts = require("echarts/lib/echarts");

import "./js/customed.js";
import "./js/dark.js";

require("echarts/lib/chart/line");

require("echarts/lib/component/tooltip");
require("echarts/lib/component/legend");

export default {
  name: "indDetail",
  props: {
    mini: {
      type: Boolean,
      default: false,
    },
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
      maxVal: null,
      interVal: null,
      option: {},
      DWJZ: 0,
      code: null,
      codeData: {},
      boxShadow: false,
      loading: false,
      dataList: [],
      timeData: [],
      isHK: false,
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
    tooltipTheme() {
      return this.darkMode
        ? {
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            borderColor: "rgba(96, 165, 250, 0.24)",
            textColor: "rgba(241, 245, 249, 0.94)",
            axisPointerLabelBg: "rgba(15, 23, 42, 0.92)",
            axisPointerLabelColor: "rgba(241, 245, 249, 0.92)",
          }
        : {
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            borderColor: "rgba(148, 163, 184, 0.22)",
            textColor: "#0f172a",
            axisPointerLabelBg: "rgba(15, 23, 42, 0.76)",
            axisPointerLabelColor: "#ffffff",
          };
    },
    chartLineColor() {
      return this.darkMode ? "#60a5fa" : "#2563eb";
    },
    chartAreaStart() {
      return this.darkMode ? "rgba(96, 165, 250, 0.24)" : "rgba(59, 130, 246, 0.18)";
    },
    chartAreaEnd() {
      return this.darkMode ? "rgba(96, 165, 250, 0.03)" : "rgba(59, 130, 246, 0.02)";
    },
    chartVolumeUpColor() {
      return this.darkMode ? "rgba(244, 114, 114, 0.24)" : "rgba(239, 68, 68, 0.16)";
    },
    chartVolumeDownColor() {
      return this.darkMode ? "rgba(74, 222, 128, 0.2)" : "rgba(34, 197, 94, 0.14)";
    },
    boxClass() {
      let className = "";
      if (this.darkMode) {
        className += "darkMode ";
      }
      if (this.mini) {
        className += "mini";
      }
      return className;
    },
    detailPriceValue() {
      const value = Number(this.codeData && this.codeData.f2);
      return Number.isFinite(value) && value !== 0 ? value.toFixed(2) : "--";
    },
    detailChangeValue() {
      const value = Number(this.codeData && this.codeData.f3);
      return Number.isFinite(value) ? `${value.toFixed(2)}%` : "--";
    },
    detailAmountChangeValue() {
      const value = Number(this.codeData && this.codeData.f4);
      return Number.isFinite(value) ? value.toFixed(2) : "--";
    },
    detailChangeClass() {
      const value = Number(this.codeData && this.codeData.f3);
      if (!Number.isFinite(value) || value === 0) {
        return "";
      }
      return value > 0 ? "up" : "down";
    },
  },
  mounted() {
    // this.init();
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
    formatNum(val) {
      return (val / 10000).toFixed(3) + "万";
    },
    init(val) {
      this.boxShadow = true;
      this.code = val.f13 + "." + val.f12;
      this.codeData = val;

      setTimeout(() => {
        this.initChart();
      }, 10);
    },
    initChart() {
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
          axisPointer: {
            type: "cross",
            label: {
              show: true,
              color: this.tooltipTheme.axisPointerLabelColor,
              backgroundColor: this.tooltipTheme.axisPointerLabelBg,
            },
          },
          formatter: (p) => {
            const volumeColor = this.CJcolor({ dataIndex: p[0].dataIndex });
            return `时间：${p[0].name}<br />价格：${
              this.dataList[p[0].dataIndex][1]
            }<br />涨幅：${(
              ((this.dataList[p[0].dataIndex][1] - this.DWJZ) * 100) /
              this.DWJZ
            ).toFixed(
              2
            )}%<br /><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${volumeColor}"></span>成交量：${this.formatNum(
              this.dataList[p[0].dataIndex][2]
            )}`;
          },
        },
        axisPointer: {
          link: { xAxisIndex: "all" },
        },
        grid: [
          {
            top: 26,
            left: 12,
            right: 10,
            height: "52%",
            containLabel: true,
          },
          {
            show: true,
            left: 12,
            right: 10,
            top: "70%",
            height: "20%",
            containLabel: true,
          },
        ],
        xAxis: [
          {
            data: this.timeData,
            position: "bottom",
            boundaryGap: false,
            axisLabel: {
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
          {
            //交易量图
            splitNumber: 2,
            type: "category",
            gridIndex: 1,
            boundaryGap: false,
            data: this.timeData,

            axisTick: {
              show: false,
            },
            splitLine: {
              //分割线设置
              show: true,
              lineStyle: {
                type: "dashed",
                color: this.defaultColor,
              },
            },
            axisLine: {
              lineStyle: {
                color: this.defaultColor,
              },
            },
            axisPointer: {
              show: true,
              label: {
                formatter: (p) => {
                  if (
                    p.seriesData[0] &&
                    this.dataList[p.seriesData[0].dataIndex]
                  ) {
                    var _p =
                      (
                        this.dataList[p.seriesData[0].dataIndex][2] / 10000
                      ).toFixed(3) + "万";
                    return _p;
                  }
                },
              },
            },
          },
        ],
        yAxis: [
          {
            type: "value",
            axisLabel: {
              color: this.yAxisLabelColor,
              formatter: (val) => {
                return val.toFixed(2);
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
            axisPointer: {
              show: true,
              label: {
                formatter: function(params) {
                  return params.value.toFixed(2);
                },
              },
            },
          },
          {
            type: "value",
            axisLabel: {
              color: this.yAxisLabelColor,
              formatter: (val) => {
                let num = (((val - this.DWJZ) * 100) / this.DWJZ).toFixed(2);
                if (num == -0.00) {
                  num = "0.00";
                }
                return num + "%";
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
            axisPointer: {
              show: true,
              label: {
                formatter: (p) => {
                  return (
                    (((p.value - this.DWJZ) * 100) / this.DWJZ).toFixed(2) + "%"
                  );
                },
              },
            },
            data: [],
          },
          {
            //交易图
            // name: '万',
            nameGap: "0",
            nameTextStyle: {},
            gridIndex: 1,
            z: 4,
            splitNumber: 3,
            axisLine: {
              onZero: false,
              show: false,
            },
            axisTick: {
              show: false,
            },

            splitLine: {
              //分割线设置
              show: false,
            },
            axisPointer: {
              show: true,
              label: {
                formatter: function(params) {
                  var _p = (params.value / 10000).toFixed(2) + "万";
                  return _p;
                },
              },
            },
            axisLabel: {
              //label文字设置
              //   color: labelColor,
              inside: false, //label文字朝内对齐
              fontSize: 10,
              onZero: false,
              formatter: function(params) {
                //计算右边Y轴对应的当前价的涨幅比例
                var _p = (params / 10000).toFixed(2);
                if (params == 0) {
                  _p = "(万)";
                }
                return _p;
              },
            },
          },
        ],
        series: [
          {
              name: "涨幅",
              type: "line",
              data: [],
              smooth: true,
              showSymbol: false,
              symbol: "circle",
              symbolSize: 6,
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
            name: "价格",
            type: "line",
              yAxisIndex: 1,
              symbol: "none",
              data: [],
              lineStyle: {
                width: 0,
              },
              tooltip: {
                show: false,
              },
            },
          {
            name: "成交量",
            type: "bar",
            gridIndex: 1,
            xAxisIndex: 1,
            yAxisIndex: 2,
            data: [],
            itemStyle: {
              color: this.CJcolor,
              borderRadius: [4, 4, 0, 0],
            },
            barMaxWidth: 8,
          },
        ],
      };
      this.getData();
    },

    close() {
      this.boxShadow = false;
      this.$emit("close", false);
    },
    fmtAxis(val, ind) {
      if (this.isHK) {
        if (val == "12:00") {
          return "12:00/13:00";
        } else {
          return val;
        }
      } else {
        if (val == "11:30") {
          return "11:30/13:00";
        } else {
          return val;
        }
      }
    },
    fmtVal(ind, val) {
      var arr;
      if (this.isHK) {
        arr = ["09:30", "12:00", "16:00"];
      } else {
        arr = ["09:30", "10:30", "11:30", "14:00", "15:00"];
      }

      if (arr.indexOf(val) != -1) {
        return true;
      } else {
        return false;
      }
    },
    CJcolor(val, ind) {
      var colorList;
      if (
        val.dataIndex == 0 ||
        this.dataList[val.dataIndex][1] > this.dataList[val.dataIndex - 1][1]
      ) {
        colorList = this.chartVolumeUpColor;
      } else {
        colorList = this.chartVolumeDownColor;
      }
      return colorList;
    },
    yAxisLabelColor(val, ind) {
      return Number(val).toFixed(2) > this.DWJZ.toFixed(2)
        ? "#f56c6c"
        : Number(val).toFixed(2) == this.DWJZ.toFixed(2)
        ? this.defaultLabelColor
        : "#4eb61b";
    },
    handle_num(data) {
      var _aa = Math.abs((Math.max.apply(null, data) - this.DWJZ) / this.DWJZ);
      var _bb = Math.abs((Math.min.apply(null, data) - this.DWJZ) / this.DWJZ);
      return _aa > _bb ? _aa : _bb;
    },
    getData() {
      this.loading = true;
      let url = `https://push2.eastmoney.com/api/qt/stock/trends2/get?secid=${this.code}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f53,f56,f58&iscr=0&iscca=0&ndays=1&forcect=1`;

      this.$axios.get(url).then((res) => {
        // console.log(res);
        this.loading = false;
        this.DWJZ = res.data.data.prePrice;
        let dataList = res.data.data.trends.map((item) => item.split(","));
        this.dataList = dataList;

        this.option.series[0].data = dataList.map((item) => +item[1]);
        this.option.series[1].data = dataList.map((item) => +item[1]);
        this.option.series[2].data = dataList.map((item) => +item[2]);

        let firstDate = dataList[0][0].substr(11, 5);
        // console.log(firstDate);
        this.isHK = false;

        if (this.codeData.f13 == 1 || this.codeData.f13 == 0) {
          this.timeData = this.time_arr("hs");
          this.option.xAxis[0].axisLabel = {
            formatter: this.fmtAxis,
            interval: this.fmtVal,
          };
          this.option.xAxis[1].axisLabel = {
            formatter: this.fmtAxis,
            interval: this.fmtVal,
          };
        } else {
          switch (firstDate) {
            case "09:30":
              this.timeData = this.time_arr("hk");
              this.isHK = true;
              this.option.xAxis[0].axisLabel = {
                formatter: this.fmtAxis,
                interval: this.fmtVal,
              };
              this.option.xAxis[1].axisLabel = {
                formatter: this.fmtAxis,
                interval: this.fmtVal,
              };
              break;
            case "21:30":
              this.timeData = this.time_arr("us-s");
              break;
            case "22:30":
              this.timeData = this.time_arr("us-w");
              break;

            default:
              break;
          }
        }

        this.option.xAxis[0].data = this.timeData;
        this.option.xAxis[1].data = this.timeData;

        this.option.series[0].markLine.data[0].yAxis = this.DWJZ;

        let aa = this.handle_num(this.option.series[0].data);

        let minVal = this.DWJZ - this.DWJZ * aa;
        let maxVal = this.DWJZ + this.DWJZ * aa;
        this.option.yAxis[0].min = minVal;
        this.option.yAxis[0].max = maxVal;
        this.option.yAxis[0].interval = Math.abs((this.DWJZ - minVal) / 4);
        this.option.yAxis[1].min = minVal;
        this.option.yAxis[1].max = maxVal;
        this.option.yAxis[1].interval = Math.abs((this.DWJZ - minVal) / 4);
        this.myChart.setOption(this.option);
      });
    },
    time_arr(type) {
      if (type.indexOf("us-s") != -1) {
        //生成美股时间段 夏令时
        var timeArr = new Array();
        timeArr.push("21:30");
        return this.getNextTime("21:30", "04:00", 1, timeArr);
      }
      if (type.indexOf("us-w") != -1) {
        //生成美股时间段
        var timeArr = new Array();
        timeArr.push("22:30");
        return this.getNextTime("22:30", "05:00", 1, timeArr);
      }
      if (type.indexOf("hs") != -1) {
        //生成沪深时间段
        var timeArr = new Array();
        timeArr.push("09:30");
        timeArr.concat(this.getNextTime("09:30", "11:30", 1, timeArr));
        timeArr.concat(this.getNextTime("13:00", "15:00", 1, timeArr));
        return timeArr;
      }
      if (type.indexOf("hk") != -1) {
        //生成港股时间段
        var timeArr = new Array();
        timeArr.push("09:30");
        timeArr.concat(this.getNextTime("09:30", "12:00", 1, timeArr));
        timeArr.concat(this.getNextTime("13:00", "16:00", 1, timeArr));
        return timeArr;
      }
    },
    getNextTime(startTime, endTIme, offset, resultArr) {
      var result = this.addTimeStr(startTime, offset);
      resultArr.push(result);
      if (result == endTIme) {
        return resultArr;
      } else {
        return this.getNextTime(result, endTIme, offset, resultArr);
      }
    },
    addTimeStr(time, num) {
      var hour = time.split(":")[0];
      var mins = Number(time.split(":")[1]);
      var mins_un = parseInt((mins + num) / 60);
      var hour_un = parseInt((Number(hour) + mins_un) / 24);
      if (mins_un > 0) {
        if (hour_un > 0) {
          var tmpVal = ((Number(hour) + mins_un) % 24) + "";
          hour = tmpVal.length > 1 ? tmpVal : "0" + tmpVal; //判断是否是一位
        } else {
          var tmpVal = Number(hour) + mins_un + "";
          hour = tmpVal.length > 1 ? tmpVal : "0" + tmpVal;
        }
        var tmpMinsVal = ((mins + num) % 60) + "";
        mins = tmpMinsVal.length > 1 ? tmpMinsVal : 0 + tmpMinsVal; //分钟数为 取余60的数
      } else {
        var tmpMinsVal = mins + num + "";
        mins = tmpMinsVal.length > 1 ? tmpMinsVal : "0" + tmpMinsVal; //不大于整除60
      }
      return hour + ":" + mins;
    },
  },
};
</script>

<style lang="scss" scoped>
.shadow {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 16px;
  z-index: 1001;
  box-sizing: border-box;
  top: 0;
  left: 0;
  background: rgba(8, 12, 20, 0.42);
  backdrop-filter: blur(4px);
  overflow-y: auto;
}

.content-box {
  max-width: 760px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 16px;
  padding: 0 14px 14px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  line-height: 1;
  vertical-align: middle;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
  border: 1px solid rgba(226, 232, 240, 0.9);
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
  padding: 0;
  font-size: 20px;
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

.detail-stat.up {
  background: linear-gradient(180deg, rgba(254, 242, 242, 0.98), rgba(255, 255, 255, 0.82));
  border-color: rgba(245, 108, 108, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 8px 18px rgba(245, 108, 108, 0.08);
}

.detail-stat.up .detail-stat__value,
.detail-stat__value.up {
  color: #f56c6c;
}

.detail-stat.down {
  background: linear-gradient(180deg, rgba(240, 253, 244, 0.98), rgba(255, 255, 255, 0.82));
  border-color: rgba(78, 182, 27, 0.26);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 8px 18px rgba(78, 182, 27, 0.08);
}

.detail-stat.down .detail-stat__value,
.detail-stat__value.down {
  color: #4eb61b;
}

.mini.shadow {
  padding: 30px;
  z-index: 1000;
}

.btn {
  display: inline-block;
  line-height: 1;
  cursor: pointer;
  background: #fff;
  padding: 5px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #000000;
  margin: 0 5px;
  outline: none;
  border: 1px solid #dcdfe6;
}

.shadow.darkMode {
  .content-box {
    background: linear-gradient(180deg, #171b22 0%, #1d222b 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: none;
  }

  .detail-header__eyebrow,
  .detail-header__code,
  .detail-stat__label {
    color: rgba($color: #ffffff, $alpha: 0.6);
  }

  .detail-header__main h5,
  .detail-stat__value {
    color: rgba($color: #ffffff, $alpha: 0.92);
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

  .detail-stat.up .detail-stat__value,
  .detail-stat__value.up {
    color: #ff8a80;
  }

  .detail-stat.down {
    background: linear-gradient(180deg, rgba(24, 76, 31, 0.3), rgba(255, 255, 255, 0.04));
    border-color: rgba(78, 182, 27, 0.24);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);
  }

  .detail-stat.down .detail-stat__value,
  .detail-stat__value.down {
    color: #5ad08a;
  }
}

.main-echarts {
  width: 100%;
  height: 330px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(226, 232, 240, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.main-echarts--dark {
  background: linear-gradient(180deg, rgba(12, 18, 30, 0.96), rgba(7, 11, 20, 0.98));
  border-color: rgba(15, 23, 42, 0.92);
  box-shadow: 0 0 0 1px rgba(2, 6, 23, 0.45);
}

.mini-charts {
  height: 305px;
}
</style>
