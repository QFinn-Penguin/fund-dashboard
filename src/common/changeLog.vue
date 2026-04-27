<template>
  <div>
    <el-dialog
      v-if="mode === 'dialog'"
      title="更新日志"
      :custom-class="dialogClassName"
      :show-close="false"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
      :close-on-press-escape="false"
      :visible.sync="centerDialogVisible"
      :top="top + 'px'"
      width="460px"
      center
    >
      <div :class="panelClassName">
        <div class="content">
          <div class="intro-card">
            <div>
              <p class="intro-card__eyebrow">当前版本</p>
              <div class="intro-card__version">v{{ localVersion }}</div>
            </div>
            <span class="tag tag--primary">重要更新</span>
          </div>

          <p v-if="changelog.tip" class="tip-text">{{ changelog.tip }}</p>
          <div v-if="changelog.htmlTip" class="html-tip" v-html="changelog.htmlTip"></div>

          <ul class="version-list">
            <li v-for="entry in changelog.list" :key="entry.version" class="version-card">
              <div class="version-card__header">
                <div>
                  <h5>v{{ entry.version }}</h5>
                  <p class="version-card__label">{{ entry.type === 2 ? '重点版本' : '常规更新' }}</p>
                </div>
                <div class="badge-row">
                  <span class="tag tag--current" v-if="localVersion === entry.version">当前版本</span>
                  <span class="tag tag--primary" v-if="entry.type === 2">重要更新</span>
                </div>
              </div>
              <ul class="detail-list">
                <li
                  v-for="(item, index) in entry.content"
                  :key="index"
                  :class="item.type === 2 ? 'is-major' : ''"
                >
                  {{ item.content }}
                </li>
              </ul>
            </li>
          </ul>

          <div class="support-card">
            <div class="support-card__title">项目与反馈</div>
            <div class="support-links">
              <a target="_blank" rel="noopener noreferrer" :href="homepageUrl">项目主页</a>
            </div>
          </div>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button class="dialog-footer__button" type="primary" @click="close">关闭</el-button>
      </span>
    </el-dialog>

    <div v-else-if="visible" class="inline-popup-wrap">
      <div :class="['inline-popup-mask', { 'inline-popup-mask--dark': darkMode }]" @click="close"></div>
      <div :class="[panelClassName, 'inline-popup']" :style="inlineStyle">
        <div class="inline-popup__header">
          <div>
            <div class="inline-popup__eyebrow">关于项目</div>
            <div class="inline-popup__title">更新日志</div>
          </div>
          <button type="button" class="inline-close" @click="close">关闭</button>
        </div>

        <div class="content content--inline">
          <div class="inline-hero">
            <div>
              <p class="intro-card__eyebrow">当前版本</p>
              <div class="intro-card__version">v{{ localVersion }}</div>
            </div>
            <div class="badge-row badge-row--inline">
              <span class="tag tag--current">已安装</span>
              <span class="tag tag--primary">重要更新</span>
            </div>
          </div>

          <p v-if="changelog.tip" class="tip-text tip-text--inline">{{ changelog.tip }}</p>
          <div v-if="changelog.htmlTip" class="html-tip html-tip--inline" v-html="changelog.htmlTip"></div>

          <ul class="version-list version-list--inline">
            <li v-for="entry in changelog.list" :key="entry.version" class="version-card version-card--inline">
              <div class="version-card__header version-card__header--inline">
                <div>
                  <p class="version-card__eyebrow">版本节点</p>
                  <h5>v{{ entry.version }}</h5>
                </div>
                <div class="badge-row">
                  <span class="tag tag--primary" v-if="entry.type === 2">重要更新</span>
                </div>
              </div>
              <ul class="detail-list detail-list--inline">
                <li
                  v-for="(item, index) in entry.content"
                  :key="index"
                  :class="item.type === 2 ? 'is-major' : ''"
                >
                  {{ item.content }}
                </li>
              </ul>
            </li>
          </ul>

          <div class="support-card support-card--inline">
            <div class="support-card__title">项目与反馈</div>
            <div class="support-links">
              <a target="_blank" rel="noopener noreferrer" :href="homepageUrl">项目主页</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
var changelogJson = require("./changeLog.json");
const { version } = require("../../package.json");

export default {
  props: {
    mode: {
      type: String,
      default: "dialog",
    },
    visible: {
      type: Boolean,
      default: false,
    },
    inlineStyle: {
      type: Object,
      default: () => ({}),
    },
    top: {
      type: Number,
      default: 0,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      centerDialogVisible: false,
      changelog: changelogJson,
      localVersion: version,
      homepageUrl: "https://github.com/QFinn-Penguin/fund-dashboard",
    };
  },
  computed: {
    dialogClassName() {
      return this.darkMode ? "changelog darkMode" : "changelog";
    },
    panelClassName() {
      return this.darkMode ? "changelog-panel darkMode" : "changelog-panel";
    },
  },
  methods: {
    init() {
      this.changelog = changelogJson;
      if (this.mode === "dialog") {
        this.centerDialogVisible = true;
      }
    },
    close() {
      if (this.mode === "dialog") {
        this.centerDialogVisible = false;
      }
      this.$emit("close", false);
    },
  },
};
</script>

<style lang="scss" scoped>
.content {
  max-height: 430px;
  overflow-y: auto;
  padding: 4px 6px 2px;
}

.content--inline {
  max-height: 460px;
  padding: 0;
}

.inline-popup-wrap {
  position: fixed;
  inset: 0;
  z-index: 12;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 18px 14px 14px;
}

.inline-popup-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(2px);
}

.inline-popup {
  position: relative;
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 32px);
  padding: 18px 18px 18px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  box-shadow: 0 24px 44px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.inline-popup__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 6px 0;
  margin-bottom: 18px;
}

.inline-popup__eyebrow,
.version-card__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.inline-popup__title {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.inline-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 14px;
  margin-top: 4px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(248, 250, 252, 0.96);
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.changelog-panel {
  padding: 0;
}

.inline-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  margin-bottom: 12px;
  border-radius: 16px;
  border: 1px solid rgba(191, 219, 254, 0.7);
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(219, 234, 254, 0.92));
}

.badge-row--inline {
  justify-content: flex-end;
}

.tip-text--inline,
.html-tip--inline {
  margin-bottom: 12px;
}

.version-list--inline {
  gap: 10px;
}

.version-card--inline {
  padding: 14px 16px;
}

.version-card__header--inline {
  align-items: center;
  margin-bottom: 10px;
}

.detail-list--inline {
  gap: 10px;
}

.support-card--inline {
  margin-top: 12px;
}

.changelog-panel.darkMode.inline-popup {
  border-color: rgba(96, 165, 250, 0.2);
  background: linear-gradient(180deg, rgba(18, 27, 42, 0.98), rgba(10, 15, 26, 0.98));
  box-shadow: 0 28px 56px rgba(0, 0, 0, 0.44);
}

.changelog-panel.darkMode.inline-popup .inline-popup__title {
  color: rgba(255, 255, 255, 0.96);
}

.changelog-panel.darkMode.inline-popup .inline-popup__eyebrow,
.changelog-panel.darkMode.inline-popup .version-card__eyebrow {
  color: rgba(191, 219, 254, 0.66);
}

.changelog-panel.darkMode.inline-popup .inline-close {
  border-color: rgba(96, 165, 250, 0.2);
  background: rgba(30, 41, 59, 0.9);
  color: rgba(226, 232, 240, 0.9);
}

.inline-popup-mask--dark {
  background: rgba(2, 6, 23, 0.36);
}

.changelog-panel.darkMode.inline-popup .inline-hero {
  border-color: rgba(96, 165, 250, 0.18);
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.24), rgba(15, 23, 42, 0.88));
}

.changelog-panel.darkMode.inline-popup .content--inline {
  color: rgba(226, 232, 240, 0.9);
}

.changelog-panel.darkMode.inline-popup .intro-card,
.changelog-panel.darkMode.inline-popup .version-card,
.changelog-panel.darkMode.inline-popup .support-card {
  border-color: rgba(96, 165, 250, 0.16);
  background: linear-gradient(180deg, rgba(20, 29, 45, 0.96) 0%, rgba(10, 15, 26, 0.98) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 18px 36px rgba(2, 6, 23, 0.28);
}

.changelog-panel.darkMode.inline-popup .intro-card__version,
.changelog-panel.darkMode.inline-popup .version-card h5,
.changelog-panel.darkMode.inline-popup .detail-list li.is-major,
.changelog-panel.darkMode.inline-popup .support-card__title {
  color: rgba(248, 250, 252, 0.96);
}

.changelog-panel.darkMode.inline-popup .version-card__label,
.changelog-panel.darkMode.inline-popup .tip-text,
.changelog-panel.darkMode.inline-popup .html-tip,
.changelog-panel.darkMode.inline-popup .detail-list li {
  color: rgba(226, 232, 240, 0.82);
}

.changelog-panel.darkMode.inline-popup .tip-text,
.changelog-panel.darkMode.inline-popup .html-tip {
  border: 1px solid rgba(96, 165, 250, 0.12);
  background: rgba(15, 23, 42, 0.92);
}

.changelog-panel.darkMode.inline-popup .html-tip :deep(a),
.changelog-panel.darkMode.inline-popup .support-links a {
  color: #7dd3fc;
}

.changelog-panel.darkMode.inline-popup .tag--primary {
  background: rgba(37, 99, 235, 0.2);
  border-color: rgba(96, 165, 250, 0.26);
  color: #bfdbfe;
}

.changelog-panel.darkMode.inline-popup .tag--current {
  background: rgba(5, 150, 105, 0.18);
  border-color: rgba(52, 211, 153, 0.24);
  color: #a7f3d0;
}

.changelog-panel.darkMode.inline-popup .detail-list li::before {
  background: rgba(148, 163, 184, 0.72);
}

.changelog-panel.darkMode.inline-popup .detail-list li.is-major::before {
  background: #60a5fa;
}

.intro-card,
.version-card,
.support-card {
  border-radius: 14px;
  border: 1px solid #e6ebf2;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.intro-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  margin-bottom: 14px;
}

.intro-card__eyebrow,
.version-card__label {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #8b98ab;
}

.intro-card__version {
  margin-top: 6px;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 700;
  color: #111827;
}

.tip-text,
.html-tip {
  margin: 0 0 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f4f7fb;
  color: #4b5563;
  line-height: 1.7;
}

.html-tip :deep(a) {
  color: #2563eb;
  text-decoration: none;
}

.version-list,
.detail-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-card {
  padding: 16px 18px;
}

.version-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.version-card h5 {
  margin: 0;
  font-size: 18px;
  color: #111827;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.tag--primary {
  background: rgba(37, 99, 235, 0.12);
  border-color: rgba(37, 99, 235, 0.2);
  color: #2563eb;
}

.tag--current {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.2);
  color: #059669;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-list li {
  position: relative;
  padding-left: 16px;
  line-height: 1.7;
  color: #374151;
}

.detail-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 11px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
}

.detail-list li.is-major {
  color: #111827;
  font-weight: 600;
}

.detail-list li.is-major::before {
  background: #2563eb;
}

.support-card {
  margin-top: 14px;
  padding: 14px 16px;
}

.support-card__title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.support-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.support-links a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.changelog {
  &:deep(.el-dialog) {
    margin-bottom: 15px;
    border-radius: 18px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
  }

  &:deep(.el-dialog__header) {
    padding: 28px 24px 18px;
    border-bottom: 1px solid #eef2f7;
  }

  &:deep(.el-dialog__title) {
    color: #111827;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.2;
  }

  &:deep(.el-dialog__body) {
    padding: 10px 18px 6px;
    color: #374151;
  }

  &:deep(.el-dialog__footer) {
    padding: 14px 24px 22px;
    border-top: 1px solid #eef2f7;
  }

  &:deep(.dialog-footer) {
    display: flex;
    justify-content: flex-end;
  }

  &:deep(.dialog-footer__button.el-button) {
    min-height: 32px;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
}

.changelog.darkMode {
  &:deep(.el-dialog.changelog.darkMode) {
    background: linear-gradient(180deg, #161c27 0%, #0f1722 100%);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  }

  &:deep(.el-dialog.changelog.darkMode .el-dialog__header) {
    border-bottom-color: rgba(148, 163, 184, 0.18);
  }

  &:deep(.el-dialog.changelog.darkMode .el-dialog__title),
  &:deep(.el-dialog.changelog.darkMode .el-dialog__body) {
    color: rgba(255, 255, 255, 0.92);
  }

  &:deep(.el-dialog.changelog.darkMode .el-dialog__footer) {
    border-top-color: rgba(148, 163, 184, 0.18);
  }

  .intro-card,
  .version-card,
  .support-card {
    border-color: rgba(96, 165, 250, 0.18);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.96) 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .intro-card__eyebrow,
  .version-card__label {
    color: rgba(191, 219, 254, 0.66);
  }

  .intro-card__version,
  .version-card h5,
  .detail-list li.is-major,
  .support-card__title {
    color: rgba(255, 255, 255, 0.96);
  }

  .tip-text,
  .html-tip {
    background: rgba(30, 41, 59, 0.82);
    color: rgba(226, 232, 240, 0.88);
  }

  .html-tip :deep(a),
  .support-links a {
    color: #7dd3fc;
  }

  .tag--primary {
    background: rgba(59, 130, 246, 0.22);
    border-color: rgba(96, 165, 250, 0.32);
    color: #bfdbfe;
  }

  .tag--current {
    background: rgba(16, 185, 129, 0.18);
    border-color: rgba(52, 211, 153, 0.26);
    color: #a7f3d0;
  }

  .detail-list li {
    color: rgba(226, 232, 240, 0.84);
  }

  .detail-list li::before {
    background: rgba(148, 163, 184, 0.72);
  }

  .detail-list li.is-major::before {
    background: #60a5fa;
  }

  &:deep(.el-dialog.changelog.darkMode .el-button--primary) {
    border-color: rgba(96, 165, 250, 0.5);
    background: linear-gradient(180deg, rgba(59, 130, 246, 0.92) 0%, rgba(37, 99, 235, 0.92) 100%);
    color: #eff6ff;
  }

  &:deep(.el-dialog.changelog.darkMode .dialog-footer__button.el-button) {
    box-shadow: none;
  }
}
</style>
