import {
  buildPersistFundStorageArtifacts,
  getCurrentGroupFocusFundCodeFromState,
  getCurrentGroupFromState,
  getCurrentGroupFundCodesFromState,
  getCurrentGroupWorkingFundsFromState,
  mapCurrentGroupWorkingFundsState,
  setCurrentGroupWorkingFundsState,
  syncCurrentGroupFundsState,
  updateCurrentGroupWorkingFundState,
  appendCurrentGroupWorkingFundState,
  removeCurrentGroupWorkingFundState,
} from "../common/fundStorage";
import {
  buildTransactionsMapFromConfig,
  stripTransactionsFromConfig,
} from "../common/fundTransactions";
import {
  cloneFundForMemory,
  createSyncFundSnapshot,
  createSyncGroupSnapshot,
} from "../common/fundSnapshot";
import { persistExtensionStorage } from "../common/extensionStorage";

export const fundStateMethods = {
  getGroupLabel(group, index) {
    return group.name || group.groupName || group.label || `分组${index + 1}`;
  },
  getCurrentGroupWorkingFunds() {
    return getCurrentGroupWorkingFundsFromState(this.fundListM);
  },
  getCurrentGroup() {
    return getCurrentGroupFromState(this.fundListGroup, this.currentGroupIndex);
  },
  getCurrentGroupFocusFundCode() {
    return getCurrentGroupFocusFundCodeFromState(this.fundListGroup, this.currentGroupIndex);
  },
  getCurrentGroupFundCodes() {
    return getCurrentGroupFundCodesFromState(this.fundListM);
  },
  setCurrentGroupWorkingFunds(nextFunds = []) {
    this.fundListM = setCurrentGroupWorkingFundsState(nextFunds);
    return this.fundListM;
  },
  mapCurrentGroupWorkingFunds(mapper) {
    this.setCurrentGroupWorkingFunds(mapCurrentGroupWorkingFundsState(this.fundListM, mapper));
    return this.fundListM;
  },
  updateCurrentGroupWorkingFund(fundCode, updater) {
    this.setCurrentGroupWorkingFunds(
      updateCurrentGroupWorkingFundState(this.fundListM, fundCode, updater)
    );
  },
  appendCurrentGroupWorkingFund(fund) {
    this.setCurrentGroupWorkingFunds(appendCurrentGroupWorkingFundState(this.fundListM, fund));
  },
  removeCurrentGroupWorkingFund(fundCode) {
    this.setCurrentGroupWorkingFunds(removeCurrentGroupWorkingFundState(this.fundListM, fundCode));
  },
  replaceCurrentGroupWorkingFunds(nextFunds = []) {
    this.setCurrentGroupWorkingFunds(nextFunds);
  },
  syncCurrentGroupFunds() {
    this.fundListGroup = syncCurrentGroupFundsState(
      this.fundListGroup,
      this.currentGroupIndex,
      this.RealtimeFundcode,
      this.fundListM,
      cloneFundForMemory
    );
  },
  persistFundStorage(extra = {}, callback) {
    this.syncCurrentGroupFunds();

    const { mergedTransactionsMap, payloadWithoutTransactions } = buildPersistFundStorageArtifacts({
      currentFunds: this.getCurrentGroupWorkingFunds(),
      fundListGroup: this.fundListGroup,
      currentGroupIndex: this.currentGroupIndex,
      realtimeFundcode: this.RealtimeFundcode,
      extra,
      createSyncFundSnapshot,
      createSyncGroupSnapshot,
      buildTransactionsMapFromConfig,
      stripTransactionsFromConfig,
    });

    persistExtensionStorage(payloadWithoutTransactions, () => {
      this.persistTransactionsMap(mergedTransactionsMap, callback);
    });
  },
};
