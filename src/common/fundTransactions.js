export const DEFAULT_POSITION_OPERATION = "add";

export function normalizePositionOperation(value) {
  return value === "reduce" ? "reduce" : DEFAULT_POSITION_OPERATION;
}

export function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function roundValue(value, digits = 4) {
  return Number(toFiniteNumber(value).toFixed(digits));
}

export function buildTransactionId(type = "tx") {
  return `${type}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function getTodayText() {
  return new Date().toISOString().slice(0, 10);
}

export function createTransactionDraft() {
  return {
    date: getTodayText(),
    amount: "",
    shares: "",
    fee: "",
  };
}

export function cloneTransactionsList(transactions = []) {
  return Array.isArray(transactions)
    ? transactions.map((transaction) => ({
        ...transaction,
      }))
    : undefined;
}

export function mergeTransactionsIntoFund(fund = {}, transactionsMap = {}) {
  const fundCode = String((fund && (fund.code || fund.fundcode)) || "").trim();
  if (!fundCode || !Array.isArray(transactionsMap[fundCode])) {
    return fund;
  }

  return {
    ...fund,
    transactions: cloneTransactionsList(transactionsMap[fundCode]),
  };
}

export function mergeTransactionsIntoConfig(config = {}, transactionsMap = {}) {
  const normalizedConfig = {
    ...config,
  };

  if (Array.isArray(normalizedConfig.fundListM)) {
    normalizedConfig.fundListM = normalizedConfig.fundListM.map((fund) => {
      return mergeTransactionsIntoFund(fund, transactionsMap);
    });
  }

  if (Array.isArray(normalizedConfig.fundListGroup)) {
    normalizedConfig.fundListGroup = normalizedConfig.fundListGroup.map((group) => ({
      ...group,
      funds: Array.isArray(group && group.funds)
        ? group.funds.map((fund) => mergeTransactionsIntoFund(fund, transactionsMap))
        : [],
    }));
  }

  return normalizedConfig;
}

export function buildTransactionsMapFromFunds(funds = [], seed = {}) {
  return (Array.isArray(funds) ? funds : []).reduce((result, fund) => {
    const fundCode = String((fund && (fund.code || fund.fundcode)) || "").trim();
    if (fundCode && Array.isArray(fund && fund.transactions)) {
      result[fundCode] = cloneTransactionsList(fund.transactions);
    }
    return result;
  }, {
    ...seed,
  });
}

export function buildTransactionsMapFromConfig(config = {}) {
  let transactionsMap = buildTransactionsMapFromFunds(config.fundListM);

  if (Array.isArray(config.fundListGroup)) {
    config.fundListGroup.forEach((group) => {
      transactionsMap = buildTransactionsMapFromFunds(group && group.funds, transactionsMap);
    });
  }

  return transactionsMap;
}

export function stripTransactionsFromFund(fund = {}) {
  if (!fund || typeof fund !== "object") {
    return fund;
  }

  const nextFund = {
    ...fund,
  };
  delete nextFund.transactions;
  return nextFund;
}

export function stripTransactionsFromConfig(config = {}) {
  const normalizedConfig = {
    ...config,
  };

  if (Array.isArray(normalizedConfig.fundListM)) {
    normalizedConfig.fundListM = normalizedConfig.fundListM.map((fund) => {
      return stripTransactionsFromFund(fund);
    });
  }

  if (Array.isArray(normalizedConfig.fundListGroup)) {
    normalizedConfig.fundListGroup = normalizedConfig.fundListGroup.map((group) => ({
      ...group,
      funds: Array.isArray(group && group.funds)
        ? group.funds.map((fund) => stripTransactionsFromFund(fund))
        : [],
    }));
  }

  return normalizedConfig;
}

export function createBaselineTransaction(fund = {}) {
  const shares = roundValue(fund.num, 4);
  const unitCost = roundValue(fund.cost, 4);
  return {
    id: buildTransactionId("baseline"),
    type: "baseline",
    date: "",
    amount: roundValue(shares * unitCost, 2),
    shares,
    fee: 0,
    nav: unitCost,
    unitCost,
  };
}

export function normalizeTransactionEntry(transaction = {}, index = 0, fund = {}) {
  const type =
    transaction.type === "baseline" || transaction.type === "reduce"
      ? transaction.type
      : "add";
  const date = typeof transaction.date === "string" ? transaction.date : "";

  if (type === "baseline") {
    const shares = roundValue(
      transaction.shares != null ? transaction.shares : fund.num,
      4
    );
    const unitCost = roundValue(
      transaction.unitCost != null ? transaction.unitCost : fund.cost,
      4
    );
    return {
      ...transaction,
      id: transaction.id || `baseline-${fund.code || index}`,
      type,
      date,
      shares,
      unitCost,
      fee: 0,
      nav: unitCost,
      amount: roundValue(shares * unitCost, 2),
    };
  }

  const shares = roundValue(transaction.shares, 4);
  const fee = roundValue(transaction.fee, 2);
  const nav = roundValue(transaction.nav, 4);
  const amount =
    type === "reduce"
      ? roundValue(
          transaction.amount != null ? transaction.amount : shares * nav,
          2
        )
      : roundValue(transaction.amount, 2);

  return {
    ...transaction,
    id: transaction.id || buildTransactionId(type),
    type,
    date,
    amount,
    shares,
    fee,
    nav,
  };
}

export function normalizeFundTransactions(fund = {}) {
  const rawTransactions = Array.isArray(fund.transactions) ? fund.transactions : [];
  const normalizedTransactions = rawTransactions.map((transaction, index) => {
    return normalizeTransactionEntry(transaction, index, fund);
  });

  const baseline =
    normalizedTransactions.find((transaction) => transaction.type === "baseline") ||
    createBaselineTransaction(fund);

  const eventTransactions = normalizedTransactions
    .filter((transaction) => transaction.type !== "baseline")
    .filter((transaction) => transaction.type === "add" || transaction.type === "reduce");

  return [baseline, ...eventTransactions];
}

export function syncBaselineTransaction(fund = {}, shares, cost) {
  const normalizedShares = roundValue(shares, 4);
  const normalizedCost = roundValue(cost, 4);
  const baseTransaction = {
    ...createBaselineTransaction({
      ...fund,
      num: normalizedShares,
      cost: normalizedCost,
    }),
  };

  if (!Array.isArray(fund.transactions) || !fund.transactions.length) {
    return [baseTransaction];
  }

  let hasBaseline = false;
  const nextTransactions = fund.transactions.map((transaction) => {
    if (transaction && transaction.type === "baseline") {
      hasBaseline = true;
      return {
        ...transaction,
        shares: baseTransaction.shares,
        unitCost: baseTransaction.unitCost,
        nav: baseTransaction.nav,
        amount: baseTransaction.amount,
        fee: 0,
      };
    }
    return {
      ...transaction,
    };
  });

  if (!hasBaseline) {
    nextTransactions.unshift(baseTransaction);
  }

  return nextTransactions;
}

export function derivePositionSnapshot(transactions = []) {
  let shares = 0;
  let costBasis = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "baseline") {
      shares = roundValue(transaction.shares, 4);
      costBasis = roundValue(transaction.shares * transaction.unitCost, 2);
      return;
    }

    if (transaction.type === "add") {
      shares = roundValue(shares + transaction.shares, 4);
      costBasis = roundValue(costBasis + transaction.amount + transaction.fee, 2);
      return;
    }

    if (transaction.type === "reduce") {
      const nextReduceShares = Math.min(transaction.shares, shares);
      const averageCost = shares > 0 ? costBasis / shares : 0;
      shares = roundValue(shares - nextReduceShares, 4);
      costBasis = roundValue(
        Math.max(costBasis - averageCost * nextReduceShares, 0),
        2
      );
    }
  });

  return {
    shares,
    costBasis,
    averageCost: shares > 0 ? roundValue(costBasis / shares, 4) : 0,
  };
}
