<template>
  <div
    class="box"
    v-loading="loading"
    :element-loading-background="
      darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    "
  >
    <div v-if="infoData.FCODE" class="content-box">
      <div class="hisrank-row">
        <div class="stat-card">
          <div class="stat-card__label">近1月(排名)</div>
          <p :class="infoData.SYL_Y > 0 ? 'up' : 'down'">
            {{ infoData.SYL_Y }}%（{{ infoData.RANKM }}）
          </p>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">近3月(排名)</div>
          <p :class="infoData.SYL_3Y > 0 ? 'up' : 'down'">
            {{ infoData.SYL_3Y }}%（{{ infoData.RANKQ }}）
          </p>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">近6月(排名)</div>
          <p :class="infoData.SYL_6Y > 0 ? 'up' : 'down'">
            {{ infoData.SYL_6Y }}%（{{ infoData.RANKHY }}）
          </p>
        </div>
        <div class="stat-card">
          <div class="stat-card__label">近1年(排名)</div>
          <p :class="infoData.SYL_1N > 0 ? 'up' : 'down'">
            {{ infoData.SYL_1N }}%（{{ infoData.RANKY }}）
          </p>
        </div>
      </div>
      <div class="info-list">
        <div class="info-row"><span>单位净值</span><span>{{ infoData.DWJZ }}（{{ infoData.FSRQ }}）</span></div>
        <div class="info-row"><span>累计净值</span><span>{{ infoData.LJJZ }}</span></div>
        <div class="info-row"><span>基金类型</span><span>{{ infoData.FTYPE }}</span></div>
        <div class="info-row"><span>基金公司</span><span>{{ infoData.JJGS }}</span></div>
        <div class="info-row hover" @click="showManager">
          <span>基金经理</span><span>{{ infoData.JJJL }}</span>
        </div>
        <div class="info-row"><span>交易状态</span><span>{{ infoData.SGZT }} {{ infoData.SHZT }}</span></div>
        <div class="info-row"><span>基金规模</span><span>{{ numberFormat(infoData.ENDNAV) }}</span></div>
      </div>
      <div v-if="infoData.FUNDBONUS" class="bonus-row">
        分红状态：{{ infoData.FUNDBONUS.PDATE }}日，每份基金份额折算{{
          infoData.FUNDBONUS.CHGRATIO
        }}份
      </div>
    </div>
    <div v-else-if="!loading" class="empty-state">
      <div class="empty-state__title">基金概况暂时不可用</div>
      <div class="empty-state__desc">当前未获取到该基金的概况信息，请稍后重试。</div>
    </div>
    
  </div>
</template>

<script>
// import indDetail from "../common/indDetail";
import { requestWithBackground } from "./request";
export default {
  components: {
    // indDetail,
  },
  name: "fundInfo",
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
      infoData: {},
      loading: false,
      
    };
  },

  watch: {},
  computed: {
    defaultColor() {
      return this.darkMode ? "rgba(255,255,255,0.6)" : "#ccc";
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.getData();
    },

    getData() {
      this.loading = true;
      let url = `https://fundmobapi.eastmoney.com/FundMApi/FundBaseTypeInformation.ashx?FCODE=${
        this.fund.fundcode
      }&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&Uid=&_=${new Date().getTime()}`;
      requestWithBackground({
        method: "get",
        url,
      })
        .then((res) => {
          this.infoData = res.data && res.data.Datas ? res.data.Datas : {};
        })
        .catch(() => {
          this.infoData = {};
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    numberFormat(value) {
      var param = {};
      var k = 10000,
        sizes = ["", "万", "亿", "万亿"],
        i;
      if (value < k) {
        param.value = value;
        param.unit = "";
      } else {
        i = Math.floor(Math.log(value) / Math.log(k));

        param.value = (value / Math.pow(k, i)).toFixed(2);
        param.unit = sizes[i];
      }
      return param.value + param.unit;
    },
    showManager() {
      this.$emit("showManager", this.fund.fundcode);
    },
    close() {
      this.boxShadow = false;
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

.empty-state {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: #64748b;
}

.empty-state__title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.empty-state__desc {
  max-width: 320px;
  font-size: 12px;
  line-height: 1.6;
}

.content-box {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .hisrank-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 0;
    & > div {
      text-align: center;
      margin: 0;
      
      p {
        margin: 0;
      }
    }
  }
}

.stat-card {
  flex: 1;
  padding: 12px 10px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.stat-card__label {
  margin-bottom: 6px;
  font-size: 11px;
  color: #64748b;
}

.info-list {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 14px;
  overflow: hidden;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  line-height: 1.5;
  background: rgba(255, 255, 255, 0.82);
}

.info-row + .info-row {
  border-top: 1px solid rgba(226, 232, 240, 0.75);
}

.info-row span:first-child {
  color: #64748b;
}

.info-row span:last-child {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
}

.bonus-row {
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  line-height: 1.5;
}

.hover:hover {
  color: #409eff;
  cursor: pointer;
}

.up {
  color: #f56c6c;
  font-weight: bold;
}

.down {
  color: #4eb61b;
  font-weight: bold;
}

.darkMode .content-box > div:nth-child(even) {
  background-color: transparent;
}

.darkMode {
  .empty-state,
  .empty-state__desc {
    color: rgba(255,255,255,0.6);
  }

  .empty-state__title {
    color: rgba(255,255,255,0.92);
  }

  .stat-card,
  .bonus-row {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .stat-card__label,
  .info-row span:first-child {
    color: rgba(255,255,255,0.6);
  }

  .info-list {
    border-color: rgba(255,255,255,0.08);
  }

  .info-row {
    background: rgba(255,255,255,0.03);
  }

  .info-row + .info-row {
    border-top-color: rgba(255,255,255,0.08);
  }

  .info-row span:last-child {
    color: rgba(255,255,255,0.9);
  }
}

.shadow {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 30px;
  z-index: 1001;
  box-sizing: border-box;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.7);
}

.manager-box {
  background: #ffffff;
  border-radius: 15px;
  padding: 0 10px;
  margin: 0 auto;
  text-align: center;
  line-height: 1;
  vertical-align: middle;
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
  .manager-box {
    background-color: #373737;
  }
  .btn {
    background-color: rgba($color: #ffffff, $alpha: 0.16);
    color: rgba($color: #ffffff, $alpha: 0.6);
    border: 1px solid rgba($color: #ffffff, $alpha: 0.6);
  }
}
.tab-row {
  padding: 12px 0;
}

.manager-content {
  width: 100%;
  height: 305px;
}
</style>
