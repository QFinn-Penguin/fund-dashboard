import {
  DEFAULT_POSITION_OPERATION,
  buildTransactionId,
  createTransactionDraft,
  getTodayText,
  normalizePositionOperation,
  normalizeTransactionEntry,
  roundValue,
  toFiniteNumber,
} from "../common/fundTransactions";
import { normalizeFundEntry } from "../common/fundSnapshot";

export const transactionComputed = {
  activeTransactionFund() {
    return this.dataList.find((item) => item.fundcode == this.activeTransactionFundCode) || null;
  },
  reduceSharePresets() {
    return [
      { key: "quarter", label: "1/4", ratio: 0.25 },
      { key: "third", label: "1/3", ratio: 1 / 3 },
      { key: "half", label: "1/2", ratio: 0.5 },
      { key: "all", label: "全部", ratio: 1 },
    ];
  },
  activeReduceSharePresetKey() {
    if (this.modalTransactionOperation !== "reduce") {
      return "";
    }

    const fund = this.activeTransactionFund;
    const currentShares = toFiniteNumber(fund && fund.num, 0);
    const draftShares = toFiniteNumber(this.modalTransactionDraft.shares, 0);

    if (currentShares <= 0 || draftShares <= 0) {
      return "";
    }

    const matchedPreset = this.reduceSharePresets.find((preset) => {
      const presetShares = roundValue(currentShares * preset.ratio, 4);
      return Math.abs(presetShares - draftShares) < 0.0001;
    });

    return matchedPreset ? matchedPreset.key : "";
  },
  activeReduceSharePresetIndex() {
    if (!this.activeReduceSharePresetKey) {
      return -1;
    }

    return this.reduceSharePresets.findIndex((preset) => preset.key === this.activeReduceSharePresetKey);
  },
  visiblePositionToggleOperation() {
    const previewOperation = this.positionTogglePreview;
    if (previewOperation === "add" || previewOperation === "reduce") {
      return previewOperation;
    }

    return this.modalTransactionOperation === "reduce" ? "reduce" : "add";
  },
  visiblePositionToggleIndex() {
    return this.visiblePositionToggleOperation === "reduce" ? 1 : 0;
  },
  positionToggleStyle() {
    return {
      "--position-toggle-index": `${this.visiblePositionToggleIndex}`,
      "--position-toggle-count": "2",
    };
  },
  visibleReduceSharePresetKey() {
    const previewKey = this.reduceSharePresetPreviewKey;
    const hasPreviewKey = this.reduceSharePresets.some((preset) => preset.key === previewKey);
    if (hasPreviewKey) {
      return previewKey;
    }

    return this.activeReduceSharePresetKey;
  },
  visibleReduceSharePresetIndex() {
    if (!this.visibleReduceSharePresetKey) {
      return -1;
    }

    return this.reduceSharePresets.findIndex((preset) => preset.key === this.visibleReduceSharePresetKey);
  },
  presetCursorStyle() {
    if (this.visibleReduceSharePresetIndex < 0) {
      return {};
    }

    return {
      "--preset-cursor-index": `${this.visibleReduceSharePresetIndex}`,
      "--preset-cursor-count": `${this.reduceSharePresets.length || 1}`,
    };
  },
  activeTransactionList() {
    return this.visibleTransactions(this.activeTransactionFund);
  },
  modalTransactionValidation() {
    const fund = this.activeTransactionFund;
    if (!fund) {
      return {
        valid: false,
        message: "未找到当前基金数据，请关闭后重试。",
      };
    }

    const fee = toFiniteNumber(this.modalTransactionDraft.fee, 0);
    if (fee < 0) {
      return {
        valid: false,
        message: "手续费不能小于 0。",
      };
    }

    if (this.modalTransactionOperation === "add") {
      const amount = toFiniteNumber(this.modalTransactionDraft.amount, 0);
      if (amount <= 0) {
        return {
          valid: false,
          message: "请输入大于 0 的加仓金额。",
        };
      }
      const navBase = toFiniteNumber(fund.dwjz || fund.gsz, 0);
      if (navBase <= 0) {
        return {
          valid: false,
          message: "当前净值不可用，暂时无法计算加仓份额。",
        };
      }
      const estimatedShares = roundValue(Math.max(amount - fee, 0) / navBase, 4);
      if (estimatedShares <= 0) {
        return {
          valid: false,
          message: "金额扣除手续费后不足以形成有效份额。",
        };
      }
      return {
        valid: true,
        message: `预计新增 ${roundValue(estimatedShares, 2)} 份，保存后会自动并入现有持仓。`,
      };
    }

    const shares = toFiniteNumber(this.modalTransactionDraft.shares, 0);
    const currentShares = toFiniteNumber(fund.num, 0);
    if (shares <= 0) {
      return {
        valid: false,
        message: "请输入大于 0 的减仓份额。",
      };
    }
    if (shares > currentShares) {
      return {
        valid: false,
        message: `减仓份额不能超过当前持有的 ${roundValue(currentShares, 2)} 份。`,
      };
    }
    return {
      valid: true,
      message: `本次减仓 ${roundValue(shares, 2)} 份，剩余约 ${roundValue(currentShares - shares, 2)} 份。`,
    };
  },
};

export const transactionMethods = {
  openTransactionDialog(item) {
    this.activeTransactionFundCode = item.fundcode;
    this.modalTransactionOperation = normalizePositionOperation(item.positionOperation);
    this.positionTogglePreview = "";
    this.modalTransactionDraft = {
      ...createTransactionDraft(),
      ...(item.transactionDraft || {}),
    };
    this.modalTransactionMessage = "";
    this.modalTransactionMessageType = "success";
    this.transactionDialogVisible = true;
  },
  closeTransactionDialog() {
    this.transactionDialogVisible = false;
    this.activeTransactionFundCode = "";
    this.modalTransactionOperation = DEFAULT_POSITION_OPERATION;
    this.positionTogglePreview = "";
    this.reduceSharePresetPreviewKey = "";
    this.modalTransactionDraft = createTransactionDraft();
    this.modalTransactionMessage = "";
    this.modalTransactionMessageType = "success";
  },
  resetModalTransactionDraft() {
    this.reduceSharePresetPreviewKey = "";
    this.modalTransactionDraft = createTransactionDraft();
    this.modalTransactionMessage = "";
    this.modalTransactionMessageType = "success";
  },
  switchModalTransactionOperation(operation) {
    this.modalTransactionOperation = normalizePositionOperation(operation);
    this.positionTogglePreview = "";
    this.reduceSharePresetPreviewKey = "";
    this.modalTransactionMessage = "";
    this.modalTransactionMessageType = "success";
  },
  setPositionTogglePreview(operation) {
    if (operation !== "add" && operation !== "reduce") {
      return;
    }

    this.positionTogglePreview = operation;
  },
  clearPositionTogglePreview() {
    this.positionTogglePreview = "";
  },
  setReduceSharePresetPreview(presetKey) {
    this.reduceSharePresetPreviewKey = presetKey;
  },
  clearReduceSharePresetPreview() {
    this.reduceSharePresetPreviewKey = "";
  },
  applyReduceSharePreset(ratio) {
    const fund = this.activeTransactionFund;
    const normalizedRatio = Number(ratio);
    const currentShares = toFiniteNumber(fund && fund.num, 0);

    if (this.modalTransactionOperation !== "reduce") {
      this.modalTransactionOperation = "reduce";
    }

    if (!Number.isFinite(normalizedRatio) || normalizedRatio <= 0 || currentShares <= 0) {
      this.modalTransactionDraft = {
        ...this.modalTransactionDraft,
        shares: "",
      };
      return;
    }

    const calculatedShares = roundValue(currentShares * normalizedRatio, 4);
    this.modalTransactionDraft = {
      ...this.modalTransactionDraft,
      shares: `${calculatedShares}`,
    };
    this.modalTransactionMessage = "";
    this.modalTransactionMessageType = "success";
  },
  visibleTransactions(item) {
    return Array.isArray(item && item.transactions)
      ? item.transactions.filter((transaction) => transaction.type !== "baseline")
      : [];
  },
  formatTransactionSummary(transaction) {
    if (!transaction) {
      return "--";
    }

    const dateText = transaction.date || "未设日期";
    const feeText = `手续费 ${this.formatMoneyDisplay(transaction.fee)}`;

    if (transaction.type === "reduce") {
      return `${dateText} · 减仓 ${roundValue(transaction.shares, 2)} 份 · ${feeText}`;
    }

    return `${dateText} · 加仓 ${this.formatMoneyDisplay(transaction.amount)} · ${feeText}`;
  },
  recalculateFundMetrics(item) {
    item.amount = this.calculateMoney(item);
    item.gains = this.calculate(item, item.hasReplace);
    item.costGains = this.calculateCost(item);
    item.costGainsRate = this.calculateCostRate(item);
  },
  syncFundTransactionState(item, updater) {
    const nextFundListM = this.getCurrentGroupWorkingFunds().map((fund) => {
      if (fund.code != item.fundcode) {
        return fund;
      }

      const normalizedFund = normalizeFundEntry(fund);
      const nextFund = updater({
        ...normalizedFund,
        transactions: normalizedFund.transactions.map((transaction) => ({
          ...transaction,
        })),
      });
      return normalizeFundEntry(nextFund);
    });

    this.replaceCurrentGroupWorkingFunds(nextFundListM);
    const currentFund = nextFundListM.find((fund) => fund.code == item.fundcode);
    if (!currentFund) {
      return;
    }

    [this.dataList, this.dataListDft].forEach((list) => {
      const target = list.find((fund) => fund.fundcode == item.fundcode);
      if (!target) {
        return;
      }

      this.$set(target, "num", currentFund.num);
      this.$set(target, "cost", currentFund.cost);
      this.$set(target, "holdingCost", currentFund.holdingCost);
      this.$set(
        target,
        "transactions",
        currentFund.transactions.map((transaction) => ({
          ...transaction,
        }))
      );
      this.$set(target, "transactionDraft", createTransactionDraft());
      this.recalculateFundMetrics(target);
    });

    item.num = currentFund.num;
    item.cost = currentFund.cost;
    item.holdingCost = currentFund.holdingCost;
    item.transactions = currentFund.transactions.map((transaction) => ({
      ...transaction,
    }));
    item.transactionDraft = createTransactionDraft();
    this.recalculateFundMetrics(item);
    this.persistFundStorage({}, () => {
      this.invalidateHoldingsCache(item.fundcode);
      chrome.runtime.sendMessage({ type: "refresh" });
    });
  },
  appendTransaction(item) {
    const draft = item.transactionDraft || createTransactionDraft();
    const operation = normalizePositionOperation(item.positionOperation);
    const fee = roundValue(draft.fee, 2);

    if (fee < 0) {
      return {
        ok: false,
        message: "手续费不能小于 0。",
      };
    }

    if (operation === "add") {
      const amount = roundValue(draft.amount, 2);
      if (amount <= 0) {
        return {
          ok: false,
          message: "请输入有效的加仓金额。",
        };
      }
      const navBase = toFiniteNumber(item.dwjz || item.gsz, 0);
      if (navBase <= 0) {
        return {
          ok: false,
          message: "当前净值不可用，暂时无法保存加仓记录。",
        };
      }
      const shares = roundValue(Math.max(amount - fee, 0) / navBase, 4);
      if (shares <= 0) {
        return {
          ok: false,
          message: "金额扣除手续费后不足以形成有效份额。",
        };
      }

      this.syncFundTransactionState(item, (fund) => {
        fund.transactions.push(
          normalizeTransactionEntry({
            id: buildTransactionId("add"),
            type: "add",
            date: draft.date || getTodayText(),
            amount,
            fee,
            shares,
            nav: navBase,
          })
        );
        return fund;
      });
      return {
        ok: true,
        message: "加仓记录已保存。",
      };
    }

    const shares = roundValue(draft.shares, 4);
    if (shares <= 0) {
      return {
        ok: false,
        message: "请输入有效的减仓份额。",
      };
    }
    if (shares > toFiniteNumber(item.num, 0)) {
      return {
        ok: false,
        message: `减仓份额不能超过当前持有的 ${roundValue(item.num, 2)} 份。`,
      };
    }
    const navBase = toFiniteNumber(item.dwjz || item.gsz, 0);

    this.syncFundTransactionState(item, (fund) => {
      fund.transactions.push(
        normalizeTransactionEntry({
          id: buildTransactionId("reduce"),
          type: "reduce",
          date: draft.date || getTodayText(),
          shares,
          fee,
          nav: navBase,
          amount: roundValue(shares * navBase, 2),
        })
      );
      return fund;
    });
    return {
      ok: true,
      message: "减仓记录已保存。",
    };
  },
  saveModalTransaction() {
    const item = this.activeTransactionFund;
    if (!item) {
      return;
    }

    item.positionOperation = this.modalTransactionOperation;
    item.transactionDraft = {
      ...this.modalTransactionDraft,
    };
    this.changePositionOperation(item, this.modalTransactionOperation, {
      persist: false,
      invalidateCache: false,
    });
    const result = this.appendTransaction(item);
    this.modalTransactionMessage = result && result.message ? result.message : "保存失败，请检查输入。";
    this.modalTransactionMessageType = result && result.ok ? "success" : "error";
    if (result && result.ok) {
      this.modalTransactionDraft = createTransactionDraft();
    }
  },
  removeTransaction(item, transactionId) {
    this.syncFundTransactionState(item, (fund) => {
      fund.transactions = fund.transactions.filter((transaction) => {
        return transaction.id != transactionId;
      });
      return fund;
    });
  },
  removeModalTransaction(transactionId) {
    const item = this.activeTransactionFund;
    if (!item) {
      return;
    }
    this.removeTransaction(item, transactionId);
  },
};
