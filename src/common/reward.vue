<template>
  <div v-if="rewardShadow" class="shadow" @click.self="close">
    <div
      class="reward-box"
      :style="{ '--reward-offset': top + 'px' }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="modalTitleId"
      :aria-describedby="modalDescId"
    >
      <div class="reward-header">
        <div class="reward-header__copy">
          <h3 :id="modalTitleId" class="reward-header__title">扫码支持</h3>
          <p class="reward-header__badge">谢你为创作留灯</p>
          <p :id="modalDescId" class="reward-sr-only">切换方式后直接扫码即可关闭弹窗</p>
        </div>
        <button
          type="button"
          class="reward-close"
          aria-label="关闭打赏弹窗"
          @click="close"
        >
          ×
        </button>
      </div>

      <div class="reward-panel">
        <div
          class="reward-switcher"
          :class="{ 'is-active': !!visibleChecked }"
          :style="switcherThumbStyle"
          role="tablist"
          aria-label="收款方式切换"
        >
          <span class="reward-switcher__thumb" aria-hidden="true"></span>
          <button
            type="button"
            class="reward-switcher__btn"
            :id="getTabId('wepay')"
            role="tab"
            :aria-controls="getPanelId('wepay')"
            :aria-selected="checked == 'wepay'"
            :tabindex="checked == 'wepay' ? 0 : -1"
            @mouseenter="setSwitcherPreview('wepay')"
            @mouseleave="clearSwitcherPreview"
            @focus="setSwitcherPreview('wepay')"
            @blur="clearSwitcherPreview"
            @click="checked = 'wepay'"
            :class="checked == 'wepay' ? 'checked' : ''"
          >
            微信
          </button>
          <button
            type="button"
            class="reward-switcher__btn"
            :id="getTabId('alipay')"
            role="tab"
            :aria-controls="getPanelId('alipay')"
            :aria-selected="checked == 'alipay'"
            :tabindex="checked == 'alipay' ? 0 : -1"
            @mouseenter="setSwitcherPreview('alipay')"
            @mouseleave="clearSwitcherPreview"
            @focus="setSwitcherPreview('alipay')"
            @blur="clearSwitcherPreview"
            @click="checked = 'alipay'"
            :class="checked == 'alipay' ? 'checked' : ''"
          >
            支付宝
          </button>
        </div>

        <div
          v-for="method in ['wepay', 'alipay']"
          v-show="checked === method"
          :key="method"
          class="reward-stage"
          role="tabpanel"
          :id="getPanelId(method)"
          :aria-labelledby="getTabId(method)"
        >
          <div class="reward-qrcode">
            <div class="reward-qrcode__frame">
              <img
                class="reward-qrcode__image"
                :src="getMethodImage(method)"
                :alt="getMethodTitle(method)"
              />
            </div>
          </div>

          <div class="reward-stage__meta">
            <p class="reward-stage__caption">{{ getMethodTitle(method) }}</p>
            <p class="reward-stage__hint">扫一扫</p>
          </div>
        </div>

        <div class="reward-actions">
          <div class="reward-actions__buttons">
            <input class="btn success" type="button" value="已支持" @click="close" />
            <input class="btn" type="button" value="关闭" @click="close" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    top: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      rewardShadow: false,
      checked: "wepay",
      switcherPreview: "",
    };
  },
  computed: {
    modalTitleId() {
      return "reward-modal-title";
    },
    modalDescId() {
      return "reward-modal-desc";
    },
    visibleChecked() {
      const preview = this.switcherPreview;
      if (preview === "wepay" || preview === "alipay") {
        return preview;
      }
      return this.checked;
    },
    switcherThumbStyle() {
      const index = this.visibleChecked === "alipay" ? 1 : 0;
      return {
        "--reward-switcher-index": `${index}`,
        "--reward-switcher-count": "2",
      };
    },
  },
  mounted() {},
  methods: {
    getTabId(type) {
      return `reward-tab-${type}`;
    },
    getPanelId(type) {
      return `reward-panel-${type}`;
    },
    getMethodTitle(type) {
      return type === "wepay" ? "微信收款码" : "支付宝收款码";
    },
    getMethodImage(type) {
      return type === "wepay" ? "../icons/qrcode/wx.jpg" : "../icons/qrcode/zfb.jpg";
    },
    setSwitcherPreview(type) {
      if (type !== "wepay" && type !== "alipay") {
        return;
      }
      this.switcherPreview = type;
    },
    clearSwitcherPreview() {
      this.switcherPreview = "";
    },
    init() {
      this.rewardShadow = true;
      this.switcherPreview = "";
    },
    close() {
      this.rewardShadow = false;
      this.switcherPreview = "";
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
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 16px;
  z-index: 1001;
  box-sizing: border-box;
  background-color: rgba(8, 12, 20, 0.72);
  backdrop-filter: blur(3px);
  overflow-y: auto;
}

.reward-box {
  --reward-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.985) 0%, rgba(247, 250, 253, 0.985) 100%);
  --reward-border: rgba(226, 232, 240, 0.92);
  --reward-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
  --reward-title: #0f172a;
  --reward-text: #475569;
  --reward-muted: #64748b;
  --reward-accent-soft: #1d4ed8;
  --reward-panel-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(244, 247, 251, 0.95));
  --reward-panel-border: rgba(226, 232, 240, 0.92);
  --reward-switcher-bg: linear-gradient(180deg, rgba(247, 249, 252, 0.96), rgba(241, 245, 249, 0.94));
  --reward-switcher-border: rgba(226, 232, 240, 0.68);
  --reward-switcher-active-bg: linear-gradient(180deg, rgba(241, 247, 255, 0.98), rgba(227, 238, 255, 0.94));
  --reward-switcher-active-border: rgba(96, 165, 250, 0.3);
  --reward-switcher-active-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.24), 0 7px 14px rgba(59, 130, 246, 0.14);
  --reward-qrcode-shell: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 247, 251, 0.98));
  --reward-qrcode-border: rgba(203, 213, 225, 0.9);
  --reward-creative-bg: transparent;
  --reward-creative-border: rgba(148, 163, 184, 0.28);
  --reward-creative-text: rgba(71, 85, 105, 0.9);
  --reward-btn-bg: rgba(255, 255, 255, 0.92);
  --reward-btn-border: #dbe4f0;
  --reward-btn-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  --reward-success-bg: linear-gradient(180deg, rgba(241, 247, 255, 0.98), rgba(223, 236, 255, 0.92));
  --reward-success-border: rgba(96, 165, 250, 0.34);
  width: 100%;
  max-width: 316px;
  margin-top: var(--reward-offset, 0px);
  padding: 12px;
  background: var(--reward-bg);
  border: 1px solid var(--reward-border);
  border-radius: 20px;
  text-align: left;
  font-size: 12px;
  line-height: 1.5;
  box-shadow: var(--reward-shadow);
  box-sizing: border-box;
}

.reward-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.reward-header__copy {
  min-width: 0;
}

.reward-header__title {
  margin: 0;
  font-size: 13px;
  line-height: 1.15;
  font-weight: 700;
  color: var(--reward-title);
}

.reward-header__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  padding: 0 1px 2px 0;
  border: 0;
  border-bottom: 1px solid var(--reward-creative-border);
  border-radius: 0;
  background: var(--reward-creative-bg);
  color: var(--reward-creative-text);
  font-size: 10px;
  line-height: 1.15;
  font-weight: 500;
  letter-spacing: 0.06em;
  font-family: "Baskerville", "Times New Roman", "Songti SC", "STSong", "Noto Serif SC", serif;
  white-space: nowrap;
  box-shadow: none;
}

.reward-header__badge::before {
  content: "";
  width: 10px;
  height: 1px;
  flex: 0 0 auto;
  background: currentColor;
  opacity: 0.36;
  transform: translateY(1px);
}

.reward-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.reward-close {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 999px;
  border: 1px solid var(--reward-panel-border);
  background: var(--reward-btn-bg);
  color: var(--reward-text);
  font-size: 17px;
  line-height: 1;
  cursor: pointer;
  outline: none;
  transition: transform 0.16s ease, border-color 0.16s ease, background-color 0.16s ease,
    color 0.16s ease, box-shadow 0.16s ease;
}

.reward-close:hover,
.reward-close:focus-visible {
  color: var(--reward-title);
  border-color: rgba(148, 163, 184, 0.86);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.reward-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-switcher {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  padding: 3px;
  border-radius: 13px;
  border: 1px solid var(--reward-switcher-border);
  background: var(--reward-switcher-bg);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  overflow: hidden;
}

.reward-switcher__thumb {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  width: calc((100% - 6px) / var(--reward-switcher-count, 2));
  border-radius: 9px;
  border: 1px solid var(--reward-switcher-active-border);
  background: var(--reward-switcher-active-bg);
  box-shadow: var(--reward-switcher-active-shadow);
  transform: translateX(calc(var(--reward-switcher-index, 0) * 100%));
  transition:
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s ease;
  pointer-events: none;
  z-index: 0;
}

.reward-switcher__btn {
  position: relative;
  z-index: 1;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--reward-text);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  outline: none;
  transition: transform 0.16s ease, border-color 0.16s ease, background-color 0.16s ease,
    box-shadow 0.16s ease, color 0.16s ease;
}

.reward-switcher__btn:hover,
.reward-switcher__btn:focus-visible {
  color: var(--reward-title);
  background: transparent;
  box-shadow: none;
}

.reward-switcher__btn:focus-visible {
  outline: none;
}

.reward-switcher__btn.checked {
  color: var(--reward-accent-soft);
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.reward-stage {
  padding: 10px;
  border-radius: 18px;
  border: 1px solid var(--reward-panel-border);
  background: var(--reward-panel-bg);
}

.reward-qrcode {
  display: flex;
  justify-content: center;
}

.reward-qrcode__frame {
  width: 100%;
  max-width: 220px;
  padding: 9px;
  border-radius: 18px;
  border: 1px solid var(--reward-qrcode-border);
  background: var(--reward-qrcode-shell);
  box-sizing: border-box;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.reward-qrcode__image {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 14px;
  background: #fff;
}

.reward-stage__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.reward-stage__caption,
.reward-stage__hint {
  margin: 0;
  font-size: 10px;
  line-height: 1.2;
}

.reward-stage__caption {
  color: var(--reward-text);
  font-weight: 600;
}

.reward-stage__hint {
  color: var(--reward-muted);
  white-space: nowrap;
}

.reward-actions {
  padding-top: 0;
}

.reward-actions__buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.btn {
  width: 100%;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  cursor: pointer;
  background: var(--reward-btn-bg);
  padding: 0 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--reward-title);
  outline: none;
  border: 1px solid var(--reward-btn-border);
  box-shadow: var(--reward-btn-shadow);
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease,
    background-color 0.16s ease, color 0.16s ease;
  -webkit-appearance: none;
}

.btn:hover,
.btn:focus-visible {
  transform: translateY(-1px);
  border-color: #cbd5e1;
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.08);
}

.success {
  color: var(--reward-accent-soft);
  border-color: var(--reward-success-border);
  background: var(--reward-success-bg);
}

.success:hover,
.success:focus-visible {
  border-color: rgba(59, 130, 246, 0.48);
}

.darkMode .reward-box {
  --reward-bg: linear-gradient(180deg, rgba(24, 30, 40, 0.98) 0%, rgba(18, 24, 34, 0.98) 100%);
  --reward-border: rgba(255, 255, 255, 0.08);
  --reward-shadow: 0 24px 44px rgba(0, 0, 0, 0.34);
  --reward-title: rgba(255, 255, 255, 0.94);
  --reward-text: rgba(226, 232, 240, 0.8);
  --reward-muted: rgba(226, 232, 240, 0.72);
  --reward-accent-soft: rgba(191, 219, 254, 0.94);
  --reward-panel-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
  --reward-panel-border: rgba(255, 255, 255, 0.08);
  --reward-switcher-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03));
  --reward-switcher-border: rgba(255, 255, 255, 0.06);
  --reward-switcher-active-bg: linear-gradient(180deg, rgba(37, 99, 235, 0.5), rgba(29, 78, 216, 0.36));
  --reward-switcher-active-border: rgba(96, 165, 250, 0.24);
  --reward-switcher-active-shadow: inset 0 0 0 1px rgba(122, 186, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 16px rgba(0, 0, 0, 0.18);
  --reward-qrcode-shell: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.025));
  --reward-qrcode-border: rgba(255, 255, 255, 0.1);
  --reward-creative-bg: transparent;
  --reward-creative-border: rgba(148, 163, 184, 0.34);
  --reward-creative-text: rgba(226, 232, 240, 0.82);
  --reward-btn-bg: rgba(17, 24, 39, 0.92);
  --reward-btn-border: rgba(148, 163, 184, 0.34);
  --reward-btn-shadow: 0 12px 20px rgba(0, 0, 0, 0.22);
  --reward-success-bg: linear-gradient(180deg, rgba(37, 99, 235, 0.56), rgba(29, 78, 216, 0.42));
  --reward-success-border: rgba(96, 165, 250, 0.28);

  .reward-close:hover,
  .reward-close:focus-visible,
  .btn:hover,
  .btn:focus-visible {
    border-color: rgba(203, 213, 225, 0.42);
    background: rgba(23, 33, 51, 0.96);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.26);
  }

  .reward-switcher {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .reward-switcher__btn.checked,
  .reward-switcher__btn:hover,
  .reward-switcher__btn:focus-visible {
    color: rgba(255, 255, 255, 0.92);
  }

  .reward-qrcode__frame {
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .reward-qrcode__image {
    background: rgba(255, 255, 255, 0.96);
  }

  .success {
    color: rgba(255, 255, 255, 0.92);
  }
}
</style>
