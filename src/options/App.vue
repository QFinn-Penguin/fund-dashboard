<template>
  <div id="app" class="container" :class="containerClass" :style="containerInlineStyles">
    <div class="options-shell">
      <change-log
        v-if="showInlineChangelog"
        @close="closeChangelog"
        :visible="showInlineChangelog"
        :inlineStyle="inlineChangelogStyle"
        mode="inline"
        :darkMode="darkMode"
        class="page-inline-log"
      ></change-log>
      <reward :top="50" ref="reward"></reward>

      <header class="page-header">
        <div>
          <p class="page-eyebrow">基金看板</p>
          <h1 class="page-title">设置</h1>
          <p class="page-description">
            调整显示方式、角标提醒、快捷键和数据管理。
          </p>
        </div>
      </header>

      <section class="settings-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">基础显示</h2>
            <p class="section-description">
              调整 popup 的显示方式和阅读密度。
            </p>
          </div>
        </div>

        <div class="setting-group">
          <div class="group-heading">外观</div>
          <div class="setting-row setting-row--switch">
            <div class="setting-main">
              <div class="setting-label">主题模式</div>
              <div class="setting-help">在标准模式与暗色模式之间切换。</div>
            </div>
            <el-switch
              v-model="darkMode"
              @change="changeDarkMode"
              active-color="#484848"
              inactive-color="#13ce66"
              inactive-text="标准模式"
              active-text="暗色模式"
            >
            </el-switch>
          </div>
          <div class="setting-row setting-row--switch">
            <div class="setting-main">
              <div class="setting-label">字号密度</div>
              <div class="setting-help">迷你字号更紧凑，标准字号更易读。</div>
            </div>
            <el-switch
              v-model="normalFontSize"
              @change="changeFontSize"
              inactive-text="迷你字号"
              active-text="标准字号"
            >
            </el-switch>
          </div>
          <div class="setting-row setting-row--range">
            <div class="setting-main">
              <div class="setting-label">界面灰度</div>
              <div class="setting-help">给 popup 整体增加灰阶滤镜，适合降低彩色干扰。</div>
            </div>
            <div class="range-control">
              <div class="range-control__value">{{ grayscaleValue }}%</div>
              <el-slider
                v-model="grayscaleValue"
                @input="previewGrayscaleValue"
                @change="changeGrayscaleValue"
                :format-tooltip="formatTooltip"
              ></el-slider>
            </div>
          </div>
          <div class="setting-row setting-row--range">
            <div class="setting-main">
              <div class="setting-label">背景透明度</div>
              <div class="setting-help">调节 popup 页面背景的透出程度，最高可到 90%。</div>
            </div>
            <div class="range-control">
              <div class="range-control__value">{{ opacityValue }}%</div>
              <el-slider
                :max="90"
                v-model="opacityValue"
                @input="previewOpacityValue"
                @change="changeOpacityValue"
                :format-tooltip="formatTooltip"
              ></el-slider>
            </div>
          </div>
        </div>

        <div class="setting-group">
          <div class="group-heading">列表显示项</div>
          <div class="setting-grid">
            <div class="setting-panel">
              <div class="setting-panel__title">基础信息</div>
              <div class="setting-row setting-row--switch compact">
                <div class="setting-main">
                  <div class="setting-label">显示估算净值</div>
                  <div class="setting-help">在列表中显示盘中估值净值。</div>
                </div>
                <el-switch
                  v-model="showGSZ"
                  @change="changeOption($event, 'showGSZ')"
                >
                </el-switch>
              </div>
              <div class="setting-row setting-row--switch compact">
                <div class="setting-main">
                  <div class="setting-label">显示持有金额</div>
                  <div class="setting-help">为收益额和持仓估值提供基础数据。</div>
                </div>
                <el-switch
                  v-model="showAmount"
                  @change="changeOption($event, 'showAmount')"
                >
                </el-switch>
              </div>
              <div class="setting-row setting-row--switch compact">
                <div class="setting-main">
                  <div class="setting-label">显示昨日涨跌幅</div>
                  <div class="setting-help">补充上一交易日的变化信息。</div>
                </div>
                <el-switch
                  v-model="showPrevGszzl"
                  @change="changeOption($event, 'showPrevGszzl')"
                >
                </el-switch>
              </div>
            </div>

            <div class="setting-panel">
              <div class="setting-panel__title">收益信息</div>
              <div class="setting-row setting-row--switch compact">
                <div class="setting-main">
                  <div class="setting-label">显示当日收益</div>
                  <div class="setting-help">按持有份额显示当前口径对应的当日收益。</div>
                </div>
                <el-switch
                  v-model="showGains"
                  @change="changeOption($event, 'showGains')"
                >
                </el-switch>
              </div>
              <div class="setting-row setting-row--switch compact">
                <div class="setting-main">
                  <div class="setting-label">显示持有收益</div>
                  <div class="setting-help">展示累计持有收益金额。</div>
                </div>
                <el-switch
                  v-model="showCost"
                  @change="changeOption($event, 'showCost')"
                >
                </el-switch>
              </div>
              <div class="setting-row setting-row--switch compact">
                <div class="setting-main">
                  <div class="setting-label">显示持有收益率</div>
                  <div class="setting-help">展示累计持有收益率。</div>
                </div>
                <el-switch
                  v-model="showCostRate"
                  @change="changeOption($event, 'showCostRate')"
                >
                </el-switch>
              </div>
            </div>
          </div>
        </div>

        <div class="setting-group">
          <div class="group-heading">页面容量</div>
          <div class="setting-row page-size-setting">
            <div class="setting-main">
              <div class="setting-label">每页展示基金数量</div>
              <div class="setting-help">控制 popup 每页显示的基金数，范围 1 - 20。</div>
            </div>
            <div class="page-size-controls">
              <input
                v-model.number="popupPageSize"
                @change="changePageSize"
                class="page-size-input"
                type="number"
                min="1"
                max="20"
              />
              <em>每页 1 - 20 只</em>
            </div>
          </div>
          <div class="help-panel">
            在编辑设置里，输入持有份额可计算当日收益，输入持仓成本可计算累计持有收益。
          </div>
        </div>
      </section>

      <section class="settings-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">角标提醒</h2>
            <p class="section-description">
              设置角标的显示范围和指标。
            </p>
          </div>
        </div>

        <div class="setting-group setting-group--badge-flow">
          <div class="group-heading group-heading--badge">步骤 1 · 是否显示角标</div>
          <div class="choice-group choice-group--soft choice-group--badge-step1">
            <el-radio-group
              v-model="showBadge"
              @change="changeOption($event, 'showBadge', true)"
            >
              <el-radio border :label="1">打开角标</el-radio>
              <el-radio border :label="2">关闭角标</el-radio>
            </el-radio-group>
          </div>
        </div>

        <div v-if="showBadge == 1" class="setting-group setting-group--badge-flow">
          <div class="group-heading group-heading--badge">步骤 2 · 角标统计范围</div>
          <div class="choice-group choice-group--soft choice-group--badge-step2">
            <el-radio-group
              v-model="BadgeContent"
              @change="changeOption($event, 'BadgeContent', true)"
            >
              <el-radio border :label="1">当前分组特别关注</el-radio>
              <el-radio border :label="2">当前分组全部基金</el-radio>
              <el-radio border :label="3">单个指数</el-radio>
            </el-radio-group>
          </div>
        </div>

        <div v-if="showBadge == 1 && BadgeContent != 3" class="setting-group setting-group--badge-flow">
          <div class="group-heading group-heading--badge">步骤 3 · 角标显示指标</div>
          <div class="choice-group choice-group--soft choice-group--badge-step3">
            <el-radio-group
              v-model="BadgeType"
              @change="changeOption($event, 'BadgeType', true)"
            >
              <el-radio border :label="1">日收益率</el-radio>
              <el-radio border :label="2">日收益额</el-radio>
            </el-radio-group>
          </div>
        </div>

        <div class="help-panel help-panel--muted">
          <ul class="help-list">
            <li>当前分组特别关注：显示当前分组里标记为特别关注的基金。</li>
            <li>当前分组全部基金：只汇总当前分组中的全部基金。</li>
            <li>若要计算收益额，请先打开“显示持有金额”并填写对应基金的持有额。</li>
          </ul>
        </div>
      </section>

      <section class="settings-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">快捷键</h2>
            <p class="section-description">
              为 popup 内常用操作设置快捷键。
            </p>
          </div>
        </div>

        <div class="setting-group shortcut-group">
          <div class="setting-row shortcut-setting">
            <div class="setting-main">
              <div class="setting-label">切换分组</div>
              <div class="setting-help">快速在当前 popup 中切换分组。</div>
            </div>
            <div class="shortcut-input-wrap">
              <input
                class="shortcut-input"
                :class="activeShortcutField === 'groupNextShortcut' ? 'is-capturing' : ''"
                :value="groupNextShortcut"
                @focus="startShortcutCapture('groupNextShortcut')"
                @blur="stopShortcutCapture"
                @keydown="captureShortcut($event, 'groupNextShortcut')"
                type="text"
                readonly
                :placeholder="shortcutPlaceholderText.groupNextShortcut"
              />
              <span v-if="activeShortcutField === 'groupNextShortcut'" class="capture-badge">
                录入中
              </span>
            </div>
          </div>

          <div class="setting-row shortcut-setting">
            <div class="setting-main">
              <div class="setting-label">上一页</div>
              <div class="setting-help">浏览分页列表时快速回到上一页。</div>
            </div>
            <div class="shortcut-input-wrap">
              <input
                class="shortcut-input"
                :class="activeShortcutField === 'pagePrevShortcut' ? 'is-capturing' : ''"
                :value="pagePrevShortcut"
                @focus="startShortcutCapture('pagePrevShortcut')"
                @blur="stopShortcutCapture"
                @keydown="captureShortcut($event, 'pagePrevShortcut')"
                type="text"
                readonly
                :placeholder="shortcutPlaceholderText.pagePrevShortcut"
              />
              <span v-if="activeShortcutField === 'pagePrevShortcut'" class="capture-badge">
                录入中
              </span>
            </div>
          </div>

          <div class="setting-row shortcut-setting">
            <div class="setting-main">
              <div class="setting-label">下一页</div>
              <div class="setting-help">浏览分页列表时快速进入下一页。</div>
            </div>
            <div class="shortcut-input-wrap">
              <input
                class="shortcut-input"
                :class="activeShortcutField === 'pageNextShortcut' ? 'is-capturing' : ''"
                :value="pageNextShortcut"
                @focus="startShortcutCapture('pageNextShortcut')"
                @blur="stopShortcutCapture"
                @keydown="captureShortcut($event, 'pageNextShortcut')"
                type="text"
                readonly
                :placeholder="shortcutPlaceholderText.pageNextShortcut"
              />
              <span v-if="activeShortcutField === 'pageNextShortcut'" class="capture-badge">
                录入中
              </span>
            </div>
          </div>
        </div>

        <div class="help-panel help-panel--compact help-panel--muted">
          {{ shortcutTipsText }}
        </div>
      </section>

      <section class="settings-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">配置与数据</h2>
            <p class="section-description">
              导入导出配置，并进行文本级别的数据维护。
            </p>
          </div>
        </div>

        <div class="setting-grid setting-grid--utility">
          <div class="setting-panel setting-panel--utility setting-panel--utility-expanded">
            <div class="utility-panel-layout">
              <div class="utility-panel-copy">
                <div class="setting-panel__title">配置备份与恢复</div>
                <p class="panel-description utility-panel-description">
                  用于手动同步浏览器之间的配置，或临时进行文本级别的批量修改。
                </p>
                <div class="utility-panel-meta">
                  插件默认可跟随浏览器账号自动同步；需要手动迁移或批量维护时，可使用下方三种方式。
                </div>
              </div>

              <div class="utility-panel-actions">
                <div class="utility-action-stack">
                  <input
                    class="btn btn--primary-surface utility-action utility-action--primary"
                    type="button"
                    value="导出配置文件"
                    @click="exportConfig"
                  />
                  <a
                    class="exportBtn"
                    ref="configMsg"
                    :href="configHref"
                    download="基金看板配置文件.json"
                  ></a>
                  <div class="utility-action-row">
                  <label class="uploadFile btn btn--soft utility-action"
                    >导入配置文件
                    <input
                      ref="importInput"
                      type="file"
                      accept="application/json"
                      @change="importInput"
                    />
                  </label>
                  <input
                    class="btn btn--soft utility-action"
                    type="button"
                    value="导入导出文本"
                    @click="openConfigBox"
                  />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="help-panel help-panel--compact help-panel--muted">
          插件本身支持跟随浏览器账号自动同步；若想手动同步，可使用配置文件或文本导入导出。
        </div>
      </section>

      <section class="settings-card settings-card--footer">
        <div class="section-header">
          <div>
            <h2 class="section-title">关于与支持</h2>
            <p class="section-description">
              版本信息、项目链接和支持入口。
            </p>
          </div>
        </div>

        <div class="footer-stack">
          <div class="setting-panel setting-panel--footer">
            <div class="setting-panel__title">关于项目</div>
            <div class="footer-meta-row">
              <span class="footer-meta">当前插件版本：v{{ version }}</span>
              <div class="action-row action-row--tight">
                <input
                  ref="changelogTrigger"
                  class="btn"
                  type="button"
                  value="更新日志"
                  @click="changelog"
                />
                <span
                  title="点击查看项目源码"
                  class="icon-btn-row"
                  @click="openGithub"
                >
                  <svg
                    class="githubIcon"
                    height="24"
                    viewBox="0 0 16 16"
                    version="1.1"
                    width="24"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                    />
                  </svg>
                  <input
                    class="btn githubText"
                    type="button"
                    value="GitHub 源代码"
                  />
                </span>
              </div>
            </div>
          </div>

          <div class="setting-panel setting-panel--footer">
            <div class="setting-panel__title">支持项目</div>
            <div class="footer-support-row">
              <p class="panel-description footer-support-copy">
                开源维护需要持续投入。如果这个插件对你有帮助，可以 star 仓库，或请作者喝杯咖啡。
              </p>
              <div class="action-row action-row--tight footer-support-actions">
                <input
                  class="btn primary"
                  type="button"
                  title="φ(>ω<*)"
                  value="点击打赏"
                  @click="reward"
                />
              </div>
            </div>
          </div>
        </div>

        <config-box
          @success="successInput"
          :darkMode="darkMode"
          ref="configBox"
          :top="40"
        >
        </config-box>
      </section>
    </div>
  </div>
</template>

<script>
import reward from "../common/reward";
import changeLog from "../common/changeLog";
import configBox from "../common/configBox";
import { getExtensionStorage } from "../common/extensionStorage";
import { persistImportedConfig } from "../common/importConfig";
import { FUND_TRANSACTIONS_STORAGE_KEY } from "../common/storageKeys";
const { version } = require("../../package.json");
import { buildExportConfigText, validateAndUnpackImportedConfigText } from "../common/configTransfer";
import {
  DEFAULT_DISPLAY_TOGGLES,
  DEFAULT_POPUP_PAGE_SIZE,
  DEFAULT_POPUP_SHORTCUTS,
  buildOptionsPreferenceArtifacts,
  buildShortcutFromKeyEvent,
  normalizePopupPageSize,
  normalizeShortcut,
  POPUP_SHORTCUT_DISPLAY_TEXT,
} from "../common/popupPreferences";
import {
  buildOptionsImportArtifacts,
} from "../common/fundStorage";

export default {
  components: {
    reward,
    changeLog,
    configBox,
  },
  data() {
    return {
      fundListM: null,
      userId: null,
      configHref: null,
      showGSZ: DEFAULT_DISPLAY_TOGGLES.showGSZ,
      showAmount: DEFAULT_DISPLAY_TOGGLES.showAmount,
      showGains: DEFAULT_DISPLAY_TOGGLES.showGains,
      showCost: DEFAULT_DISPLAY_TOGGLES.showCost,
      showCostRate: DEFAULT_DISPLAY_TOGGLES.showCostRate,
      showPrevGszzl: DEFAULT_DISPLAY_TOGGLES.showPrevGszzl,
      popupPageSize: DEFAULT_POPUP_PAGE_SIZE,
      darkMode: false,
      grayscaleValue: 0,
      opacityValue: 0,
      grayscaleStyle: {},
      opacityStyle: {
        "--page-bg-alpha": 1,
      },
      showBadge: 1,
      BadgeContent: 1,
      BadgeType: 1,
      changelogShadow: false,
      normalFontSize: false,
      showInlineChangelog: false,
      inlineChangelogStyle: {},
      inlineChangelogScrollTop: 0,
      groupNextShortcut: DEFAULT_POPUP_SHORTCUTS.groupNextShortcut,
      pagePrevShortcut: DEFAULT_POPUP_SHORTCUTS.pagePrevShortcut,
      pageNextShortcut: DEFAULT_POPUP_SHORTCUTS.pageNextShortcut,
      activeShortcutField: "",
      version,
    };
  },
  mounted() {
    this.initOption();
  },
  beforeDestroy() {
    this.revokeConfigHref();
  },
  watch: {
    grayscaleValue: {
      immediate: true,
      handler() {
        this.applyOptionsAppearancePreferences();
      },
    },
    opacityValue: {
      immediate: true,
      handler() {
        this.applyOptionsAppearancePreferences();
      },
    },
  },
  computed: {
    containerInlineStyles() {
      return [
        this.grayscaleStyle,
        this.opacityStyle,
      ];
    },
    containerClass() {
      if (this.darkMode) {
        return "darkMode";
      }
    },
    shortcutPlaceholderText() {
      return POPUP_SHORTCUT_DISPLAY_TEXT;
    },
    shortcutTipsText() {
      return `tips：点击输入框后直接按下组合键，例如 ${POPUP_SHORTCUT_DISPLAY_TEXT.groupNextShortcut}、${POPUP_SHORTCUT_DISPLAY_TEXT.pagePrevShortcut}、Ctrl+Shift+ArrowRight。快捷键只在插件 popup 打开时生效。`;
    },
  },
  methods: {
    applyOptionsAppearancePreferences() {
      const optionPreferenceArtifacts = buildOptionsPreferenceArtifacts({
        grayscaleValue: this.grayscaleValue,
        opacityValue: this.opacityValue,
      });
      this.grayscaleStyle = optionPreferenceArtifacts.grayscaleStyle;
      this.opacityStyle = optionPreferenceArtifacts.opacityStyle;
    },
    getShortcutFallback(type) {
      return DEFAULT_POPUP_SHORTCUTS[type] || "";
    },
    changePageSize() {
      const nextValue = normalizePopupPageSize(this.popupPageSize);
      this.popupPageSize = nextValue;
      this.changeOption(nextValue, "popupPageSize", true);
    },
    changelog() {
      if (this.showInlineChangelog) {
        this.closeChangelog();
        return;
      }

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

      this.inlineChangelogStyle = {
        marginTop: "12px",
      };

      this.inlineChangelogScrollTop = scrollTop;
      document.body.style.overflow = "hidden";
      this.showInlineChangelog = true;
    },
    closeChangelog() {
      window.scrollTo({ top: this.inlineChangelogScrollTop });
      document.body.style.overflow = "";
      this.showInlineChangelog = false;
      this.inlineChangelogStyle = {};
    },
    changeOption(val, type, sendMessage) {
      chrome.storage.sync.set(
        {
          [type]: val,
        },
        () => {
          this[type] = val;
          if (sendMessage) {
            chrome.runtime.sendMessage({
              type: "refreshOption",
              data: { type: type, value: val },
            });
          }
        }
      );
    },
    startShortcutCapture(type) {
      this.activeShortcutField = type;
    },
    stopShortcutCapture() {
      this.activeShortcutField = "";
    },
    captureShortcut(event, type) {
      if (event.key === "Tab") {
        return;
      }

      const shortcut = buildShortcutFromKeyEvent(event);
      if (!shortcut) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this[type] = shortcut;
      this.changeShortcut(type);
    },
    changeShortcut(type) {
      const normalizedValue = normalizeShortcut(
        this[type],
        this.getShortcutFallback(type)
      );
      chrome.storage.sync.set(
        {
          [type]: normalizedValue,
        },
        () => {
          this[type] = normalizedValue;
        }
      );
    },
    initOption() {
      getExtensionStorage(
        [
          "showNum",
          "showAmount",
          "showGains",
          "showCost",
          "showCostRate",
          "showPrevGszzl",
          "showGSZ",
          "popupPageSize",
          "darkMode",
          "grayscaleValue",
          "opacityValue",
          "normalFontSize",
          "showBadge",
          "BadgeContent",
          "BadgeType",
          "userId",
          "fundListGroup",
          "currentGroupIndex",
          "groupNextShortcut",
          "pagePrevShortcut",
          "pageNextShortcut",
        ],
        (res) => {
          const optionPreferenceArtifacts = buildOptionsPreferenceArtifacts(res);
          if (res.showNum) {
            //解决版本遗留问题，拆分属性
            chrome.storage.sync.set({
              showNum: false,
            });
            chrome.storage.sync.set(
              {
                showAmount: true,
              },
              () => {
                this.showAmount = true;
              }
            );
            chrome.storage.sync.set(
              {
                showGains: true,
              },
              () => {
                this.showGains = true;
              }
            );
          } else {
            this.showAmount = optionPreferenceArtifacts.displayToggleState.showAmount;
            this.showGains = optionPreferenceArtifacts.displayToggleState.showGains;
          }
          const normalizedRes = buildOptionsImportArtifacts({
            ...res,
            popupPageSize: optionPreferenceArtifacts.pageSize,
          });

          if (res.userId) {
            this.userId = res.userId;
          } else {
            this.userId = this.getGuid();
            chrome.storage.sync.set({
              userId: this.userId,
            });
          }
          this.fundListM = normalizedRes.currentFunds ? normalizedRes.currentFunds : [];
          this.showGSZ = optionPreferenceArtifacts.displayToggleState.showGSZ;
          this.showCost = optionPreferenceArtifacts.displayToggleState.showCost;
          this.showCostRate = optionPreferenceArtifacts.displayToggleState.showCostRate;
          this.showPrevGszzl = optionPreferenceArtifacts.displayToggleState.showPrevGszzl;
          this.popupPageSize = optionPreferenceArtifacts.pageSize;
          this.darkMode = optionPreferenceArtifacts.darkMode;
          this.grayscaleValue = optionPreferenceArtifacts.grayscaleValue;
          this.opacityValue = optionPreferenceArtifacts.opacityValue;
          this.normalFontSize = optionPreferenceArtifacts.normalFontSize;
          this.showBadge = optionPreferenceArtifacts.showBadge;
          this.BadgeContent = optionPreferenceArtifacts.BadgeContent;
          this.BadgeType = optionPreferenceArtifacts.BadgeType;
          this.groupNextShortcut = normalizeShortcut(
            optionPreferenceArtifacts.shortcuts.groupNextShortcut,
            DEFAULT_POPUP_SHORTCUTS.groupNextShortcut
          );
          this.pagePrevShortcut = normalizeShortcut(
            optionPreferenceArtifacts.shortcuts.pagePrevShortcut,
            DEFAULT_POPUP_SHORTCUTS.pagePrevShortcut
          );
          this.pageNextShortcut = normalizeShortcut(
            optionPreferenceArtifacts.shortcuts.pageNextShortcut,
            DEFAULT_POPUP_SHORTCUTS.pageNextShortcut
          );

          if (Object.keys(optionPreferenceArtifacts.missingDisplayToggles).length) {
            chrome.storage.sync.set(optionPreferenceArtifacts.missingDisplayToggles);
          }
        }
      );
    },
    exportConfig() {
      getExtensionStorage(null, (res) => {
        this.revokeConfigHref();
        this.configHref = URL.createObjectURL(
          new Blob([buildExportConfigText(res)], {
            type: "application/json;charset=utf-8",
          })
        );
        setTimeout(() => {
          this.$refs["configMsg"].click();
        }, 200);
      });
    },
    revokeConfigHref() {
      if (this.configHref && this.configHref.indexOf("blob:") === 0) {
        URL.revokeObjectURL(this.configHref);
      }
      this.configHref = null;
    },
    importInput(e) {
      let files = e.target.files;
      if (!files || !files.length) {
        throw new Error("No files");
      }

      let reader = new FileReader();
      reader.onload = (event) => {
        const validationResult = validateAndUnpackImportedConfigText(event.target.result);
        if (!validationResult.ok) {
          this.$message({
            message: validationResult.message,
            type: "error",
            center: true,
          });
          this.$refs.importInput.value = null;
          return;
        }

        const config = validationResult.config;
        const optionPreferenceArtifacts = buildOptionsPreferenceArtifacts(config);
        const normalizedConfigArtifacts = buildOptionsImportArtifacts({
          ...config,
          popupPageSize: optionPreferenceArtifacts.pageSize,
        });
        const normalizedConfig = {
          ...normalizedConfigArtifacts.persistedConfig,
        };
        if (typeof normalizedConfig[FUND_TRANSACTIONS_STORAGE_KEY] === "undefined") {
          normalizedConfig[FUND_TRANSACTIONS_STORAGE_KEY] = {};
        }
        persistImportedConfig(normalizedConfig, () => {
          this.initOption();
          chrome.runtime.sendMessage({ type: "refresh" });
          this.$message({
            message: "恭喜,导入配置成功！",
            type: "success",
            center: true,
          });
          this.$refs.importInput.value = null;
        });
      };
      reader.readAsText(files[0]);
    },
    successInput() {
      this.initOption();
      chrome.runtime.sendMessage({ type: "refresh" });
    },
    openConfigBox() {
      this.$refs.configBox.init();
    },
    openGithub() {
      window.open("https://github.com/QFinn-Penguin/fund-dashboard");
    },
    reward(data) {
      this.$refs.reward.init();
    },
    changeDarkMode() {
      chrome.storage.sync.set({
        darkMode: this.darkMode,
      });
    },
    formatTooltip(val) {
      return val + "%";
    },
    previewGrayscaleValue(val) {
      this.grayscaleValue = val;
    },
    changeGrayscaleValue() {
      chrome.storage.sync.set({
        grayscaleValue: this.grayscaleValue,
      });
    },
    previewOpacityValue(val) {
      this.opacityValue = val;
    },
    changeOpacityValue() {
      chrome.storage.sync.set({
        opacityValue: this.opacityValue,
      });
    },
    changeFontSize() {
      chrome.storage.sync.set({
        normalFontSize: this.normalFontSize,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  --page-bg-alpha: 1;
  min-width: 720px;
  min-height: 520px;
  padding: 24px 0 32px;
  font-size: 13px;
  color: #1f2937;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, calc(0.08 * var(--page-bg-alpha))), transparent 34%),
    linear-gradient(180deg, rgba(248, 251, 255, var(--page-bg-alpha)) 0%, rgba(244, 247, 251, var(--page-bg-alpha)) 100%);
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  box-sizing: border-box;
}

.options-shell {
  position: relative;
  width: 680px;
  margin: 0 auto;
  text-align: left;
}

.page-inline-log {
  position: fixed;
  inset: 0;
  z-index: 30;
}

.page-header {
  margin-bottom: 18px;
  padding: 6px 4px 0;
}

.page-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #64748b;
}

.page-title {
  margin: 0;
  font-size: 32px;
  line-height: 1.1;
  color: #0f172a;
}

.page-description {
  margin: 10px 0 0;
  max-width: 560px;
  font-size: 14px;
  line-height: 1.7;
  color: #475569;
}

.settings-card {
  margin-bottom: 16px;
  padding: 18px 20px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.settings-card--footer {
  background: rgba(244, 247, 251, 0.9);
  border-color: rgba(148, 163, 184, 0.22);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.section-description {
  margin: 6px 0 0;
  max-width: 560px;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.setting-group + .setting-group {
  margin-top: 18px;
}

.setting-group--badge-flow + .setting-group--badge-flow {
  margin-top: 14px;
}

.group-heading {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.group-heading--badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.group-heading--badge::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.72);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.setting-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.setting-grid--utility {
  align-items: stretch;
  grid-template-columns: minmax(0, 1fr);
}

.setting-panel {
  position: relative;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.86);
}

.setting-panel--utility,
.setting-panel--footer {
  background: rgba(255, 255, 255, 0.78);
}

.setting-panel--utility-expanded {
  padding: 18px;
}

.utility-panel-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.9fr);
  gap: 18px;
  align-items: stretch;
}

.utility-panel-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.utility-panel-description {
  margin-bottom: 0;
}

.utility-panel-meta {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(241, 245, 249, 0.9), rgba(248, 250, 252, 0.94));
  color: #475569;
  font-size: 12px;
  line-height: 1.7;
}

.utility-panel-actions {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.utility-action-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.utility-action-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

.utility-action-row > * {
  min-width: 0;
}

.utility-action {
  display: flex;
  width: 100%;
  min-height: 56px;
  padding: 0 18px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 700;
  box-sizing: border-box;
}

.utility-action--primary {
  min-height: 68px;
}

.setting-panel__title {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.panel-description {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
}

.setting-row + .setting-row {
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.setting-row.compact {
  padding: 10px 0;
}

.setting-row--range {
  align-items: flex-start;
}

.setting-main {
  flex: 1;
  min-width: 0;
}

.range-control {
  width: 240px;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.range-control__value {
  align-self: flex-end;
  min-width: 54px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: #111827;
}

.setting-help {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.choice-group {
  padding: 4px 0 0;
}

.choice-group--soft {
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(243, 247, 253, 0.98), rgba(233, 240, 248, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.choice-group--badge-step2 {
  padding-bottom: 12px;
}

.choice-group--badge-step1,
.choice-group--badge-step3 {
  padding-bottom: 12px;
}

.choice-group--badge-step1 :deep(.el-radio-group),
.choice-group--badge-step3 :deep(.el-radio-group) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-items: stretch;
}

.choice-group--badge-step2 :deep(.el-radio-group) {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.3fr) minmax(160px, 0.9fr);
  gap: 8px;
  align-items: stretch;
}

.help-panel {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.08);
  color: #35517a;
  font-size: 13px;
  line-height: 1.7;
}

.help-panel--compact {
  margin-top: 12px;
}

.help-panel--muted {
  background: rgba(148, 163, 184, 0.1);
  color: #475569;
}

.help-list {
  margin: 0;
  padding-left: 18px;
}

.help-list li + li {
  margin-top: 4px;
}

::v-deep .choice-group--soft .el-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: stretch;
}

::v-deep .choice-group--soft .el-radio.is-bordered {
  display: inline-flex;
  align-items: center;
  height: 40px;
  margin: 0;
  padding: 0 15px;
  border-radius: 999px;
  border-color: rgba(148, 163, 184, 0.26);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(226, 232, 240, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
  transition: border-color 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease,
    transform 0.16s ease;
}

::v-deep .choice-group--soft .el-radio__input {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: 100%;
  vertical-align: middle;
}

::v-deep .choice-group--soft .el-radio__inner {
  top: 0;
}

::v-deep .choice-group--soft .el-radio.is-bordered:hover {
  border-color: rgba(148, 163, 184, 0.36);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(235, 241, 249, 0.98));
}

::v-deep .choice-group--soft .el-radio.is-bordered.is-checked {
  border-color: rgba(96, 165, 250, 0.38);
  background: linear-gradient(180deg, rgba(219, 234, 254, 0.98), rgba(191, 219, 254, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76), 0 8px 18px rgba(96, 165, 250, 0.18);
  transform: translateY(-1px);
}

::v-deep .choice-group--soft .el-radio__label {
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding-left: 10px;
  line-height: 1;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: #334155;
}

::v-deep .choice-group--soft .el-radio__input.is-checked + .el-radio__label {
  color: #1d4ed8;
}

::v-deep .choice-group--soft .el-radio__input.is-checked .el-radio__inner {
  background-color: rgba(59, 130, 246, 0.9);
  border: 1px solid rgba(59, 130, 246, 0.9);
}

.page-size-setting {
  align-items: flex-start;
}

.page-size-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-controls em {
  font-size: 12px;
  color: #64748b;
  font-style: normal;
}

.page-size-input,
.shortcut-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.95);
  box-sizing: border-box;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.page-size-input {
  width: 88px;
}

.page-size-input:focus,
.shortcut-input.is-capturing,
.shortcut-input:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.14);
  outline: none;
}

.shortcut-group {
  display: grid;
  gap: 12px;
}

.shortcut-setting {
  margin: 0;
  padding: 0;
  border: 0;
}

.shortcut-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.shortcut-input {
  width: 210px;
  padding-right: 64px;
}

.capture-badge {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #1d4ed8;
  background: rgba(59, 130, 246, 0.12);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-row--stacked {
  gap: 10px;
}

.action-row--tight {
  gap: 10px;
}

.maintenance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.maintenance-copy {
  flex: 1;
  min-width: 0;
}

.maintenance-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.footer-stack {
  display: grid;
  gap: 12px;
}

.footer-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-support-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.footer-support-copy {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.footer-support-actions {
  justify-content: flex-end;
  align-self: flex-end;
  flex-shrink: 0;
}

.footer-meta {
  font-size: 14px;
  color: #334155;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  line-height: 1;
  cursor: pointer;
  background: #ffffff;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  border: 1px solid #cbd5e1;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease,
    background-color 0.16s ease;
}

.btn:hover:not([disabled]) {
  transform: translateY(-1px);
  border-color: #94a3b8;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.btn--soft {
  background: rgba(248, 250, 252, 0.78);
}

::v-deep .range-control .el-slider__runway {
  margin: 4px 0 2px;
  height: 6px;
  border-radius: 999px;
  background: rgba(203, 213, 225, 0.78);
}

::v-deep .range-control .el-slider__bar {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.82), rgba(37, 99, 235, 0.92));
}

::v-deep .range-control .el-slider__button-wrapper {
  top: -15px;
}

::v-deep .range-control .el-slider__button {
  width: 14px;
  height: 14px;
  border: 2px solid #2563eb;
  background: #ffffff;
}

.btn--primary-surface {
  border-color: rgba(59, 130, 246, 0.24);
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.98), rgba(219, 234, 254, 0.9));
  color: #1d4ed8;
}

.btn--primary-surface:hover:not([disabled]) {
  border-color: rgba(59, 130, 246, 0.46);
  box-shadow: 0 12px 22px rgba(59, 130, 246, 0.14);
}

.exportBtn {
  visibility: hidden;
}

.uploadFile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
  text-decoration: none;
}

.uploadFile input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  font-size: 0;
  cursor: pointer;
  opacity: 0;
}

.btn[disabled] {
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

.loading {
  font-size: 12px;
  color: #64748b;
}

.text-link {
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
}

.text-link:hover {
  text-decoration: underline;
}

.icon-btn-row {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

.githubIcon {
  position: absolute;
  top: 6px;
  left: 12px;
}

.githubText {
  padding: 0 14px 0 40px;
  color: #0f172a;
  border-color: #cbd5e1;
  background: #ffffff;
}

.primary {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-color: #2563eb;
}

.black {
  color: rgba(255, 255, 255, 0.86);
  border-color: rgba(255, 255, 255, 0.4);
}

.container.darkMode {
  color: rgba(255, 255, 255, 0.7);
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.2), transparent 30%),
    linear-gradient(180deg, #0b1220 0%, #101826 100%);

  .page-eyebrow {
    color: rgba(148, 163, 184, 0.86);
  }

  .page-title {
    color: rgba(255, 255, 255, 0.96);
  }

  .page-description,
  .section-description,
  .setting-help,
  .panel-description,
  .loading,
  .footer-meta {
    color: rgba(226, 232, 240, 0.8);
  }

  .settings-card,
  .setting-panel {
    background: rgba(15, 23, 42, 0.86);
    border-color: rgba(148, 163, 184, 0.3);
    box-shadow: 0 22px 44px rgba(0, 0, 0, 0.34);
  }

  .settings-card--footer {
    background: rgba(10, 15, 25, 0.9);
    border-color: rgba(148, 163, 184, 0.22);
  }

  .section-title,
  .setting-panel__title,
  .setting-label {
    color: rgba(255, 255, 255, 0.92);
  }

  .group-heading {
    color: rgba(191, 219, 254, 0.84);
  }

  .setting-row + .setting-row {
    border-color: rgba(148, 163, 184, 0.22);
  }

  .page-size-input,
  .shortcut-input,
  .btn {
    background: rgba(17, 24, 39, 0.94);
    color: rgba(255, 255, 255, 0.9);
    border-color: rgba(148, 163, 184, 0.34);
  }

  .btn--soft {
    background: rgba(23, 33, 51, 0.96);
  }

  .range-control__value {
    background: rgba(59, 130, 246, 0.18);
    color: #bfdbfe;
  }

  ::v-deep .range-control .el-slider__runway {
    background: rgba(71, 85, 105, 0.72);
  }

  ::v-deep .range-control .el-slider__bar {
    background: linear-gradient(90deg, rgba(96, 165, 250, 0.86), rgba(59, 130, 246, 0.94));
  }

  ::v-deep .range-control .el-slider__button {
    border-color: rgba(96, 165, 250, 0.92);
    background: #dbeafe;
  }

  .btn--primary-surface {
    background: linear-gradient(180deg, rgba(30, 64, 175, 0.44), rgba(37, 99, 235, 0.28));
    color: #dbeafe;
    border-color: rgba(96, 165, 250, 0.38);
  }

  .help-panel {
    background: rgba(37, 99, 235, 0.2);
    color: rgba(219, 234, 254, 0.96);
  }

  .help-panel--muted {
    background: rgba(71, 85, 105, 0.28);
    color: rgba(226, 232, 240, 0.86);
  }

  .group-heading--badge {
    color: rgba(191, 219, 254, 0.78);
  }

  .group-heading--badge::before {
    background: rgba(96, 165, 250, 0.88);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.14);
  }

  .choice-group--soft {
    border-color: rgba(96, 165, 250, 0.16);
    background: linear-gradient(180deg, rgba(24, 34, 52, 0.94), rgba(15, 23, 42, 0.92));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04),
      inset 0 0 0 1px rgba(15, 23, 42, 0.42);
  }

  .capture-badge {
    color: #bfdbfe;
    background: rgba(59, 130, 246, 0.22);
  }

  .primary {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.82), rgba(37, 99, 235, 0.92));
    border-color: rgba(59, 130, 246, 0.82);
  }

  .black {
    color: rgba(255, 255, 255, 0.86);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .githubText {
    color: rgba(255, 255, 255, 0.9);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .text-link {
    color: #bfdbfe;
  }

  .text-link--button {
    color: #bfdbfe;
  }

  ::v-deep .el-switch__label.is-active {
    color: rgba(96, 165, 250, 0.95);
  }

  ::v-deep .el-switch__label {
    color: rgba(226, 232, 240, 0.8);
  }

  ::v-deep .el-switch.is-checked .el-switch__core {
    border: 1px solid rgba(59, 130, 246, 0.8);
    background-color: rgba(59, 130, 246, 0.8);
  }

  ::v-deep .el-radio {
    color: rgba(226, 232, 240, 0.84);
  }

  .choice-group--badge-step2 :deep(.el-radio-group) {
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1.25fr) minmax(150px, 0.85fr);
  }

  .choice-group--badge-step1 :deep(.el-radio-group),
  .choice-group--badge-step3 :deep(.el-radio-group) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .setting-panel--utility-expanded {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(17, 24, 39, 0.86));
    border-color: rgba(96, 165, 250, 0.24);
  }

  .utility-panel-meta {
    border-color: rgba(96, 165, 250, 0.14);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.88), rgba(15, 23, 42, 0.84));
    color: rgba(226, 232, 240, 0.84);
  }

  .utility-panel-actions {
    border-color: rgba(96, 165, 250, 0.14);
    background: linear-gradient(180deg, rgba(24, 34, 52, 0.9), rgba(15, 23, 42, 0.88));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .utility-action {
    border-color: rgba(148, 163, 184, 0.18);
    background: linear-gradient(180deg, rgba(32, 44, 66, 0.92), rgba(19, 29, 47, 0.92));
    color: rgba(226, 232, 240, 0.94);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .utility-action:hover:not([disabled]) {
    border-color: rgba(96, 165, 250, 0.3);
    background: linear-gradient(180deg, rgba(42, 58, 86, 0.96), rgba(26, 38, 60, 0.96));
    box-shadow: 0 14px 24px rgba(2, 8, 23, 0.22);
  }

  .utility-action--primary {
    border-color: rgba(96, 165, 250, 0.34);
    background: linear-gradient(180deg, rgba(37, 66, 141, 0.96), rgba(29, 78, 216, 0.82));
    color: #eff6ff;
    box-shadow: inset 0 1px 0 rgba(191, 219, 254, 0.12), 0 18px 30px rgba(30, 64, 175, 0.22);
  }

  .utility-action--primary:hover:not([disabled]) {
    border-color: rgba(147, 197, 253, 0.46);
    background: linear-gradient(180deg, rgba(45, 78, 160, 0.98), rgba(37, 99, 235, 0.88));
    box-shadow: inset 0 1px 0 rgba(219, 234, 254, 0.14), 0 22px 34px rgba(30, 64, 175, 0.28);
  }

  ::v-deep .choice-group--soft .el-radio.is-bordered {
    border-color: rgba(148, 163, 184, 0.18);
    background: linear-gradient(180deg, rgba(51, 65, 85, 0.92), rgba(31, 41, 55, 0.92));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  ::v-deep .choice-group--soft .el-radio.is-bordered:hover {
    border-color: rgba(148, 163, 184, 0.28);
    background: linear-gradient(180deg, rgba(59, 73, 92, 0.94), rgba(35, 45, 61, 0.94));
  }

  ::v-deep .choice-group--soft .el-radio.is-bordered.is-checked {
    border-color: rgba(96, 165, 250, 0.34);
    background: linear-gradient(180deg, rgba(59, 130, 246, 0.24), rgba(37, 99, 235, 0.2));
    box-shadow: inset 0 1px 0 rgba(191, 219, 254, 0.1), 0 8px 18px rgba(15, 23, 42, 0.22);
  }

  ::v-deep .choice-group--soft .el-radio__label {
    color: rgba(226, 232, 240, 0.9);
  }

  ::v-deep .choice-group--soft .el-radio__input.is-checked + .el-radio__label {
    color: rgba(147, 197, 253, 0.96);
  }

  ::v-deep .choice-group--soft .el-radio__input.is-checked .el-radio__inner {
    background-color: rgba(59, 130, 246, 0.85);
    border: 1px solid rgba(59, 130, 246, 0.85);
  }
}

@media (max-width: 760px) {
  .container {
    min-width: 0;
    padding: 18px 12px 28px;
  }

  .options-shell {
    width: 100%;
  }

  .setting-grid,
  .footer-stack {
    grid-template-columns: 1fr;
  }

  .footer-support-row,
  .setting-row,
  .maintenance-row,
  .footer-meta-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .range-control {
    width: 100%;
    min-width: 0;
  }

  .shortcut-input-wrap,
  .shortcut-input,
  .page-size-controls,
  .maintenance-actions {
    width: 100%;
  }

  .shortcut-input {
    width: 100%;
  }

  .action-row {
    width: 100%;
  }

  .utility-panel-layout {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .utility-panel-actions {
    padding: 12px;
  }

  .utility-action-stack {
    width: 100%;
  }

  .utility-action-row {
    grid-template-columns: 1fr;
  }

  .utility-action--primary {
    min-height: 60px;
  }

  .footer-support-actions {
    justify-content: flex-start;
  }

  .choice-group--badge-step2 :deep(.el-radio-group) {
    grid-template-columns: 1fr;
  }

  .choice-group--badge-step1 :deep(.el-radio-group),
  .choice-group--badge-step3 :deep(.el-radio-group) {
    grid-template-columns: 1fr;
  }
}
</style>
