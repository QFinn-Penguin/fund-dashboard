import axios from "axios";
import {
  deriveCurrentFundsFromConfig,
  deriveFundCodesFromConfig,
} from "./common/fundStorage";
import {
  ensureLocalOnlyStorageMigrated,
  getExtensionStorage,
} from "./common/extensionStorage";

const BADGE_REFRESH_ALARM = "badge-refresh";
const ACTION_CONTEXT_MENU_ID = "open-popup-window";

var RealtimeFundcode = null;
var RealtimeIndcode = null;
var fundListM = [];
var fundListGroup = [];
var currentGroupIndex = 0;
var showBadge = 1;
var BadgeContent = 1;
var BadgeType = 1;
var userId = null;

var getCurrentFunds = () => {
  return deriveCurrentFundsFromConfig({
    fundListGroup,
    currentGroupIndex,
    fundListM,
  });
};

var getGuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

var toNum = a => {
  var numString = a.toString();
  var c = numString.split(".");
  var num_place = ["", "0", "00", "000", "0000"],
    r = num_place.reverse();
  for (var i = 0; i < c.length; i++) {
    var len = c[i].length;
    c[i] = r[len] + c[i];
  }
  var res = c.join("");
  return res;
};

var cpr_version = (a, b) => {
  var _a = toNum(a),
    _b = toNum(b);
  if (_a == _b) console.log("版本号相同！版本号为：" + a);
  if (_a > _b) console.log("版本号" + a + "是新版本！");
  if (_a < _b) console.log("版本号" + b + "是新版本！");
};

var isDuringDate = () => {
  var zoneOffset = 8;
  var offset8 = new Date().getTimezoneOffset() * 60 * 1000;
  var nowDate8 = new Date().getTime();
  var curDate = new Date(nowDate8 + offset8 + zoneOffset * 60 * 60 * 1000);

  var beginDateAM = new Date();
  var endDateAM = new Date();
  var beginDatePM = new Date();
  var endDatePM = new Date();

  beginDateAM.setHours(9, 30, 0);
  endDateAM.setHours(11, 35, 0);
  beginDatePM.setHours(13, 0, 0);
  endDatePM.setHours(15, 5, 0);
  if (curDate.getDay() == "6" || curDate.getDay() == "0") {
    return false;
  } else if (curDate >= beginDateAM && curDate <= endDateAM) {
    return true;
  } else if (curDate >= beginDatePM && curDate <= endDatePM) {
    return true;
  } else {
    return false;
  }
};

var formatNum = val => {
  let num = parseFloat(val);
  if (!Number.isFinite(num)) {
    return "0";
  }
  let absNum = Math.abs(num);
  if (absNum < 10) {
    return num.toFixed(2);
  } else if (absNum < 100) {
    return num.toFixed(1);
  } else if (absNum < 1000) {
    return num.toFixed(0);
  } else if (absNum < 10000) {
    return (num / 1000).toFixed(1) + "k";
  } else if (absNum < 1000000) {
    return (num / 1000).toFixed(0) + "k";
  } else if (absNum < 10000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else {
    return (num / 1000000).toFixed(0) + "M";
  }
};

var safeBadgeNumber = (val, fallback = 0) => {
  let num = Number(val);
  return Number.isFinite(num) ? num : fallback;
};

var formatBadgeRate = val => {
  let num = Number(val);
  return Number.isFinite(num) ? num.toFixed(2) : "0";
};

var getBadgeColor = (val, realtime) => {
  if (!realtime) {
    return "#4285f4";
  }
  return safeBadgeNumber(val, 0) >= 0 ? "#F56C6C" : "#4eb61b";
};

var setBadgeText = text => {
  chrome.action.setBadgeText({
    text: text == null ? "" : String(text),
  });
};

var setBadgeBackgroundColor = color => {
  chrome.action.setBadgeBackgroundColor({
    color: color,
  });
};

var setBadge = (fundcode, Realtime, type) => {
  let fundStr = null;
  if (type == 3) {
    if (!fundcode) {
      endInterval();
      return;
    }
    let url =
      "https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f3&secids=" +
      fundcode +
      "&_=" +
      new Date().getTime();
    axios.get(url).then(res => {
      let data = res && res.data && res.data.data ? res.data.data.diff : null;
      let rawRate = data && data[0] ? data[0].f3 : 0;
      let num = safeBadgeNumber(rawRate, 0);
      let text = formatBadgeRate(rawRate);
      setBadgeText(text);
      let color = getBadgeColor(num, Realtime);
      setBadgeBackgroundColor(color);
    });
  } else {
    if (type == 1) {
      if (!fundcode) {
        endInterval();
        return;
      }
      fundStr = fundcode;
    } else {
      fundStr = deriveFundCodesFromConfig({
        fundListGroup,
        currentGroupIndex,
        fundListM,
      }).join(",");
      if (!fundStr) {
        endInterval();
        return;
      }
    }

    let url =
      "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=200&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=" +
      userId +
      "&Fcodes=" +
      fundStr;
    axios
      .get(url)
      .then(res => {
        let allAmount = 0;
        let allGains = 0;
        let textStr = null;
        let sumNum = 0;
        if (type == 1) {
          let val = res.data.Datas[0];
          if (!val) {
            endInterval();
            return;
          }
          let data = {
            fundcode: val.FCODE,
            name: val.SHORTNAME,
            jzrq: val.PDATE,
            dwjz: isNaN(val.NAV) ? null : Number(val.NAV),
            gsz: isNaN(val.GSZ) ? null : Number(val.GSZ),
            gszzl: isNaN(val.GSZZL) ? 0 : Number(val.GSZZL),
            gztime: val.GZTIME,
            num: 0,
          };
          let slt = getCurrentFunds().filter(item => item.code == data.fundcode);
          if (!slt.length) {
            return false;
          }
          data.num = slt[0].num;
          var sum = 0;

          let num = data.num ? data.num : 0;

          if (val.PDATE != "--" && val.GZTIME && val.PDATE == val.GZTIME.substr(0, 10)) {
            data.gsz = isNaN(val.NAV) ? data.gsz : Number(val.NAV);
            data.gszzl = isNaN(val.NAVCHGRT) ? 0 : Number(val.NAVCHGRT);
            if (data.dwjz != null) {
              sum = ((data.dwjz - data.dwjz / (1 + data.gszzl * 0.01)) * num).toFixed(1);
            }
          } else if (data.gsz != null && data.dwjz != null) {
            sum = ((data.gsz - data.dwjz) * num).toFixed(1);
          }

          if (BadgeType == 1) {
            textStr = formatBadgeRate(data.gszzl);
            sumNum = safeBadgeNumber(data.gszzl, 0);
          } else {
            if (num != 0) {
              sumNum = safeBadgeNumber(sum, 0);
              textStr = formatNum(sum);
            } else {
              sumNum = "0";
              textStr = "0";
            }
          }
        } else {
          res.data.Datas.forEach(val => {
            let slt = getCurrentFunds().filter(item => item.code == val.FCODE);
            if (!slt.length) {
              return;
            }
            let num = slt[0].num ? slt[0].num : 0;
            let NAV = isNaN(val.NAV) ? null : Number(val.NAV);
            if (NAV != null) {
              allAmount += NAV * num;
            }
            var sum = 0;
            if (val.PDATE != "--" && val.GZTIME && val.PDATE == val.GZTIME.substr(0, 10)) {
              let NAVCHGRT = isNaN(val.NAVCHGRT) ? 0 : Number(val.NAVCHGRT);
              if (NAV != null) {
                sum = (NAV - NAV / (1 + NAVCHGRT * 0.01)) * num;
              }
            } else {
              let gsz = isNaN(val.GSZ) ? null : Number(val.GSZ);
              if (gsz != null && NAV != null) {
                sum = (gsz - NAV) * num;
              }
            }
            allGains += sum;
          });
          if (BadgeType == 1) {
            if (allAmount == 0 || allGains == 0) {
              sumNum = "0";
              textStr = "0";
            } else {
              textStr = formatBadgeRate((100 * allGains) / allAmount);
              sumNum = safeBadgeNumber(textStr, 0);
            }
          } else {
            sumNum = allGains;
            textStr = formatNum(allGains);
          }
        }

        setBadgeText(textStr);
        let color = getBadgeColor(sumNum, Realtime);
        setBadgeBackgroundColor(color);
      })
      .catch(() => {});
  }
};

var scheduleBadgeAlarm = type => {
  let periodInMinutes = 2;
  if (type == 3) {
    periodInMinutes = 10 / 60;
  }
  chrome.alarms.clear(BADGE_REFRESH_ALARM, () => {
    chrome.alarms.create(BADGE_REFRESH_ALARM, {
      periodInMinutes: periodInMinutes,
    });
  });
};

var startInterval = (fundcode, type = 1) => {
  endInterval();
  if (type == 3) {
    RealtimeIndcode = fundcode;
  } else if (type == 1) {
    RealtimeFundcode = fundcode;
  }
  let Realtime = isDuringDate();
  setBadge(fundcode, Realtime, type);
  scheduleBadgeAlarm(type);
};

var endInterval = () => {
  chrome.alarms.clear(BADGE_REFRESH_ALARM);
  setBadgeText("");
};

var runStart = (RealtimeFundcodeValue, RealtimeIndcodeValue) => {
  if (showBadge == 1 && BadgeContent != 3) {
    if (getCurrentFunds().length) {
      startInterval(null, 2);
    } else {
      endInterval();
    }
  } else if (showBadge == 1 && BadgeContent == 3) {
    if (RealtimeIndcodeValue) {
      startInterval(RealtimeIndcodeValue, 3);
    } else {
      endInterval();
    }
  } else {
    endInterval();
  }
};

var getData = () => {
  getExtensionStorage(
    [
      "fundListGroup",
      "currentGroupIndex",
      "RealtimeFundcode",
      "RealtimeIndcode",
      "showBadge",
      "BadgeContent",
      "BadgeType",
      "userId",
    ],
    res => {
      RealtimeFundcode = res.RealtimeFundcode ? res.RealtimeFundcode : null;
      RealtimeIndcode = res.RealtimeIndcode ? res.RealtimeIndcode : null;
      fundListGroup = Array.isArray(res.fundListGroup) ? res.fundListGroup : [];
      currentGroupIndex = Number.isInteger(res.currentGroupIndex) ? res.currentGroupIndex : 0;
      fundListM = getCurrentFunds();
      showBadge = res.showBadge ? res.showBadge : 1;
      BadgeContent = res.BadgeContent ? res.BadgeContent : 1;
      BadgeType = res.BadgeType ? res.BadgeType : 1;
      if (res.userId) {
        userId = res.userId;
      } else {
        userId = getGuid();
        chrome.storage.sync.set({
          userId: userId,
        });
      }
      runStart(RealtimeFundcode, RealtimeIndcode);
    }
  );
};

var createActionContextMenu = () => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: ACTION_CONTEXT_MENU_ID,
      title: "以独立窗口模式打开",
      contexts: ["action"],
    });
  });
};

var initializeExtension = () => {
  createActionContextMenu();
  ensureLocalOnlyStorageMigrated(() => {
    getData();
  });
};

initializeExtension();

chrome.runtime.onInstalled.addListener(() => {
  initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  initializeExtension();
});

chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId !== ACTION_CONTEXT_MENU_ID) {
    return;
  }
  chrome.windows.create(
    {
      url: chrome.runtime.getURL("popup/popup.html"),
      width: 700,
      height: 550,
      top: 200,
      type: "popup",
    },
    function(e) {
      chrome.windows.update(e.id, {
        focused: true,
      });
    }
  );
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== BADGE_REFRESH_ALARM) {
    return;
  }

  if (showBadge != 1) {
    endInterval();
    return;
  }

  if (BadgeContent != 3) {
    if (getCurrentFunds().length) {
      setBadge(null, isDuringDate(), 2);
    } else {
      endInterval();
    }
  } else if (BadgeContent == 3) {
    if (RealtimeIndcode) {
      setBadge(RealtimeIndcode, isDuringDate(), 3);
    } else {
      endInterval();
    }
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync") {
    const refreshKeys = [
      "currentGroupIndex",
      "RealtimeFundcode",
      "RealtimeIndcode",
      "showBadge",
      "BadgeContent",
      "BadgeType",
      "userId",
    ];

    if (Object.keys(changes).some(key => refreshKeys.includes(key))) {
      getData();
    }
    return;
  }

  if (areaName === "local") {
    if (Object.prototype.hasOwnProperty.call(changes, "fundListGroup")) {
      getData();
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "proxyRequest") {
    const config = request.config || {};
    const url = config.url || "";
    const timeout = Number(config.timeout);
    const timeoutMs = Number.isFinite(timeout) && timeout > 0 ? timeout : 12000;
    const mobileHeaders = {
      "User-Agent": "okhttp/4.9.2",
      Accept: "application/json, text/plain, */*",
    };
    const headers =
      url.indexOf("fundmobapi.eastmoney.com") > -1
        ? {
            ...mobileHeaders,
            ...(config.headers || {}),
          }
        : config.headers || {};

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeoutId = setTimeout(() => {
      if (controller) {
        controller.abort();
      }
    }, timeoutMs);

    let responded = false;
    const safeSendResponse = payload => {
      if (responded) {
        return;
      }
      responded = true;
      clearTimeout(timeoutId);
      sendResponse(payload);
    };

    fetch(config.url, {
      method: config.method || "GET",
      headers,
      body: config.body,
      credentials: "omit",
      signal: controller ? controller.signal : undefined,
    })
      .then(async response => {
        const text = await response.text();
        let data = text;

        try {
          data = JSON.parse(text);
        } catch (e) {
          const jsonpMatch = text.match(/^\s*jsonpgz\((.*)\);?\s*$/s);
          if (jsonpMatch && jsonpMatch[1]) {
            try {
              data = JSON.parse(jsonpMatch[1]);
            } catch (innerError) {}
          }
        }

        if (!response.ok) {
          safeSendResponse({
            success: false,
            error: `HTTP ${response.status}`,
            data,
          });
          return;
        }

        safeSendResponse({
          success: true,
          data,
        });
      })
      .catch(error => {
        safeSendResponse({
          success: false,
          error:
            error && error.name === "AbortError"
              ? "Request timeout"
              : error && error.message
              ? error.message
              : "Network Error",
        });
      });
    return true;
  }
  if (request.type == "DuringDate") {
    let DuringDate = isDuringDate();
    sendResponse({
      farewell: DuringDate,
    });
  }
  if (request.type == "refresh") {
    getData();
  }
  if (request.type == "refreshBadgeAllGains") {
    let allAmount = 0;
    let allGains = 0;
    let sumNum = 0;
    request.data.forEach(val => {
      let currentCode = val.FCODE || val.fundcode;
      let slt = getCurrentFunds().filter(item => item.code == currentCode);
      if (!slt.length) {
        return;
      }
      let num = slt[0].num ? slt[0].num : 0;
      let NAV = isNaN(val.NAV) ? (isNaN(val.dwjz) ? null : Number(val.dwjz)) : Number(val.NAV);
      if (NAV != null) {
        allAmount += NAV * num;
      }
      var sum = 0;
      if (val.PDATE != "--" && val.GZTIME && val.PDATE == val.GZTIME.substr(0, 10)) {
        let NAVCHGRT = isNaN(val.NAVCHGRT) ? (isNaN(val.gszzl) ? 0 : Number(val.gszzl)) : Number(val.NAVCHGRT);
        if (NAV != null) {
          sum = (NAV - NAV / (1 + NAVCHGRT * 0.01)) * num;
        }
      } else {
        let gsz = isNaN(val.GSZ) ? (isNaN(val.gsz) ? null : Number(val.gsz)) : Number(val.GSZ);
        if (gsz != null && NAV != null) {
          sum = (gsz - NAV) * num;
        }
      }
      allGains += sum;
    });
    let textStr = null;
    if (BadgeType == 1) {
      if (allAmount == 0 || allGains == 0) {
        textStr = "0";
        sumNum = "0";
      } else {
        textStr = formatBadgeRate((100 * allGains) / allAmount);
        sumNum = safeBadgeNumber(textStr, 0);
      }
    } else {
      textStr = formatNum(allGains);
      sumNum = allGains;
    }

    setBadgeText(textStr);
    let color = getBadgeColor(sumNum, isDuringDate());
    setBadgeBackgroundColor(color);
  }
  if (request.type == "endInterval") {
    endInterval();
  }
  if (request.type == "startInterval") {
    startInterval(request.id);
  }
  if (request.type == "refreshOption") {
    switch (request.data.type) {
      case "showBadge":
        showBadge = request.data.value;
        break;
      case "BadgeContent":
        BadgeContent = request.data.value;
        break;
      case "BadgeType":
        BadgeType = request.data.value;
        break;
    }
    getData();
  }
});

cpr_version(chrome.runtime.getManifest().version, chrome.runtime.getManifest().version);
