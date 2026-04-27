import { LOCAL_ONLY_STORAGE_KEYS, splitConfigByStorageArea } from "./storageKeys";

function getLocalOnlyKeys(keys) {
  if (!Array.isArray(keys)) {
    return [...LOCAL_ONLY_STORAGE_KEYS];
  }

  return keys.filter((key) => LOCAL_ONLY_STORAGE_KEYS.includes(key));
}

function getSyncKeys(keys) {
  if (!Array.isArray(keys)) {
    return null;
  }

  return keys.filter((key) => !LOCAL_ONLY_STORAGE_KEYS.includes(key));
}

function runCallback(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

export function getExtensionStorage(keys = null, callback = () => {}) {
  const localKeys = getLocalOnlyKeys(keys);
  const syncKeys = getSyncKeys(keys);

  const handleLocalResult = (syncResult = {}) => {
    if (!localKeys.length) {
      runCallback(callback, syncResult);
      return;
    }

    chrome.storage.local.get(localKeys, (localResult) => {
      runCallback(callback, {
        ...syncResult,
        ...localResult,
      });
    });
  };

  if (syncKeys && !syncKeys.length) {
    handleLocalResult({});
    return;
  }

  chrome.storage.sync.get(syncKeys, (syncResult) => {
    handleLocalResult(syncResult || {});
  });
}

export function ensureLocalOnlyStorageMigrated(callback = () => {}) {
  chrome.storage.local.get(LOCAL_ONLY_STORAGE_KEYS, (localResult) => {
    const missingKeys = LOCAL_ONLY_STORAGE_KEYS.filter(
      (key) => typeof localResult[key] === "undefined"
    );

    if (!missingKeys.length) {
      runCallback(callback, localResult || {});
      return;
    }

    chrome.storage.sync.get(missingKeys, (syncResult) => {
      const migrationPayload = missingKeys.reduce((result, key) => {
        if (typeof syncResult[key] !== "undefined") {
          result[key] = syncResult[key];
        }
        return result;
      }, {});

      if (!Object.keys(migrationPayload).length) {
        runCallback(callback, {
          ...(localResult || {}),
        });
        return;
      }

      chrome.storage.local.set(migrationPayload, () => {
        chrome.storage.sync.remove(Object.keys(migrationPayload), () => {
          runCallback(callback, {
            ...(localResult || {}),
            ...migrationPayload,
          });
        });
      });
    });
  });
}

export function removeExtensionStorageKeys(keys = [], callback = () => {}) {
  const normalizedKeys = Array.isArray(keys) ? keys.filter(Boolean) : [];
  if (!normalizedKeys.length) {
    runCallback(callback);
    return;
  }

  const localKeys = normalizedKeys.filter((key) => LOCAL_ONLY_STORAGE_KEYS.includes(key));
  const syncKeys = normalizedKeys.filter((key) => !LOCAL_ONLY_STORAGE_KEYS.includes(key));

  const removeLocalKeys = () => {
    if (!localKeys.length) {
      runCallback(callback);
      return;
    }

    chrome.storage.local.remove(localKeys, () => {
      runCallback(callback);
    });
  };

  if (!syncKeys.length) {
    removeLocalKeys();
    return;
  }

  chrome.storage.sync.remove(syncKeys, () => {
    removeLocalKeys();
  });
}

export function persistExtensionStorage(config = {}, onPersisted = () => {}) {
  const { syncPayload, localPayload } = splitConfigByStorageArea(config);
  const hasSyncPayload = Object.keys(syncPayload).length > 0;
  const hasLocalPayload = Object.keys(localPayload).length > 0;

  const persistLocalPayload = () => {
    if (!hasLocalPayload) {
      runCallback(onPersisted);
      return;
    }

    chrome.storage.local.set(localPayload, () => {
      runCallback(onPersisted);
    });
  };

  if (!hasSyncPayload) {
    persistLocalPayload();
    return;
  }

  chrome.storage.sync.set(syncPayload, () => {
    persistLocalPayload();
  });
}
