(function() {
  const PAGE_REQUEST_TYPE = "FUNDS_PAGE_FETCH_HOLDINGS";
  const PAGE_RESPONSE_TYPE = "FUNDS_PAGE_FETCH_HOLDINGS_RESULT";
  const CONTENT_SOURCE = "funds-extension-content";
  const PAGE_SOURCE = "funds-page-bridge";

  function postResult(requestId, payload) {
    window.postMessage(
      {
        source: PAGE_SOURCE,
        type: PAGE_RESPONSE_TYPE,
        requestId,
        payload,
      },
      window.location.origin
    );
  }

  function parseResponseText(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return text;
    }
  }

  function fetchHoldings(fundCode) {
    const url = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNInverstPosition?FCODE=${fundCode}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&Uid=&_=${Date.now()}`;
    return fetch(url, {
      method: "GET",
      credentials: "omit",
    }).then(async response => {
      const text = await response.text();
      const data = parseResponseText(text);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          data,
        };
      }

      return {
        success: true,
        data,
      };
    });
  }

  window.addEventListener("message", event => {
    if (event.source !== window) {
      return;
    }

    const payload = event.data || {};
    if (payload.source !== CONTENT_SOURCE || payload.type !== PAGE_REQUEST_TYPE) {
      return;
    }

    const requestId = payload.requestId;
    const fundCode = payload.fundCode;
    if (!requestId || !fundCode) {
      postResult(requestId, { success: false, error: "Missing requestId or fundCode" });
      return;
    }

    fetchHoldings(fundCode)
      .then(result => {
        postResult(requestId, result);
      })
      .catch(error => {
        postResult(requestId, {
          success: false,
          error: error && error.message ? error.message : "Page bridge network error",
        });
      });
  });
})();
