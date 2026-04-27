import { normalizeFundEntry, areFundsCollectionsEquivalent } from "./fundSnapshot";
import { mergeTransactionsIntoConfig, normalizePositionOperation } from "./fundTransactions";

export function stripRuntimeFundStorageFields(config = {}) {
  const normalizedConfig = {
    ...(config && typeof config === "object" ? config : {}),
  };

  delete normalizedConfig.fundListM;
  delete normalizedConfig.fundList;

  return normalizedConfig;
}

export function normalizeCurrentGroupIndex(currentGroupIndex, groups = []) {
  if (!Array.isArray(groups) || !groups.length) {
    return 0;
  }

  const normalizedIndex = Number.isInteger(currentGroupIndex)
    ? currentGroupIndex
    : Number.parseInt(currentGroupIndex, 10);

  if (!Number.isFinite(normalizedIndex)) {
    return 0;
  }

  return Math.min(Math.max(normalizedIndex, 0), groups.length - 1);
}

export function mapGroupFunds(group = {}, mapFund = (fund) => fund) {
  return Array.isArray(group && group.funds)
    ? group.funds.map((fund) => mapFund(fund))
    : [];
}

export function deriveCurrentFundsFromConfig(config = {}, mapFund = (fund) => fund) {
  if (Array.isArray(config.fundListGroup) && config.fundListGroup.length) {
    const currentGroupIndex = normalizeCurrentGroupIndex(
      config.currentGroupIndex,
      config.fundListGroup
    );
    const currentGroup = config.fundListGroup[currentGroupIndex];
    const derivedFunds = mapGroupFunds(currentGroup, mapFund).filter(Boolean);

    if (derivedFunds.length) {
      return derivedFunds;
    }
  }

  return Array.isArray(config.fundListM)
    ? config.fundListM.map((fund) => mapFund(fund)).filter(Boolean)
    : [];
}

export function deriveFundCodesFromConfig(config = {}, mapFund = (fund) => fund) {
  return deriveCurrentFundsFromConfig(config, mapFund)
    .map((fund) => {
      if (!fund) {
        return "";
      }
      return String(fund.code || fund.fundcode || "").trim();
    })
    .filter(Boolean);
}

export function deriveFundsFromGroup(group = {}) {
  return mapGroupFunds(group, (fund) => normalizeFundEntry(fund));
}

export function normalizeFundStorage(config = {}) {
  const normalizedConfig = {
    ...config,
  };
  let shouldPersist = false;

  const normalizeAndTrackFund = (fund) => {
    const normalizedFund = normalizeFundEntry(fund);
    const nextOperation = normalizePositionOperation(
      fund && (fund.positionOperation || fund.operation || fund.positionMode)
    );
    if (
      !fund ||
      fund.num == null ||
      fund.positionOperation !== nextOperation ||
      (fund.name || fund.shortName || fund.fundName || fund.code || "") !==
        (normalizedFund.name || "")
    ) {
      shouldPersist = true;
    }
    return normalizedFund;
  };

  if (Array.isArray(normalizedConfig.fundListM) && normalizedConfig.fundListM.length) {
    normalizedConfig.fundListM = normalizedConfig.fundListM.map((fund) => {
      return normalizeAndTrackFund(fund);
    });
  }

  if (Array.isArray(normalizedConfig.fundListGroup) && normalizedConfig.fundListGroup.length) {
    normalizedConfig.fundListGroup = normalizedConfig.fundListGroup.map((group) => {
      const normalizedFocusFundcode =
        typeof group.focusFundcode === "string" && group.focusFundcode.trim()
          ? group.focusFundcode.trim()
          : null;
      const normalizedFunds = Array.isArray(group.funds)
        ? group.funds.map((fund) => {
            if (typeof fund === "string") {
              shouldPersist = true;
              const matchedFund = Array.isArray(normalizedConfig.fundListM)
                ? normalizedConfig.fundListM.find((item) => item.code === fund)
                : null;
              return normalizeAndTrackFund(
                matchedFund || {
                  code: fund,
                  num: 0,
                }
              );
            }

            return normalizeAndTrackFund(fund);
          })
        : [];

      if (!Array.isArray(group.funds)) {
        shouldPersist = true;
      }

      if ((group.focusFundcode || null) !== normalizedFocusFundcode) {
        shouldPersist = true;
      }

      return {
        ...group,
        focusFundcode: normalizedFocusFundcode,
        funds: normalizedFunds,
      };
    });

    normalizedConfig.currentGroupIndex = normalizeCurrentGroupIndex(
      normalizedConfig.currentGroupIndex,
      normalizedConfig.fundListGroup
    );
  }

  if (
    (!normalizedConfig.fundListM || !normalizedConfig.fundListM.length) &&
    (!normalizedConfig.fundListGroup || !normalizedConfig.fundListGroup.length) &&
    normalizedConfig.fundList &&
    normalizedConfig.fundList.length
  ) {
    normalizedConfig.fundListM = normalizedConfig.fundList.map((code) =>
      normalizeFundEntry({
        code,
        num: 0,
      })
    );
    shouldPersist = true;
  }

  if (
    (!normalizedConfig.fundListGroup || !normalizedConfig.fundListGroup.length) &&
    normalizedConfig.fundListM &&
    normalizedConfig.fundListM.length
  ) {
    normalizedConfig.fundListGroup = [
      {
        name: "默认分组",
        focusFundcode:
          typeof normalizedConfig.RealtimeFundcode === "string" &&
          normalizedConfig.RealtimeFundcode.trim()
            ? normalizedConfig.RealtimeFundcode.trim()
            : null,
        funds: normalizedConfig.fundListM.map((fund) => ({
          ...normalizeFundEntry(fund),
        })),
      },
    ];
    normalizedConfig.currentGroupIndex = 0;
    shouldPersist = true;
  }

  if (
    (!normalizedConfig.fundListM || !normalizedConfig.fundListM.length) &&
    normalizedConfig.fundListGroup &&
    normalizedConfig.fundListGroup.length
  ) {
    const derivedFunds = deriveCurrentFundsFromConfig(normalizedConfig, (fund) =>
      normalizeFundEntry(fund)
    );
    if (derivedFunds.length) {
      normalizedConfig.fundListM = derivedFunds;
    }
  }

  if (
    (!normalizedConfig.fundList || !normalizedConfig.fundList.length) &&
    normalizedConfig.fundListM &&
    normalizedConfig.fundListM.length
  ) {
    normalizedConfig.fundList = normalizedConfig.fundListM.map((fund) => {
      return fund.code;
    });
  }

  if (normalizedConfig.fundListGroup && normalizedConfig.fundListGroup.length) {
    const currentGroupIndex = normalizeCurrentGroupIndex(
      normalizedConfig.currentGroupIndex,
      normalizedConfig.fundListGroup
    );
    const currentGroup = normalizedConfig.fundListGroup[currentGroupIndex];
    const legacyRealtimeFundcode =
      typeof normalizedConfig.RealtimeFundcode === "string" && normalizedConfig.RealtimeFundcode.trim()
        ? normalizedConfig.RealtimeFundcode.trim()
        : null;

    if (currentGroup) {
      if (!currentGroup.focusFundcode && legacyRealtimeFundcode) {
        currentGroup.focusFundcode = legacyRealtimeFundcode;
        shouldPersist = true;
      }

      normalizedConfig.RealtimeFundcode = currentGroup.focusFundcode || null;
    } else {
      normalizedConfig.RealtimeFundcode = legacyRealtimeFundcode;
    }

    const derivedFunds = currentGroup ? deriveFundsFromGroup(currentGroup) : [];
    if (!areFundsCollectionsEquivalent(normalizedConfig.fundListM, derivedFunds)) {
      normalizedConfig.fundListM = derivedFunds;
    }
  }

  return {
    normalizedConfig,
    shouldPersist,
  };
}

export function getCurrentGroupWorkingFundsFromState(fundListM = []) {
  return Array.isArray(fundListM) ? fundListM : [];
}

export function getCurrentGroupFromState(fundListGroup = [], currentGroupIndex = 0) {
  if (!Array.isArray(fundListGroup) || !fundListGroup.length) {
    return null;
  }
  return fundListGroup[currentGroupIndex] || null;
}

export function getCurrentGroupFocusFundCodeFromState(fundListGroup = [], currentGroupIndex = 0) {
  const currentGroup = getCurrentGroupFromState(fundListGroup, currentGroupIndex);
  return currentGroup ? currentGroup.focusFundcode || null : null;
}

export function getCurrentGroupFundCodesFromState(fundListM = []) {
  return getCurrentGroupWorkingFundsFromState(fundListM).map((fund) => fund.code);
}

export function setCurrentGroupWorkingFundsState(nextFunds = []) {
  return Array.isArray(nextFunds) ? nextFunds : [];
}

export function mapCurrentGroupWorkingFundsState(fundListM = [], mapper = (fund) => fund) {
  return getCurrentGroupWorkingFundsFromState(fundListM).map((fund, index) => {
    return mapper(fund, index);
  });
}

export function updateCurrentGroupWorkingFundState(fundListM = [], fundCode, updater = (fund) => fund) {
  return mapCurrentGroupWorkingFundsState(fundListM, (fund) => {
    if (fund.code != fundCode) {
      return fund;
    }
    return updater(fund);
  });
}

export function appendCurrentGroupWorkingFundState(fundListM = [], fund) {
  return [
    ...getCurrentGroupWorkingFundsFromState(fundListM),
    fund,
  ];
}

export function removeCurrentGroupWorkingFundState(fundListM = [], fundCode) {
  return getCurrentGroupWorkingFundsFromState(fundListM).filter((fund) => fund.code != fundCode);
}

export function syncCurrentGroupFundsState(
  fundListGroup = [],
  currentGroupIndex = 0,
  realtimeFundcode = null,
  currentFunds = [],
  cloneFund = (fund) => fund
) {
  const currentGroup = getCurrentGroupFromState(fundListGroup, currentGroupIndex);
  if (!currentGroup) {
    return Array.isArray(fundListGroup) ? fundListGroup : [];
  }

  return fundListGroup.map((group, index) => {
    if (index !== currentGroupIndex) {
      return group;
    }

    return {
      ...group,
      focusFundcode:
        index === currentGroupIndex ? realtimeFundcode || null : group.focusFundcode || null,
      funds: getCurrentGroupWorkingFundsFromState(currentFunds).map((fund) => cloneFund(fund)),
    };
  });
}

export function createSwitchGroupState(
  fundListGroup = [],
  nextGroupIndex = 0,
  cloneFund = (fund) => fund
) {
  const nextGroup = getCurrentGroupFromState(fundListGroup, nextGroupIndex);
  const nextFunds = Array.isArray(nextGroup && nextGroup.funds)
    ? nextGroup.funds.map((fund) => cloneFund(fund))
    : [];

  return {
    currentGroupIndex: nextGroupIndex,
    fundListM: nextFunds,
    RealtimeFundcode: getCurrentGroupFocusFundCodeFromState(fundListGroup, nextGroupIndex),
  };
}

export function buildPersistFundStorageArtifacts({
  currentFunds = [],
  fundListGroup = [],
  currentGroupIndex = 0,
  realtimeFundcode = null,
  extra = {},
  createSyncGroupSnapshot = (group) => group,
  buildTransactionsMapFromConfig = () => ({}),
  stripTransactionsFromConfig = (config) => config,
} = {}) {
  const normalizedExtra = stripRuntimeFundStorageFields({
    ...extra,
  });

  const transactionsMap = buildTransactionsMapFromConfig({
    fundListM: currentFunds,
    fundListGroup,
  });

  if (Array.isArray(normalizedExtra.fundListGroup)) {
    normalizedExtra.fundListGroup = normalizedExtra.fundListGroup.map((group) =>
      createSyncGroupSnapshot(group)
    );
  }

  const payload = {
    RealtimeFundcode: realtimeFundcode || null,
    ...normalizedExtra,
  };

  const transactionsFromExtra = buildTransactionsMapFromConfig(normalizedExtra);
  const mergedTransactionsMap = {
    ...transactionsMap,
    ...transactionsFromExtra,
  };

  if (Array.isArray(fundListGroup) && fundListGroup.length) {
    payload.fundListGroup = fundListGroup.map((group) => createSyncGroupSnapshot(group));
    payload.currentGroupIndex = currentGroupIndex;
  }

  return {
    payload,
    mergedTransactionsMap,
    payloadWithoutTransactions: stripTransactionsFromConfig(payload),
  };
}

export function seedFundStorageConfig(config = {}, defaultFunds = []) {
  const hasFundListGroup = Array.isArray(config.fundListGroup) && config.fundListGroup.length;
  const hasLegacyFundListM = Array.isArray(config.fundListM) && config.fundListM.length;
  const hasLegacyFundList = Array.isArray(config.fundList) && config.fundList.length;

  if (hasFundListGroup || hasLegacyFundListM || hasLegacyFundList) {
    return {
      nextConfig: {
        ...config,
      },
      seedPayload: null,
      seeded: false,
    };
  }

  const seededFunds = Array.isArray(defaultFunds)
    ? defaultFunds.map((fund) => ({
        ...fund,
      }))
    : [];
  const seedPayload = {
    fundListGroup: [
      {
        name: "默认分组",
        funds: seededFunds.map((fund) => ({
          ...fund,
        })),
      },
    ],
    currentGroupIndex: 0,
  };

  return {
    nextConfig: {
      ...config,
      ...seedPayload,
    },
    seedPayload,
    seeded: true,
  };
}

export function buildInitFundStorageArtifacts({
  config = {},
  transactionsMap = {},
  cloneGroup = (group) => group,
} = {}) {
  const mergedConfig = mergeTransactionsIntoConfig(config, transactionsMap);
  const {
    normalizedConfig,
    shouldPersist: shouldPersistFundStorage,
  } = normalizeFundStorage(mergedConfig);
  const nextFundListM = Array.isArray(normalizedConfig.fundListM)
    ? normalizedConfig.fundListM
    : [];
  const nextFundList = nextFundListM.map((fund) => fund.code);
  const nextFundListGroup = Array.isArray(normalizedConfig.fundListGroup)
    ? normalizedConfig.fundListGroup.map((group) => cloneGroup(group))
    : [];
  const nextCurrentGroupIndex = Number.isInteger(normalizedConfig.currentGroupIndex)
    ? normalizedConfig.currentGroupIndex
    : 0;

  return {
    mergedConfig,
    normalizedConfig,
    nextFundList,
    nextFundListGroup,
    nextCurrentGroupIndex,
    nextFundListM,
    shouldPersistFundStorage,
    shouldPersistNormalizedFundStorage: shouldPersistFundStorage,
    persistExtra: null,
  };
}

export function buildOptionsImportArtifacts(config = {}) {
  const { normalizedConfig } = normalizeFundStorage({
    ...config,
  });

  const currentFunds = deriveCurrentFundsFromConfig(normalizedConfig, (fund) => {
    return normalizeFundEntry({
      ...fund,
      code: fund && (fund.code || fund.fundcode),
    });
  });

  return {
    persistedConfig: stripRuntimeFundStorageFields(normalizedConfig),
    currentFunds,
    currentFundCodes: currentFunds.map((fund) => fund.code),
  };
}
