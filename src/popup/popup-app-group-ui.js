import { isShortcutMatch } from "../common/popupPreferences";

export const GROUP_UI_LOCK_ROW_THRESHOLD = 15;

export const groupUiComputed = {
  displayDataList() {
    if (this.isEdit) {
      return this.dataList;
    }
    return this.pagedDataList;
  },
  browseOrderedDataList() {
    if (this.isEdit || !this.RealtimeFundcode) {
      return this.dataList;
    }

    const focusedList = [];
    const normalList = [];

    this.dataList.forEach((item) => {
      if (item && item.fundcode == this.RealtimeFundcode) {
        focusedList.push(item);
      } else {
        normalList.push(item);
      }
    });

    return focusedList.concat(normalList);
  },
  pagedDataList() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.browseOrderedDataList.slice(start, start + this.pageSize);
  },
  visibleBrowseRowCount() {
    return Array.isArray(this.displayDataList) ? this.displayDataList.length : 0;
  },
  pageCount() {
    return Math.max(1, Math.ceil(this.dataList.length / this.pageSize));
  },
  showPagination() {
    return !this.isEdit && this.dataList.length > this.pageSize;
  },
  shouldLockBrowseHeight() {
    return (
      !this.isEdit &&
      !this.detailShadow &&
      this.visibleBrowseRowCount >= GROUP_UI_LOCK_ROW_THRESHOLD
    );
  },
  canSlideGroupWindow() {
    return this.fundListGroup.length > 1;
  },
  groupViewportState() {
    if (!this.isGetStorage || !this.canSlideGroupWindow) {
      return {
        canScrollLeft: false,
        canScrollRight: false,
      };
    }

    const threshold = 4;

    return {
      canScrollLeft: this.groupViewportScrollLeft > threshold,
      canScrollRight: this.groupViewportScrollLeft < this.groupViewportMaxScrollLeft - threshold,
    };
  },
  canScrollGroupViewportLeft() {
    return this.groupViewportState.canScrollLeft;
  },
  canScrollGroupViewportRight() {
    return this.groupViewportState.canScrollRight;
  },
  visibleGroupCursorIndex() {
    const previewIndex = Number(this.groupCursorPreviewIndex);
    if (
      Number.isInteger(previewIndex) &&
      previewIndex >= 0 &&
      previewIndex < this.fundListGroup.length
    ) {
      return previewIndex;
    }

    return this.currentGroupIndex;
  },
  groupCursorStyle() {
    if (!this.groupCursorVisible) {
      return {};
    }

    return {
      "--group-cursor-left": `${this.groupCursorOffsetLeft}px`,
      "--group-cursor-top": `${this.groupCursorOffsetTop}px`,
      "--group-cursor-width": `${this.groupCursorWidth}px`,
      "--group-cursor-height": `${this.groupCursorHeight}px`,
    };
  },
};

export const groupUiWatch = {
  isEdit() {
    this.groupCursorPreviewIndex = -1;
    if (this.isEdit) {
      this.dataList = [...this.dataListDft];
      for (const key in this.sortType) {
        if (this.sortType.hasOwnProperty(key)) {
          this.sortType[key] = "none";
        }
      }
    }
    this.resetPagination();
    this.$nextTick(() => {
      this.queueGroupCursorSync();
      this.syncGroupViewportState();
    });
  },
  dataList: {
    handler() {
      this.ensurePageInRange();
    },
    deep: false,
  },
  currentGroupIndex() {
    this.$nextTick(() => {
      this.scrollActiveGroupIntoView();
      this.syncGroupViewportState();
      this.queueGroupCursorSync();
    });
  },
  currentPage() {
    this.$nextTick(() => {
      this.prefetchVisibleFundHoldings();
    });
  },
  fundListGroup() {
    this.groupCursorPreviewIndex = -1;
    this.$nextTick(() => {
      this.removeGroupViewportListeners();
      this.bindGroupViewportListeners();
      this.queueGroupCursorSync();
    });
  },
};

export const groupUiMethods = {
  handleGroupCursorViewportResize() {
    this.queueGroupCursorSync();
    this.syncGroupViewportState();
  },
  getGroupButtonElement(index = this.currentGroupIndex) {
    const refs = this.$refs[`groupBtn-${index}`];
    return Array.isArray(refs) ? refs[0] : refs;
  },
  resetGroupCursor() {
    this.groupCursorVisible = false;
    this.groupCursorOffsetLeft = 0;
    this.groupCursorOffsetTop = 0;
    this.groupCursorWidth = 0;
    this.groupCursorHeight = 0;
  },
  cancelGroupCursorSync() {
    if (this.groupCursorFrame !== null) {
      window.cancelAnimationFrame(this.groupCursorFrame);
      this.groupCursorFrame = null;
    }
  },
  setGroupCursorPreview(index) {
    const nextIndex = Number(index);
    if (
      !Number.isInteger(nextIndex) ||
      nextIndex < 0 ||
      nextIndex >= this.fundListGroup.length ||
      this.groupCursorPreviewIndex === nextIndex
    ) {
      return;
    }

    this.groupCursorPreviewIndex = nextIndex;
    this.queueGroupCursorSync();
  },
  clearGroupCursorPreview() {
    if (this.groupCursorPreviewIndex < 0) {
      return;
    }

    this.groupCursorPreviewIndex = -1;
    this.queueGroupCursorSync();
  },
  queueGroupCursorSync() {
    this.cancelGroupCursorSync();
    this.groupCursorFrame = window.requestAnimationFrame(() => {
      this.groupCursorFrame = null;
      this.syncGroupCursorToButton(this.visibleGroupCursorIndex);
    });
  },
  syncGroupCursorToButton(index = this.currentGroupIndex) {
    const strip = this.$refs.groupStrip;
    const activeButton = this.getGroupButtonElement(index);
    if (!strip || !activeButton) {
      this.resetGroupCursor();
      return;
    }

    const nextWidth = activeButton.offsetWidth;
    const nextHeight = activeButton.offsetHeight;
    if (!nextWidth || !nextHeight) {
      this.resetGroupCursor();
      return;
    }

    this.groupCursorVisible = true;
    this.groupCursorOffsetLeft = activeButton.offsetLeft;
    this.groupCursorOffsetTop = activeButton.offsetTop;
    this.groupCursorWidth = nextWidth;
    this.groupCursorHeight = nextHeight;
  },
  syncGroupCursorToActiveButton() {
    this.syncGroupCursorToButton(this.currentGroupIndex);
  },
  syncGroupViewportState() {
    const viewport = this.$refs.groupStripViewport;
    if (!viewport) {
      this.groupViewportScrollLeft = 0;
      this.groupViewportMaxScrollLeft = 0;
      return;
    }

    this.groupViewportScrollLeft = viewport.scrollLeft;
    this.groupViewportMaxScrollLeft = Math.max(viewport.scrollWidth - viewport.clientWidth, 0);
  },
  bindGroupViewportListeners() {
    const viewport = this.$refs.groupStripViewport;
    if (!viewport || viewport.__fundsBoundScrollListener) {
      this.syncGroupViewportState();
      return;
    }

    const onScroll = () => {
      this.syncGroupViewportState();
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    viewport.__fundsBoundScrollListener = onScroll;
    this.syncGroupViewportState();
  },
  removeGroupViewportListeners() {
    const viewport = this.$refs.groupStripViewport;
    if (!viewport || !viewport.__fundsBoundScrollListener) {
      return;
    }

    viewport.removeEventListener("scroll", viewport.__fundsBoundScrollListener);
    delete viewport.__fundsBoundScrollListener;
  },
  switchGroup(index) {
    if (index === this.currentGroupIndex || !this.fundListGroup[index]) {
      return;
    }

    this.syncCurrentGroupFunds();
    const nextState = this.createSwitchGroupStateHandler(this.fundListGroup, index);
    this.currentGroupIndex = nextState.currentGroupIndex;
    this.resetPagination();
    this.replaceCurrentGroupWorkingFunds(nextState.fundListM);
    this.RealtimeFundcode = nextState.RealtimeFundcode;
    this.loadingList = true;
    this.persistFundStorage({}, () => {
      this.getData();
    });
  },
  cycleGroup(step) {
    if (!Array.isArray(this.fundListGroup) || this.fundListGroup.length < 2) {
      return;
    }

    const total = this.fundListGroup.length;
    const nextIndex = (this.currentGroupIndex + step + total) % total;

    this.switchGroup(nextIndex);
  },
  scrollGroupViewport(step) {
    const viewport = this.$refs.groupStripViewport;
    if (!viewport) {
      return;
    }

    this.syncGroupViewportState();

    const direction = step >= 0 ? 1 : -1;
    const buttonRefs = Object.keys(this.$refs)
      .filter((key) => key.indexOf("groupBtn-") === 0)
      .sort((a, b) => {
        const leftIndex = Number(a.replace("groupBtn-", ""));
        const rightIndex = Number(b.replace("groupBtn-", ""));
        return leftIndex - rightIndex;
      })
      .map((key) => {
        const ref = this.$refs[key];
        return Array.isArray(ref) ? ref[0] : ref;
      })
      .filter(Boolean);

    if (!buttonRefs.length) {
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const threshold = 4;
    const target =
      direction > 0
        ? buttonRefs.find((button) => button.getBoundingClientRect().right > viewportRect.right + threshold)
        : [...buttonRefs]
            .reverse()
            .find((button) => button.getBoundingClientRect().left < viewportRect.left - threshold);

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: direction > 0 ? "end" : "start",
    });

    window.requestAnimationFrame(() => {
      this.syncGroupViewportState();
    });
  },
  scrollActiveGroupIntoView() {
    const activeButton = this.getGroupButtonElement();
    if (!activeButton || typeof activeButton.scrollIntoView !== "function") {
      return;
    }

    activeButton.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  },
  handlePopupKeydown(event) {
    const target = event.target;
    const tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
    if (tagName === "input" || tagName === "textarea" || (target && target.isContentEditable)) {
      return;
    }

    if (event.key === "Escape" && (this.detailShadow || this.marketVisible)) {
      event.preventDefault();
      this.closeCharts();
      return;
    }

    if (isShortcutMatch(event, this.groupNextShortcut)) {
      event.preventDefault();
      this.cycleGroup(1);
      return;
    }

    if (isShortcutMatch(event, this.pagePrevShortcut)) {
      event.preventDefault();
      this.changePage(this.currentPage - 1);
      return;
    }

    if (isShortcutMatch(event, this.pageNextShortcut)) {
      event.preventDefault();
      this.changePage(this.currentPage + 1);
    }
  },
  changePage(page) {
    const nextPage = Number(page);
    if (!Number.isFinite(nextPage)) {
      return;
    }
    this.currentPage = Math.min(Math.max(nextPage, 1), this.pageCount);
  },
  resetPagination() {
    this.currentPage = 1;
  },
  ensurePageInRange() {
    if (this.currentPage > this.pageCount) {
      this.currentPage = this.pageCount;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  },
};
