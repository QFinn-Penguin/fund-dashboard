import {
  cloneTransactionsList,
  derivePositionSnapshot,
  normalizeFundTransactions,
  normalizePositionOperation,
  roundValue,
} from "./fundTransactions";

export function normalizeFundEntry(fund = {}) {
  const transactions = normalizeFundTransactions(fund);
  const snapshot = derivePositionSnapshot(transactions);
  return {
    ...fund,
    code: fund.code,
    name: fund.name || fund.shortName || fund.fundName || fund.code,
    num: snapshot.shares,
    cost: snapshot.averageCost || undefined,
    holdingCost: snapshot.costBasis,
    transactions,
    positionOperation: normalizePositionOperation(
      fund.positionOperation || fund.operation || fund.positionMode
    ),
  };
}

export function createSyncFundSnapshot(fund = {}) {
  const normalizedFund = normalizeFundEntry({
    ...fund,
    code: fund.code || fund.fundcode,
  });
  const directShares = roundValue(normalizedFund.num, 4);
  const directCost = roundValue(normalizedFund.cost, 4);
  const directHoldingCost = roundValue(normalizedFund.holdingCost, 2);
  return {
    code: normalizedFund.code,
    name:
      normalizedFund.name || fund.name || fund.shortName || fund.fundName || normalizedFund.code,
    num: directShares,
    cost: directCost || undefined,
    holdingCost: directHoldingCost,
    positionOperation: normalizePositionOperation(
      normalizedFund.positionOperation || fund.positionOperation || fund.operation || fund.positionMode
    ),
  };
}

export function createSyncGroupSnapshot(group = {}) {
  return {
    ...group,
    focusFundcode: group.focusFundcode || null,
    funds: Array.isArray(group.funds)
      ? group.funds
          .map((fund) => {
            if (typeof fund === "string") {
              return createSyncFundSnapshot({ code: fund, num: 0 });
            }
            if (!fund) {
              return null;
            }
            return createSyncFundSnapshot({
              ...fund,
              code: fund.code || fund.fundcode,
            });
          })
          .filter(Boolean)
      : [],
  };
}

export function cloneFundForMemory(fund = {}) {
  const normalizedFund = normalizeFundEntry(fund);
  const shares = roundValue(
    fund.num != null ? fund.num : normalizedFund.num,
    4
  );
  const cost = roundValue(
    fund.cost != null ? fund.cost : normalizedFund.cost,
    4
  );
  const holdingCost = roundValue(
    fund.holdingCost != null ? fund.holdingCost : shares * cost,
    2
  );

  return {
    ...normalizedFund,
    num: shares,
    cost: cost || undefined,
    holdingCost,
    transactions: Array.isArray(fund.transactions)
      ? fund.transactions.map((transaction) => ({
          ...transaction,
        }))
      : normalizedFund.transactions.map((transaction) => ({
          ...transaction,
        })),
  };
}

export function cloneGroupForMemory(group = {}) {
  return {
    ...group,
    funds: Array.isArray(group.funds)
      ? group.funds.map((fund) => cloneFundForMemory(fund))
      : [],
  };
}

export function buildFundComparisonSignature(fund = {}) {
  const normalizedFund = normalizeFundEntry(fund);
  return JSON.stringify({
    code: normalizedFund.code,
    name: normalizedFund.name,
    num: normalizedFund.num,
    cost: normalizedFund.cost,
    holdingCost: normalizedFund.holdingCost,
    positionOperation: normalizedFund.positionOperation,
    transactions: cloneTransactionsList(normalizedFund.transactions) || [],
  });
}

export function areFundsCollectionsEquivalent(left = [], right = []) {
  const leftFunds = Array.isArray(left) ? left : [];
  const rightFunds = Array.isArray(right) ? right : [];

  if (leftFunds.length !== rightFunds.length) {
    return false;
  }

  return leftFunds.every((fund, index) => {
    return buildFundComparisonSignature(fund) === buildFundComparisonSignature(rightFunds[index]);
  });
}
