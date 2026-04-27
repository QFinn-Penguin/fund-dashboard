import {
  buildPopupPreferenceArtifacts,
  DEFAULT_POPUP_PAGE_SIZE,
} from "../common/popupPreferences";
import {
  buildInitFundStorageArtifacts,
  seedFundStorageConfig,
} from "../common/fundStorage";
import { DEFAULT_POSITION_OPERATION } from "../common/fundTransactions";
import {
  ensureLocalOnlyStorageMigrated,
  getExtensionStorage,
  persistExtensionStorage,
} from "../common/extensionStorage";
import { cloneGroupForMemory } from "../common/fundSnapshot";
import { FUND_TRANSACTIONS_STORAGE_KEY } from "./popup-app-shared";

export const shellMethods = {
  applyPopupAppearancePreferences(config = {}) {
    const popupPreferenceArtifacts = buildPopupPreferenceArtifacts(config);
    this.grayscaleValue = popupPreferenceArtifacts.grayscaleValue;
    this.opacityValue = popupPreferenceArtifacts.opacityValue;
    this.grayscale = popupPreferenceArtifacts.grayscaleStyle;
    this.opacity = popupPreferenceArtifacts.opacityStyle;
    return popupPreferenceArtifacts;
  },
  handlePopupPreferenceStorageChange(changes, areaName) {
    if (areaName !== "sync" || !changes) {
      return;
    }

    if (!changes.grayscaleValue && !changes.opacityValue) {
      return;
    }

    this.applyPopupAppearancePreferences({
      grayscaleValue: changes.grayscaleValue ? changes.grayscaleValue.newValue : this.grayscaleValue,
      opacityValue: changes.opacityValue ? changes.opacityValue.newValue : this.opacityValue,
    });
  },
  syncPopupRootSurface() {
    const isDark = !!this.darkMode;
    const rootBackground = isDark ? "#0f1217" : "#f5f7fb";
    [document.documentElement, document.body, document.getElementById("app")].forEach((node) => {
      if (!node || !node.style) {
        return;
      }
      if (node.classList) {
        node.classList.toggle("popup-root-dark", isDark);
        node.classList.toggle("popup-root-light", !isDark);
      }
      node.style.backgroundColor = rootBackground;
      node.style.border = "0";
      node.style.outline = "0";
      node.style.boxShadow = "none";
    });
  },
  changeGrayscaleValue(val) {
    this.grayscale =
      val > 0
        ? {
            filter: "grayscale(" + val / 100 + ")",
          }
        : {};
    chrome.storage.sync.set({
      grayscaleValue: this.grayscaleValue,
    });
  },
  changeOpacityValue(val) {
    this.opacity = {
      "--page-bg-alpha": (1 - val / 100).toFixed(2),
    };
    chrome.storage.sync.set({
      opacityValue: this.opacityValue,
    });
  },
  init() {
    const storageKeys = [
      "RealtimeFundcode",
      "RealtimeIndcode",
      "fundListGroup",
      FUND_TRANSACTIONS_STORAGE_KEY,
      "currentGroupIndex",
      "showAmount",
      "showGains",
      "seciList",
      "darkMode",
      "normalFontSize",
      "isLiveUpdate",
      "showCost",
      "showCostRate",
      "showPrevGszzl",
      "showGSZ",
      "version",
      "showBadge",
      "BadgeContent",
      "userId",
      "grayscaleValue",
      "opacityValue",
      "sortTypeObj",
      "groupNextShortcut",
      "pagePrevShortcut",
      "pageNextShortcut",
      "popupPageSize",
    ];

    ensureLocalOnlyStorageMigrated(() => {
      getExtensionStorage(storageKeys, (res) => {
        const popupPreferenceArtifacts = this.applyPopupAppearancePreferences(res);
        const defaultFunds = [
          {
            code: "001618",
            num: 0,
            positionOperation: DEFAULT_POSITION_OPERATION,
          },
        ];
        const { nextConfig: seededConfig, seedPayload } = seedFundStorageConfig(res, defaultFunds);

        if (seedPayload) {
          persistExtensionStorage(seedPayload);
        }

        const initFundStorageArtifacts = buildInitFundStorageArtifacts({
          config: seededConfig,
          transactionsMap: seededConfig[FUND_TRANSACTIONS_STORAGE_KEY] || {},
          cloneGroup: cloneGroupForMemory,
        });

        this.fundList = initFundStorageArtifacts.nextFundList;
        this.fundListGroup = initFundStorageArtifacts.nextFundListGroup;
        this.currentGroupIndex = initFundStorageArtifacts.nextCurrentGroupIndex;
        if (initFundStorageArtifacts.nextFundListM.length) {
          this.replaceCurrentGroupWorkingFunds(initFundStorageArtifacts.nextFundListM);
        } else {
          for (const fund of this.fundList) {
            let val = {
              code: fund,
              num: 0,
              positionOperation: DEFAULT_POSITION_OPERATION,
            };
            this.appendCurrentGroupWorkingFund(val);
          }
          this.persistFundStorage();
        }
        if (res.userId) {
          this.userId = res.userId;
        } else {
          this.userId = this.getGuid();
          chrome.storage.sync.set({
            userId: this.userId,
          });
        }
        this.darkMode = res.darkMode ? res.darkMode : false;
        this.normalFontSize = res.normalFontSize ? res.normalFontSize : false;
        this.seciList = res.seciList ? res.seciList : this.seciList;
        this.showAmount = popupPreferenceArtifacts.displayToggleState.showAmount;
        this.showGains = popupPreferenceArtifacts.displayToggleState.showGains;
        this.RealtimeFundcode = initFundStorageArtifacts.normalizedConfig.RealtimeFundcode;
        this.RealtimeIndcode = res.RealtimeIndcode;
        this.isLiveUpdate = res.isLiveUpdate ? res.isLiveUpdate : false;
        this.showCost = popupPreferenceArtifacts.displayToggleState.showCost;
        this.showCostRate = popupPreferenceArtifacts.displayToggleState.showCostRate;
        this.showPrevGszzl = popupPreferenceArtifacts.displayToggleState.showPrevGszzl;
        this.showGSZ = popupPreferenceArtifacts.displayToggleState.showGSZ;
        this.BadgeContent = res.BadgeContent ? res.BadgeContent : 1;
        this.showBadge = res.showBadge ? res.showBadge : 1;
        this.sortTypeObj = res.sortTypeObj ? res.sortTypeObj : {};
        this.groupNextShortcut = popupPreferenceArtifacts.shortcuts.groupNextShortcut;
        this.pagePrevShortcut = popupPreferenceArtifacts.shortcuts.pagePrevShortcut;
        this.pageNextShortcut = popupPreferenceArtifacts.shortcuts.pageNextShortcut;
        this.pageSize = popupPreferenceArtifacts.pageSize;

        if (this.seciList.length > 0) {
          this.loadingInd = true;
        }

        if (Object.keys(popupPreferenceArtifacts.missingDisplayToggles).length) {
          chrome.storage.sync.set(popupPreferenceArtifacts.missingDisplayToggles);
        }

        if (popupPreferenceArtifacts.shouldPersistDefaultPageSize) {
          chrome.storage.sync.set({
            popupPageSize: DEFAULT_POPUP_PAGE_SIZE,
          });
        }

        this.isGetStorage = true;
        this.$nextTick(() => {
          this.removeGroupViewportListeners();
          this.bindGroupViewportListeners();
        });
        this.getIndFundData();
        this.getData();
        this.checkInterval(true);

        let ver = res.version ? res.version : "1.0.0";
        if (ver != this.localVersion) {
          chrome.storage.sync.set({
            version: this.localVersion,
          });
        }
      });
    });
  },
  getGuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
  async market() {
    this.marketVisible = true;
    this.detailShadow = false;

    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await this.$nextTick();
      if (this.$refs.marketShadow && typeof this.$refs.marketShadow.init === "function") {
        this.$refs.marketShadow.init();
        return;
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 16);
      });
    }
  },
  checkInterval(isFirst) {
    clearInterval(this.myVar);
    clearInterval(this.myVar1);
    chrome.runtime.sendMessage({ type: "DuringDate" }, (response) => {
      this.isDuringDate = response.farewell;
      if (this.shouldPauseRealtimeRefresh) {
        return;
      }
      if (this.isLiveUpdate && this.isDuringDate) {
        if (!isFirst) {
          this.getIndFundData();
          this.getData(undefined, { silent: true });
        }
        this.myVar = setInterval(() => {
          this.getIndFundData();
        }, 5 * 1000);
        this.myVar1 = setInterval(() => {
          this.getData(undefined, { silent: true });
        }, 3 * 1000);
      } else {
        clearInterval(this.myVar);
        clearInterval(this.myVar1);
      }
    });
  },
  selectChange() {
    this.searchOptions = [];
  },
  option() {
    chrome.tabs.create({ url: "/options/options.html" });
  },
  reward() {
    this.rewardVisible = true;
    this.rewardShadow = true;
    this.$nextTick(() => {
      if (this.$refs.reward) {
        this.$refs.reward.init();
      }
    });
  },
  handleRewardClose() {
    this.rewardShadow = false;
    this.rewardVisible = false;
  },
  changelog() {
    this.changelogShadow = true;
    this.$refs.changelog.init();
  },
  closeChangelog() {
    this.changelogShadow = false;
    chrome.storage.sync.set({
      version: this.localVersion,
    });
  },
  toggleOverviewDayGain() {
    this.hideOverviewDayGain = !this.hideOverviewDayGain;
  },
};
