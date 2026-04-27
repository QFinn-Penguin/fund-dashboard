<template>
  <div
    class="box"
    v-loading="loading"
    :element-loading-background="
      darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    "
  >
    <h5>
      <span v-if="expansion">截止日期：{{ expansion }}</span>
      <span v-else>暂无数据</span>
    </h5>
    <table>
      <thead>
        <tr>
          <th style="text-align: left;">股票名称（代码）</th>
          <th>价格</th>
          <th>涨跌幅</th>
          <th>持仓占比</th>
          <th>较上期</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!loading && !dataList.length">
          <td colspan="5" class="empty-cell">暂无持仓明细</td>
        </tr>
        <tr v-for="(el, ind) in dataList" :key="el.GPDM" @click="openPage(ind)">
          <td class="gpcode" style="text-align: left;">
            {{ el.GPJC + "（" + el.GPDM + "）" }}
          </td>
          <td>{{ formatQuotePrice(el, ind) }}</td>
          <td :class="quoteClass(el, ind)">
            {{ formatQuoteChange(el, ind) }}
          </td>
          <td>{{ parseFloat(el.JZBL).toFixed(2) }}%</td>
          <td>{{ compared(el) }}</td>
        </tr>
      </tbody>
    </table>
    <ul v-if="!loading && dataList.length" class="raw-list">
      <li v-for="el in dataList" :key="`raw-${el.GPDM}`">
        {{ el.GPJC }}（{{ el.GPDM }}） / 占比 {{ parseFloat(el.JZBL).toFixed(2) }}% /
        较上期 {{ compared(el) }}
      </li>
    </ul>
    
  </div>
</template>

<script>
// import indDetail from "../common/indDetail";
import axios from "axios";
export default {
  components: {
    // indDetail,
  },
  name: "positionDetails",
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
      dataList: [],
      dataListGp: [],
      expansion: null,
      loading: false,
      sltData:{},
    };
  },

  watch: {
    "fund.fundcode"() {},
  },
  computed: {
    defaultColor() {
      return this.darkMode ? "rgba(255,255,255,0.6)" : "#ccc";
    },
  },
  mounted() {
    console.log("[positionDetail:mounted] mounted with fund", this.fund);
    if (this.fund && this.fund.fundcode) {
      this.init();
    }
  },
  methods: {
    init() {
      console.log("[positionDetail:init] start", {
        fund: this.fund,
      });
      this.dataList = [];
      this.dataListGp = [];
      this.expansion = null;
      this.getData();
    },

    getData() {
      const requestedCode = this.fund && this.fund.fundcode;
      console.log("[positionDetail:getData] request start", {
        requestedCode,
        fund: this.fund,
      });
      if (!requestedCode) {
        this.loading = false;
        return;
      }

      this.loading = true;
      let url = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNInverstPosition?FCODE=${
        requestedCode
      }&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&Uid=&_=${new Date().getTime()}`;
      axios
        .get(url)
        .then((res) => {
          console.log("[positionDetail:getData] holdings raw response", {
            requestedCode,
            data: res.data,
          });
          if (!this.fund || this.fund.fundcode !== requestedCode) {
            console.log("[positionDetail:getData] stale holdings response ignored", {
              requestedCode,
              currentFund: this.fund,
            });
            return null;
          }
          const data = res.data;
          let dataList = data && data.Datas ? data.Datas.fundStocks : null;
          console.log("[positionDetail:getData] parsed holdings", {
            requestedCode,
            count: Array.isArray(dataList) ? dataList.length : null,
          });
          if (dataList && dataList.length) {
            this.dataList = dataList;
            this.dataListGp = [];
            this.expansion = data.Expansion;
            console.log("[positionDetail:getData] set dataList success", {
              requestedCode,
              count: this.dataList.length,
            });
            let gpList = dataList
              .map((val) => {
                return val.NEWTEXCH + "." + val.GPDM;
              })
              .join(",");

            let gpUrl = `https://push2.eastmoney.com/api/qt/ulist.np/get?fields=f1,f2,f3,f4,f12,f13,f14,f292&fltt=2&secids=${gpList}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&Uid=`;
            return axios
              .get(gpUrl)
              .then((resGp) => {
                console.log("[positionDetail:getData] quote raw response", {
                  requestedCode,
                  data: resGp.data,
                });
                if (!this.fund || this.fund.fundcode !== requestedCode) {
                  console.log("[positionDetail:getData] stale quote response ignored", {
                    requestedCode,
                    currentFund: this.fund,
                  });
                  return;
                }
                this.dataListGp = Array.isArray(resGp.data && resGp.data.data && resGp.data.data.diff)
                  ? resGp.data.data.diff
                    : [];
                console.log("[positionDetail:getData] set quote list", {
                  requestedCode,
                  count: this.dataListGp.length,
                });
              })
              .catch(() => {
                console.log("[positionDetail:getData] quote request failed", {
                  requestedCode,
                });
                if (!this.fund || this.fund.fundcode !== requestedCode) {
                  return;
                }
                this.dataListGp = [];
              });
          }

          if (!this.fund || this.fund.fundcode !== requestedCode) {
            return null;
          }
          console.log("[positionDetail:getData] empty holdings after parse", {
            requestedCode,
            data,
          });
          this.dataList = [];
          this.dataListGp = [];
          this.expansion = null;
          return null;
        })
        .catch((error) => {
          console.log("[positionDetail:getData] holdings request failed", {
            requestedCode,
            error,
          });
          if (!this.fund || this.fund.fundcode !== requestedCode) {
            return;
          }
          this.dataList = [];
          this.dataListGp = [];
          this.expansion = null;
        })
        .finally(() => {
          if (!this.fund || this.fund.fundcode !== requestedCode) {
            return;
          }
          console.log("[positionDetail:getData] request end", {
            requestedCode,
            loading: this.loading,
            finalCount: this.dataList.length,
            quoteCount: this.dataListGp.length,
          });
          this.loading = false;
        });
    },
    openPage(ind) {
      let val = this.getQuote(this.dataList[ind], ind);
      if (!val || !val.f12) {
        return;
      }
      this.sltData = val;
      this.$emit("sltStock", val);

      // let url = `https://emwap.eastmoney.com/quota/stock/index/${val.GPDM}${val.TEXCH}`;
      // window.open(url);
    },

    compared(val) {
      if (val.PCTNVCHGTYPE == "新增") {
        return "新增";
      } else if (isNaN(val.PCTNVCHG)) {
        return 0;
      } else {
        let icon = val.PCTNVCHG > 0 ? "↑ " : "↓ ";
        return icon + Math.abs(parseFloat(val.PCTNVCHG)).toFixed(2) + "%";
      }
    },
    getQuote(val, ind) {
      const fallback = {
        f2: 0,
        f3: 0,
        f12: val && val.GPDM ? val.GPDM : "",
        f13: val && val.NEWTEXCH ? Number(val.NEWTEXCH) : 0,
        f14: val && val.GPJC ? val.GPJC : "",
      };

      if (!Array.isArray(this.dataListGp) || !this.dataListGp.length) {
        return fallback;
      }

      const current = this.dataListGp[ind];
      if (current && current.f12 == fallback.f12) {
        return current;
      }

      const matched = this.dataListGp.find((item) => {
        return item.f12 == fallback.f12;
      });

      return matched || fallback;
    },
    formatQuotePrice(val, ind) {
      const quote = this.getQuote(val, ind);
      const price = Number(quote.f2);
      return Number.isFinite(price) && price !== 0 ? price.toFixed(2) : "--";
    },
    formatQuoteChange(val, ind) {
      const quote = this.getQuote(val, ind);
      const change = Number(quote.f3);
      return Number.isFinite(change) && change !== 0 ? `${change.toFixed(2)}%` : "--";
    },
    quoteClass(val, ind) {
      const quote = this.getQuote(val, ind);
      const change = Number(quote.f3);
      if (!Number.isFinite(change)) {
        return "";
      }
      return change >= 0 ? "up" : "down";
    },
  },
};
</script>

<style lang="scss" scoped>
.box {
  width: 100%;
  height: 100%;
  min-height: 260px;
  h5 {
    margin: 0;
    padding: 0 0 6px;
  }
}
table {
  border-collapse: collapse;
  width: 100%;
  th,
  td {
    text-align: right;
    line-height: 22px;
    height: 22px;
    padding: 0 8px;
  }
  tr {
    &:nth-child(even) {
      background-color: #f1f1f1;
    }
  }
}

.gpcode:hover {
  color: #409eff;
  cursor: pointer;
}

.raw-list {
  margin: 10px 0 0;
  padding-left: 18px;
  text-align: left;
  color: #909399;
  font-size: 12px;

  li {
    line-height: 1.7;
  }
}

.empty-cell {
  text-align: center;
  color: #909399;
}


.darkMode table tr:nth-child(even) {
  background-color: rgba($color: #ffffff, $alpha: 0.05);
}
.up {
  color: #f56c6c;
  font-weight: bold;
}

.down {
  color: #4eb61b;
  font-weight: bold;
}
</style>
