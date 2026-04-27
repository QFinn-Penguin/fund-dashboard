import axios from "axios";

const DEFAULT_BACKGROUND_REQUEST_TIMEOUT = 12000;

export function requestWithBackground(config) {
  const normalizedConfig = {
    ...(config || {}),
  };
  const timeout = Number(normalizedConfig.timeout);
  const timeoutMs = Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_BACKGROUND_REQUEST_TIMEOUT;

  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    typeof chrome.runtime.sendMessage === "function"
  ) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (handler, payload) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        handler(payload);
      };
      const timer = setTimeout(() => {
        settle(reject, new Error("Request timeout"));
      }, timeoutMs);

      chrome.runtime.sendMessage(
        {
          type: "proxyRequest",
          config: {
            ...normalizedConfig,
            timeout: timeoutMs,
          },
        },
        response => {
          if (chrome.runtime.lastError) {
            settle(reject, new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!response || !response.success) {
            settle(
              reject,
              new Error(
                response && response.error ? response.error : "Network Error"
              )
            );
            return;
          }

          settle(resolve, { data: response.data });
        }
      );
    });
  }

  return axios({
    timeout: timeoutMs,
    ...normalizedConfig,
  });
}
