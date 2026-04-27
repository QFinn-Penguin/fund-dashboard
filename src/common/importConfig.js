import { removeExtensionStorageKeys } from "./extensionStorage";
import { persistExtensionStorage } from "./extensionStorage";
import { LOCAL_ONLY_STORAGE_KEYS } from "./storageKeys";

export function persistImportedConfig(config = {}, onPersisted = () => {}) {
  getImportedConfigKeys(config, (keysToReset) => {
    removeExtensionStorageKeys(keysToReset, () => {
      persistExtensionStorage(config, onPersisted);
    });
  });
}

function getImportedConfigKeys(config = {}, callback = () => {}) {
  chrome.storage.sync.get(null, (syncConfig) => {
    chrome.storage.local.get(null, (localConfig) => {
      const existingKeys = new Set([
        ...Object.keys(syncConfig || {}),
        ...Object.keys(localConfig || {}),
      ]);
      const importedKeys = Object.keys(config || {});

      callback(
        [...existingKeys].filter((key) => {
          return importedKeys.includes(key) || LOCAL_ONLY_STORAGE_KEYS.includes(key);
        })
      );
    });
  });
}
