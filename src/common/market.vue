<template>
  <div v-if="boxShadow" class="shadow" :class="darkMode ? 'darkMode' : ''" @click.self="close">
    <div class="content-box">
      <div class="detail-header">
        <div class="detail-header__topbar">
          <button type="button" class="detail-header__back" @click="close">
            <span class="detail-header__back-icon" aria-hidden="true">←</span>
            <span>返回列表</span>
          </button>
        </div>
        <div class="detail-header__main">
          <div class="detail-header__eyebrow">市场概览</div>
          <h5>行情中心</h5>
        </div>
      </div>
      <div class="market-tabs" :style="marketTabCursorStyle">
        <span class="market-tabs__cursor" aria-hidden="true"></span>
        <button
          v-for="item in tabItems"
          :key="item.name"
          type="button"
          class="market-tabs__btn"
          :class="activeName === item.name ? 'active' : ''"
          @mouseenter="setTabPreview(item.name)"
          @mouseleave="clearTabPreview"
          @focus="setTabPreview(item.name)"
          @blur="clearTabPreview"
          @click="switchTab(item.name)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="market-tabs__panel">
        <market-line v-if="activeName === 'first'" :darkMode="darkMode" ref="first"></market-line>
        <market-bar v-else-if="activeName === 'second'" :darkMode="darkMode" ref="second"></market-bar>
        <market-S2N v-else-if="activeName === 'third'" :darkMode="darkMode" ref="third"></market-S2N>
        <market-N2S v-else :darkMode="darkMode" ref="fourth"></market-N2S>
      </div>

    </div>
  </div>
</template>

<script>
import marketLine from "./marketLine";
import marketBar from "./marketBar";
import marketS2N from "./marketS2N";
import marketN2S from "./marketN2S";
// import charts2 from "./charts2";
export default {
  components: {
    marketLine,
    marketBar,
    marketS2N,
    marketN2S,
  },
  name: "market",
  props: {
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      activeName: "first",
      boxShadow: false,
      tabPreviewName: "",
      tabItems: [
        { name: "first", label: "大盘资金" },
        { name: "second", label: "行业板块" },
        { name: "third", label: "宽基强弱" },
        { name: "fourth", label: "债市风向" },
      ],
    };
  },
  computed: {
    visibleTabName() {
      const previewName = this.tabPreviewName;
      if (this.tabItems.some((item) => item.name === previewName)) {
        return previewName;
      }
      return this.activeName;
    },
    visibleTabIndex() {
      const nextIndex = this.tabItems.findIndex((item) => item.name === this.visibleTabName);
      return nextIndex >= 0 ? nextIndex : 0;
    },
    marketTabCursorStyle() {
      return {
        "--market-tab-index": `${this.visibleTabIndex}`,
        "--market-tab-count": `${this.tabItems.length || 1}`,
      };
    },
  },
  watch: {},
  mounted() {},
  methods: {
    switchTab(name) {
      this.activeName = name;
      this.tabPreviewName = "";
      this.$nextTick(() => {
        const currentRef = this.$refs[name];
        if (currentRef && typeof currentRef.init === "function") {
          currentRef.init();
        }
      });
    },
    setTabPreview(name) {
      if (!this.tabItems.some((item) => item.name === name)) {
        return;
      }
      this.tabPreviewName = name;
    },
    clearTabPreview() {
      this.tabPreviewName = "";
    },
    init() {
      this.boxShadow = true;
      this.activeName = this.activeName || "first";
      this.tabPreviewName = "";
    },
    close() {
      this.boxShadow = false;
      this.$emit("close", false);
    },
  },
};
</script>

<style lang="scss" scoped>
.shadow {
  position: fixed;
  inset: 0;
  width: 100%;
  min-height: 100%;
  padding: 24px 20px 20px;
  z-index: 1001;
  box-sizing: border-box;
  background-color: rgba(8, 12, 20, 0.72);
  overflow-y: auto;
}
.content-box {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 16px;
  padding: 0 14px 14px;
  margin: 0 auto;
  text-align: left;
  line-height: 1;
  vertical-align: middle;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
}

.market-tabs {
  position: relative;
  display: flex;
  gap: 0;
  padding: 3px;
  margin: 0 0 10px;
  border-radius: 14px;
  border: 1px solid rgba(219, 228, 240, 0.68);
  background: linear-gradient(180deg, rgba(247, 249, 252, 0.96), rgba(241, 245, 249, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  overflow: hidden;
}

.market-tabs__cursor {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 6px) / var(--market-tab-count, 4));
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.16);
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.18), rgba(59, 130, 246, 0.11));
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 8px 16px rgba(59, 130, 246, 0.16);
  transform: translateX(calc(var(--market-tab-index, 0) * 100%));
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.16s ease;
  pointer-events: none;
  z-index: 0;
}

.market-tabs__btn {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-width: 0;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  outline: none;
  transition: color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.market-tabs__btn:hover,
.market-tabs__btn:focus-visible {
  color: #0f172a;
  background: transparent;
  box-shadow: none;
}

.market-tabs__btn:focus-visible {
  outline: none;
}

.market-tabs__btn.active {
  background: transparent;
  border-color: transparent;
  color: #2563eb;
  box-shadow: none;
}

.market-tabs__panel {
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.88);
  overflow: visible;
}

.market-tabs__panel > * {
  min-height: auto;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 6px 14px;
  flex-shrink: 0;
}

.detail-header__topbar {
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

.detail-header__eyebrow {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.detail-header__main h5 {
  margin: 8px 0 0;
  font-size: 24px;
  color: #0f172a;
}

.shadow.darkMode {
  .content-box {
    background: linear-gradient(180deg, #171b22 0%, #1d222b 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: none;
  }

  .detail-header__eyebrow {
    color: rgba($color: #ffffff, $alpha: 0.6);
  }

  .detail-header__main h5 {
    color: rgba($color: #ffffff, $alpha: 0.92);
  }

  .detail-header__back {
    color: rgba($color: #ffffff, $alpha: 0.72);
  }

  .detail-header__back:hover,
  .detail-header__back:focus-visible {
    color: rgba($color: #90c2ff, $alpha: 0.96);
  }

  .market-tabs {
    border-color: rgba($color: #ffffff, $alpha: 0.06);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .market-tabs__cursor {
    border-color: rgba(90, 164, 255, 0.36);
    background: linear-gradient(135deg, rgba(90, 164, 255, 0.78), rgba(59, 130, 246, 0.78));
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.2);
  }

  .market-tabs__btn {
    background: transparent;
    border-color: transparent;
    color: rgba($color: #ffffff, $alpha: 0.72);
  }

  .market-tabs__btn:hover,
  .market-tabs__btn:focus-visible {
    color: rgba($color: #ffffff, $alpha: 0.92);
    background: transparent;
    box-shadow: none;
  }

  .market-tabs__btn.active {
    background: transparent;
    color: rgba($color: #ffffff, $alpha: 0.96);
    border-color: transparent;
    box-shadow: none;
  }

  .market-tabs__panel {
    background-color: rgba($color: #ffffff, $alpha: 0.02);
    border-color: rgba($color: #ffffff, $alpha: 0.08);
  }
  ::v-deep .el-radio-button--mini .el-radio-button__inner {
    background-color: rgba($color: #ffffff, $alpha: 0.16);
    color: rgba($color: #ffffff, $alpha: 0.6);
    border: 1px solid rgba($color: #ffffff, $alpha: 0.37);
  }
  ::v-deep .el-radio-button__orig-radio:checked + .el-radio-button__inner {
    background-color: rgba($color: #409eff, $alpha: 0.6);
    color: rgba($color: #ffffff, $alpha: 0.6);
    border-color: rgba($color: #409eff, $alpha: 0.37);
  }
}
</style>
