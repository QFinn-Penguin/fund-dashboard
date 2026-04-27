export const FUND_TRANSACTIONS_STORAGE_KEY = "fundTransactionsByCode";
export const FUND_LIST_GROUP_STORAGE_KEY = "fundListGroup";

export const LOCAL_ONLY_STORAGE_KEYS = [
  FUND_TRANSACTIONS_STORAGE_KEY,
  FUND_LIST_GROUP_STORAGE_KEY,
];

export function isLocalOnlyStorageKey(key = "") {
  return LOCAL_ONLY_STORAGE_KEYS.includes(key);
}

export function splitConfigByStorageArea(config = {}) {
  const normalizedConfig = config && typeof config === "object" ? config : {};
  const syncPayload = {};
  const localPayload = {};

  Object.keys(normalizedConfig).forEach((key) => {
    if (isLocalOnlyStorageKey(key)) {
      localPayload[key] = normalizedConfig[key];
      return;
    }

    syncPayload[key] = normalizedConfig[key];
  });

  return {
    syncPayload,
    localPayload,
  };
}
