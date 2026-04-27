const PAGE_REQUEST_TYPE = "FUNDS_PAGE_FETCH_HOLDINGS";
const PAGE_RESPONSE_TYPE = "FUNDS_PAGE_FETCH_HOLDINGS_RESULT";
const CONTENT_SOURCE = "funds-extension-content";
const PAGE_SOURCE = "funds-page-bridge";

const pendingRequests = new Map();
let bridgeInjected = false;

function injectBridgeScript() {
  if (bridgeInjected) {
    return;
  }

  const container = document.head || document.documentElement;
  if (!container) {
    return;
  }

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("page/holdings-bridge.js");
  script.async = false;
  script.onload = () => {
    script.remove();
  };
  container.appendChild(script);
  bridgeInjected = true;
}

injectBridgeScript();

window.addEventListener("message", event => {
  if (event.source !== window) {
    return;
  }

  const payload = event.data || {};
  if (payload.source !== PAGE_SOURCE || payload.type !== PAGE_RESPONSE_TYPE) {
    return;
  }

  const resolver = pendingRequests.get(payload.requestId);
  if (!resolver) {
    return;
  }

  pendingRequests.delete(payload.requestId);
  resolver(payload.payload || { success: false, error: "Empty bridge response" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "fetchHoldingsInPage") {
    return undefined;
  }

  injectBridgeScript();

  const requestId = message.requestId;
  if (!requestId || !message.fundCode) {
    sendResponse({ success: false, error: "Missing requestId or fundCode" });
    return false;
  }

  const timeoutId = window.setTimeout(() => {
    if (!pendingRequests.has(requestId)) {
      return;
    }

    pendingRequests.delete(requestId);
    sendResponse({ success: false, error: "Page bridge timeout" });
  }, 10000);

  pendingRequests.set(requestId, payload => {
    window.clearTimeout(timeoutId);
    sendResponse(payload);
  });

  window.postMessage(
    {
      source: CONTENT_SOURCE,
      type: PAGE_REQUEST_TYPE,
      requestId,
      fundCode: message.fundCode,
    },
    window.location.origin
  );

  return true;
});
