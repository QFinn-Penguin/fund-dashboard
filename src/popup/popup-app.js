const { version } = require("../../package.json");
import FundBoard from "./FundBoard";
import TransactionDialog from "./TransactionDialog";
import { requestWithBackground } from "../common/request";
import { FUND_TRANSACTIONS_STORAGE_KEY } from "../common/storageKeys";
import {
  DEFAULT_DISPLAY_TOGGLES,
  DEFAULT_POPUP_PAGE_SIZE,
  DEFAULT_POPUP_SHORTCUTS,
  normalizeShortcut,
} from "../common/popupPreferences";
import {
  createSwitchGroupState,
  deriveCurrentFundsFromConfig,
  deriveFundsFromGroup,
} from "../common/fundStorage";
import {
  DEFAULT_POSITION_OPERATION,
  buildTransactionId,
  createTransactionDraft,
  normalizeTransactionEntry,
  toFiniteNumber,
} from "../common/fundTransactions";
import { cloneFundForMemory } from "../common/fundSnapshot";
import { transactionComputed, transactionMethods } from "./popup-app-transactions";
import { fundStateMethods } from "./popup-app-fund-state";
import {
  sharedMethods,
} from "./popup-app-shared";
import { groupUiComputed, groupUiMethods, groupUiWatch } from "./popup-app-group-ui";
import { holdingsMethods } from "./popup-app-holdings";
import { fetchMethods } from "./popup-app-fetch";
import { listUiMethods } from "./popup-app-list-ui";
import { shellMethods } from "./popup-app-shell";

const reward = () => import(/* webpackChunkName: "popup-reward" */ "../common/reward");
const fundDetail = () => import(/* webpackChunkName: "popup-fund-detail" */ "../common/fundDetail");
const market = () => import(/* webpackChunkName: "popup-market" */ "../common/market");
const loadPopupIndDetail = () => import(/* webpackChunkName: "popup-ind-detail" */ "../common/indDetail");

export default {
  components: {
    reward,
    fundDetail,
    market,
    FundBoard,
    TransactionDialog,
  },
  data() {
    return {
      isEdit: false,
      fundcode: [],
      isAdd: false,
      indFundData: [],
      isLiveUpdate: false,
      isDuringDate: false,
      RealtimeFundcode: null,
      RealtimeIndcode: null,
      dataList: [],
      dataListDft: [],
      listError: "",
      myVar: null,
      myVar1: null,
      rewardShadow: false,
      detailKey: 0,
      fundDetailVisible: false,
      marketVisible: false,
      popupIndDetailVisible: false,
      popupIndDetailComponent: null,
      rewardVisible: false,
      checked: "wepay",
      showGains: DEFAULT_DISPLAY_TOGGLES.showGains,
      showAmount: DEFAULT_DISPLAY_TOGGLES.showAmount,
      showCost: DEFAULT_DISPLAY_TOGGLES.showCost,
      showCostRate: DEFAULT_DISPLAY_TOGGLES.showCostRate,
      showPrevGszzl: DEFAULT_DISPLAY_TOGGLES.showPrevGszzl,
      showGSZ: DEFAULT_DISPLAY_TOGGLES.showGSZ,
      fundList: ["001618"],
      fundListM: [],
      fundListGroup: [],
      currentGroupIndex: 0,
      sortType: {
        gszzl: "none",
        amount: "none",
        gains: "none",
        costGains: "none",
        costGainsRate: "none",
      },
      sortTypeObj: {
        name: null,
        value: null,
      },
      searchOptions: [],
      value: [],
      list: [],
      loading: false,
      dragging: null,
      showAddSeciInput: false,
      seciList: ["1.000001", "1.000300", "0.399001", "0.399006"],
      allSeciList: [
        {
          value: "1.000001",
          label: "上证指数",
        },
        {
          value: "1.000300",
          label: "沪深300",
        },
        {
          value: "0.399001",
          label: "深证成指",
        },
        {
          value: "1.000688",
          label: "科创50",
        },
        {
          value: "0.399006",
          label: "创业板指",
        },
        {
          value: "0.399005",
          label: "中小板指",
        },
        {
          value: "100.HSI",
          label: "恒生指数",
        },
        {
          value: "100.DJIA",
          label: "道琼斯",
        },
        {
          value: "100.NDX",
          label: "纳斯达克",
        },
        {
          value: "100.SPX",
          label: "标普500",
        },
      ],
      sltSeci: "",
      darkMode: false,
      normalFontSize: false,
      diyContainer: false,
      containerWidth: 790,
      containerHeight: 590,
      detailShadow: false,
      sltFund: {},
      isPopupShuttingDown: false,
      holdingsPrefetchTimer: null,
      holdingsHelperTabId: null,
      holdingsHelperTabReady: false,
      holdingsHelperTabOwned: false,
      holdingsHelperTabPending: null,
      holdingsHelperTabSessionId: 0,
      holdingsCacheByFundCode: {},
      holdingsInFlightByFundCode: {},
      holdingsActiveRequestCount: 0,
      activeHoldingsFundCode: "",
      sltFundHoldings: [],
      sltFundHoldingsQuotes: [],
      sltFundHoldingsBonds: [],
      sltFundHoldingsFofs: [],
      sltFundHoldingsExpansion: null,
      sltFundHoldingsLoading: false,
      sltFundHoldingsDebug: "idle",
      sltIndCode: "",
      localVersion: version,
      BadgeContent: 1,
      showBadge: 1,
      userId: null,
      loadingInd: false,
      loadingList: true,
      refreshingList: false,
      isGetStorage: false,
      zoom: {
        zoom: 1,
      },
      grayscale: {},
      grayscaleValue: 0,
      opacity: {},
      opacityValue: 0,
      popupPreferenceSyncListener: null,
      isRefresh: false,
      marketShadow: false,
      currentPage: 1,
      pageSize: DEFAULT_POPUP_PAGE_SIZE,
      hideOverviewDayGain: false,
      valuePulseMap: {},
      valuePulseTimers: {},
      latestFundFetchAt: 0,
      groupNextShortcut: DEFAULT_POPUP_SHORTCUTS.groupNextShortcut,
      pagePrevShortcut: DEFAULT_POPUP_SHORTCUTS.pagePrevShortcut,
      pageNextShortcut: DEFAULT_POPUP_SHORTCUTS.pageNextShortcut,
      groupViewportScrollLeft: 0,
      groupViewportMaxScrollLeft: 0,
      groupCursorVisible: false,
      groupCursorPreviewIndex: -1,
      groupCursorOffsetLeft: 0,
      groupCursorOffsetTop: 0,
      groupCursorWidth: 0,
      groupCursorHeight: 0,
      groupCursorFrame: null,
      transactionDialogVisible: false,
      activeTransactionFundCode: "",
      modalTransactionOperation: DEFAULT_POSITION_OPERATION,
      reduceSharePresetPreviewKey: "",
      modalTransactionDraft: createTransactionDraft(),
      modalTransactionMessage: "",
      modalTransactionMessageType: "success",
      positionTogglePreview: "",
    };
  },
  created() {},
  mounted() {
    setTimeout(() => {
      let aa = window.screen.width;
      let bb = this.$refs.app.clientWidth;
      if (aa < bb) {
        this.zoom = {
          zoom: aa / bb,
        };
      }
    }, 10);
    this.syncPopupRootSurface();
    this.init();
    this.holdingsPrefetchTimer = window.setTimeout(() => {
      this.holdingsPrefetchTimer = null;
      if (this.isPopupShuttingDown) {
        return;
      }
      this.prefetchVisibleFundHoldings();
    }, 1500);
    this.popupPreferenceSyncListener = (changes, areaName) => {
      this.handlePopupPreferenceStorageChange(changes, areaName);
    };
    chrome.storage.onChanged.addListener(this.popupPreferenceSyncListener);
    window.addEventListener("keydown", this.handlePopupKeydown);
    window.addEventListener("resize", this.handleGroupCursorViewportResize);
    window.addEventListener("pagehide", this.handlePopupShutdown);
    window.addEventListener("beforeunload", this.handlePopupShutdown);
    this.setPopupScrollLock(this.detailShadow);
    this.$nextTick(() => {
      this.bindGroupViewportListeners();
      this.queueGroupCursorSync();
    });
  },
  beforeDestroy() {
    this.handlePopupShutdown();
    if (this.popupPreferenceSyncListener) {
      chrome.storage.onChanged.removeListener(this.popupPreferenceSyncListener);
      this.popupPreferenceSyncListener = null;
    }
    window.removeEventListener("keydown", this.handlePopupKeydown);
    window.removeEventListener("resize", this.handleGroupCursorViewportResize);
    window.removeEventListener("pagehide", this.handlePopupShutdown);
    window.removeEventListener("beforeunload", this.handlePopupShutdown);
    clearInterval(this.myVar);
    clearInterval(this.myVar1);
    Object.values(this.valuePulseTimers || {}).forEach((timer) => {
      window.clearTimeout(timer);
    });
    this.valuePulseTimers = {};
    this.valuePulseMap = {};
    this.cancelGroupCursorSync();
    this.removeGroupViewportListeners();
    this.ensureHelperTabClosed(true);
    this.setPopupScrollLock(false);
  },
  computed: {
    currentGroup() {
      return this.getCurrentGroup();
    },
    currentGroupFocusFundCode() {
      return this.getCurrentGroupFocusFundCode();
    },
    allGains() {
      let allGains = 0;
      let allNum = 0;
      this.dataList.forEach((val) => {
        const gains = Number(val && val.gains);
        const amount = Number(val && val.amount);
        if (Number.isFinite(gains)) {
          allGains += gains;
        }
        if (Number.isFinite(amount)) {
          allNum += amount;
        }
      });
      allGains = allGains.toFixed(2);
      let allGainsRate = allNum > 0 ? ((allGains * 100) / allNum).toFixed(2) : "0.00";
      return [allGains, allGainsRate];
    },
    allCostGains() {
      let allCostGains = 0;
      let allNum = 0;
      this.dataList.forEach((val) => {
        const costGains = Number(val && val.costGains);
        const amount = Number(val && val.amount);
        if (Number.isFinite(costGains)) {
          allCostGains += costGains;
        }
        if (Number.isFinite(amount)) {
          allNum += amount;
        }
      });
      allCostGains = allCostGains.toFixed(2);
      const costBase = allNum - allCostGains;
      let allCostGainsRate = costBase > 0 ? ((allCostGains * 100) / costBase).toFixed(2) : "0.00";
      return [allCostGains, allCostGainsRate];
    },
    activeGroupLabel() {
      if (!this.currentGroup) {
        return "默认分组";
      }
      return this.getGroupLabel(this.currentGroup, this.currentGroupIndex);
    },
    overviewDayGainValue() {
      if (!this.showGains) {
        return "未开启";
      }
      if (this.hideOverviewDayGain) {
        return "****";
      }
      return this.formatMoneyDisplay(this.allGains[0]);
    },
    overviewDayGainMeta() {
      if (!this.showGains) {
        return "可在设置中开启当日估算收益";
      }
      return !isNaN(this.allGains[1]) ? `${this.allGains[1]}%` : "等待估值中";
    },
    overviewDayClass() {
      if (!this.showGains) {
        return "";
      }
      return Number(this.allGains[0]) >= 0 ? "overview-card--up" : "overview-card--down";
    },
    overviewCostGainValue() {
      if (!this.showCost) {
        return "未开启";
      }
      return this.formatMoneyDisplay(this.allCostGains[0]);
    },
    overviewCostGainMeta() {
      if (!this.showCost) {
        return "可在设置中开启持有收益";
      }
      return !isNaN(this.allCostGains[1]) ? `${this.allCostGains[1]}%` : "等待持仓数据";
    },
    overviewCostClass() {
      if (!this.showCost) {
        return "";
      }
      return Number(this.allCostGains[0]) >= 0 ? "overview-card--up" : "overview-card--down";
    },
    overviewStatusText() {
      if (this.loadingList) {
        return "加载中";
      }
      if (this.refreshingList) {
        return "刷新中";
      }
      if (this.listError) {
        return "加载异常";
      }
      if (!this.isDuringDate) {
        return "休市中";
      }
      return this.isLiveUpdate ? "实时更新" : "手动刷新";
    },
    overviewUpdateText() {
      if (this.loadingList) {
        return "正在同步基金数据";
      }
      if (this.refreshingList) {
        return "正在后台刷新基金数据";
      }
      if (this.listError) {
        return "点击刷新后重试";
      }
      if (this.latestFundFetchAt) {
        const latestFetchTime = new Date(this.latestFundFetchAt);
        return `同步于 ${latestFetchTime.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}`;
      }
      const latestItem = this.dataList.find((item) => item && item.gztime);
      if (!latestItem) {
        return "暂无更新时间";
      }
      return `更新于 ${this.formatDisplayTime(latestItem)}`;
    },
    overviewStatusClass() {
      if (this.loadingList || this.refreshingList || this.listError || !this.isDuringDate) {
        return "";
      }
      return this.isLiveUpdate ? "overview-card--up" : "";
    },
    containerInlineStyles() {
      return [this.zoom, this.grayscale, this.opacity];
    },
    containerClass() {
      let className = "";
      if (this.normalFontSize) {
        className += "normalFontSize ";
      }
      if (this.darkMode) {
        className += "darkMode ";
      }
      className += "more-width ";
      if (this.shouldLockBrowseHeight) {
        className += "browse-height-locked ";
      }
      return className;
    },
    userSeciList() {
      return this.allSeciList.filter((val) => {
        return this.seciList.indexOf(val.value) == -1;
      });
    },
    displayDataList() {
      if (this.isEdit) {
        return this.dataList;
      }
      return this.pagedDataList;
    },
    ...groupUiComputed,
    ...transactionComputed,
    tableHeight() {
      if (this.isEdit) {
        return "table-more-height";
      }
    },
    shouldPauseRealtimeRefresh() {
      return !!(
        this.isEdit ||
        this.detailShadow ||
        this.marketVisible ||
        this.rewardShadow ||
        this.transactionDialogVisible
      );
    },
    drag() {
      if (this.isEdit) {
        return "table-drag";
      } else {
        return "";
      }
    },
  },
  watch: {
    //编辑状态停止更新
    ...groupUiWatch,
    shouldPauseRealtimeRefresh(isPaused) {
      clearInterval(this.myVar);
      clearInterval(this.myVar1);
      if (isPaused) {
        return;
      }
      this.checkInterval();
    },
    detailShadow(isOpen) {
      this.setPopupScrollLock(isOpen);
    },
    darkMode() {
      this.syncPopupRootSurface();
    },
    "sltFund.fundcode": function() {},
  },
  methods: {
    ...shellMethods,
    ...sharedMethods,
    ...groupUiMethods,
    createSwitchGroupStateHandler(fundListGroup, index) {
      return createSwitchGroupState(fundListGroup, index, cloneFundForMemory);
    },
    ...fundStateMethods,
    ...holdingsMethods,
    ...fetchMethods,
    ...listUiMethods,
    requestByBackground(config) {
      return requestWithBackground(config);
    },
    persistTransactionsMap(transactionsMap, callback) {
      chrome.storage.local.set(
        {
          [FUND_TRANSACTIONS_STORAGE_KEY]: transactionsMap,
        },
        callback
      );
    },
    refresh() {
      this.init();
      this.isRefresh = true;
      setTimeout(() => {
        this.isRefresh = false;
      }, 1500);
    },
    async indDetail(val) {
      this.marketVisible = false;
      this.detailShadow = true;
      try {
        if (!this.popupIndDetailComponent) {
          const popupIndDetailModule = await loadPopupIndDetail();
          this.popupIndDetailComponent = popupIndDetailModule.default || popupIndDetailModule;
        }
        this.popupIndDetailVisible = true;
        this.$nextTick(() => {
          if (this.$refs.indDetail) {
            this.$refs.indDetail.init(val);
          }
        });
      } catch (error) {
        this.popupIndDetailVisible = false;
        this.detailShadow = false;
        throw error;
      }
    },
    ...transactionMethods,
  },
};
