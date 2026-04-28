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
import { fetchFundBaseInfo } from "./fundDetailEnhance";

export default {
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
      requestVersion: 0,
    };
  },
  computed: {
    defaultColor() {
      return this.darkMode ? "rgba(255,255,255,0.6)" : "#ccc";
    },
  },
  watch: {
    "fund.fundcode": {
      handler(nextCode, prevCode) {
        if (!nextCode || nextCode === prevCode) {
          return;
        }
        this.getData();
      },
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
      const fundCode = this.fund.fundcode;
      const requestId = ++this.requestVersion;
      this.infoData = {};
      this.loading = true;
      fetchFundBaseInfo(fundCode)
        .then((baseInfo) => {
          if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode) {
            return;
          }

          this.infoData = baseInfo && baseInfo.FCODE ? baseInfo : {};
        })
        .catch(() => {
          if (requestId !== this.requestVersion || fundCode !== this.fund.fundcode) {
            return;
          }
          this.infoData = {};
        })
        .finally(() => {
          if (requestId === this.requestVersion) {
            this.loading = false;
          }
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
  gap: 14px;

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

.content-box::before {
  content: "";
  display: block;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.48), rgba(37, 99, 235, 0.08), transparent);
}

.stat-card {
  flex: 1;
  position: relative;
  padding: 16px 14px 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.96));
  border: 1px solid rgba(226, 232, 240, 0.96);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.stat-card::before {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  top: 0;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.68), rgba(37, 99, 235, 0.18));
}

.stat-card__label {
  margin-bottom: 10px;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: #64748b;
}

.stat-card p {
  font-size: 15px;
  line-height: 1.5;
}

.info-list {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(226, 232, 240, 0.96);
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.97));
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
}

.info-list--embedded {
  border-radius: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 13px 18px;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.9);
}

.info-row + .info-row {
  border-top: 1px solid rgba(226, 232, 240, 0.75);
}

.info-row span:first-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 11px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.info-row span:last-child {
  color: #111827;
  font-weight: 700;
  text-align: right;
  font-size: 13px;
}

.info-row span:first-child::before {
  content: "";
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.82), rgba(37, 99, 235, 0.72));
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.1);
}

.bonus-row {
  padding: 14px 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 251, 235, 0.98), rgba(255, 247, 237, 0.94));
  border: 1px solid rgba(245, 158, 11, 0.18);
  box-shadow: 0 8px 18px rgba(180, 83, 9, 0.05);
  line-height: 1.6;
  color: #7c2d12;
  font-weight: 600;
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
  .content-box::before {
    background: linear-gradient(90deg, rgba(96, 165, 250, 0.55), rgba(96, 165, 250, 0.12), transparent);
  }

  .empty-state,
  .empty-state__desc,
  .stat-card__label,
  .info-row span:first-child {
    color: rgba(255,255,255,0.6);
  }

  .empty-state__title,
  .info-row span:last-child {
    color: rgba(255,255,255,0.92);
  }

  .stat-card,
  .info-list,
  .bonus-row {
    background: rgba(15, 23, 42, 0.46);
    border-color: rgba(148, 163, 184, 0.18);
    box-shadow: 0 12px 24px rgba(2, 6, 23, 0.2);
  }

  .stat-card::before {
    background: linear-gradient(90deg, rgba(96, 165, 250, 0.78), rgba(96, 165, 250, 0.22));
  }

  .info-row {
    background: rgba(255,255,255,0.04);
  }

  .info-row + .info-row {
    border-top-color: rgba(255,255,255,0.08);
  }

  .info-row span:first-child::before {
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  }

  .bonus-row {
    color: rgba(254, 215, 170, 0.96);
    background: linear-gradient(135deg, rgba(120, 53, 15, 0.34), rgba(124, 45, 18, 0.24));
    border-color: rgba(251, 191, 36, 0.18);
  }
}
</style>
