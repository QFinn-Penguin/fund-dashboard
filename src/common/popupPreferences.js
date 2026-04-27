// popupPreferences.js is the shared domain layer for popup/options preferences.
// It owns two responsibilities only:
// 1) normalize and derive persisted preference values
// 2) normalize, build, and match shortcut values

// ===== Shared preference defaults =====
export const DEFAULT_DISPLAY_TOGGLES = {
  showGSZ: true,
  showAmount: true,
  showGains: true,
  showCost: true,
  showCostRate: true,
  showPrevGszzl: true,
};

export const DEFAULT_POPUP_PAGE_SIZE = 4;

export const DEFAULT_POPUP_SHORTCUTS = {
  groupNextShortcut: "ALT+E",
  pagePrevShortcut: "ALT+A",
  pageNextShortcut: "ALT+D",
};

// ===== Shared shortcut domain =====
export const SHORTCUT_MODIFIERS = ["CTRL", "ALT", "SHIFT", "META"];

export const SHORTCUT_ALIAS_MAP = {
  CONTROL: "CTRL",
  OPTION: "ALT",
  CMD: "META",
  COMMAND: "META",
  WINDOWS: "META",
  WIN: "META",
  OS: "META",
  SPACEBAR: "SPACE",
  ESC: "ESCAPE",
  DEL: "DELETE",
  LEFT: "ARROWLEFT",
  RIGHT: "ARROWRIGHT",
  UP: "ARROWUP",
  DOWN: "ARROWDOWN",
};

export function formatShortcutDisplayText(value = "") {
  return String(value || "").replace(/(^|\+)ALT/g, "$1Alt");
}

export const POPUP_SHORTCUT_DISPLAY_TEXT = {
  groupNextShortcut: formatShortcutDisplayText(DEFAULT_POPUP_SHORTCUTS.groupNextShortcut),
  pagePrevShortcut: formatShortcutDisplayText(DEFAULT_POPUP_SHORTCUTS.pagePrevShortcut),
  pageNextShortcut: formatShortcutDisplayText(DEFAULT_POPUP_SHORTCUTS.pageNextShortcut),
};

export function getDisplayToggleState(config = {}) {
  const nextState = {};
  const missingEntries = {};

  Object.keys(DEFAULT_DISPLAY_TOGGLES).forEach((key) => {
    if (typeof config[key] === "boolean") {
      nextState[key] = config[key];
      return;
    }

    nextState[key] = DEFAULT_DISPLAY_TOGGLES[key];
    missingEntries[key] = DEFAULT_DISPLAY_TOGGLES[key];
  });

  return {
    nextState,
    missingEntries,
  };
}

function buildShortcutArtifacts(config = {}) {
  return {
    groupNextShortcut: normalizeShortcut(
      config.groupNextShortcut,
      DEFAULT_POPUP_SHORTCUTS.groupNextShortcut
    ),
    pagePrevShortcut: normalizeShortcut(
      config.pagePrevShortcut,
      DEFAULT_POPUP_SHORTCUTS.pagePrevShortcut
    ),
    pageNextShortcut: normalizeShortcut(
      config.pageNextShortcut,
      DEFAULT_POPUP_SHORTCUTS.pageNextShortcut
    ),
  };
}

export function normalizeShortcut(value, fallback = "") {
  const parts = String(value || "")
    .split("+")
    .map((part) => normalizeShortcutPart(part))
    .filter(Boolean);

  const modifiers = SHORTCUT_MODIFIERS.filter((modifier) => parts.includes(modifier));
  const mainKey = parts.find((part) => !isModifierShortcutPart(part)) || "";
  const text = [...modifiers, mainKey].filter(Boolean).join("+");
  return text || fallback;
}

export function normalizeShortcutPart(value) {
  const text = String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();

  return SHORTCUT_ALIAS_MAP[text] || text;
}

export function isModifierShortcutPart(value) {
  return SHORTCUT_MODIFIERS.includes(value);
}

export function buildShortcutFromKeyEvent(event = {}) {
  const modifierMap = [
    [event.ctrlKey, "CTRL"],
    [event.altKey, "ALT"],
    [event.shiftKey, "SHIFT"],
    [event.metaKey, "META"],
  ];
  const pressedKey = normalizeShortcutPart(event.key);

  if (!pressedKey || isModifierShortcutPart(pressedKey)) {
    return "";
  }

  const modifiers = modifierMap
    .filter(([enabled]) => enabled)
    .map(([, modifier]) => modifier);

  return normalizeShortcut([...modifiers, pressedKey].join("+"), "");
}

export function isShortcutMatch(event = {}, shortcut = "") {
  if (!shortcut) {
    return false;
  }

  const normalizedShortcut = normalizeShortcut(shortcut, "");
  const parts = normalizedShortcut.split("+").filter(Boolean);
  const key = parts[parts.length - 1];
  const modifiers = new Set(parts.slice(0, -1));
  const eventKey = normalizeShortcutPart(event.key);

  if (eventKey !== key) {
    return false;
  }

  return (
    !!event.altKey === modifiers.has("ALT") &&
    !!event.ctrlKey === modifiers.has("CTRL") &&
    !!event.shiftKey === modifiers.has("SHIFT") &&
    !!event.metaKey === modifiers.has("META")
  );
}

// ===== Shared popup/options preference artifacts =====
export function normalizePopupPageSize(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? Math.min(Math.max(Math.round(numericValue), 1), 20)
    : DEFAULT_POPUP_PAGE_SIZE;
}

export function buildPopupPreferenceArtifacts(config = {}) {
  const { nextState: displayToggleState, missingEntries: missingDisplayToggles } =
    getDisplayToggleState(config);
  const grayscaleValue = config.grayscaleValue ? config.grayscaleValue : 0;
  const opacityValue = config.opacityValue ? config.opacityValue : 0;

  return {
    displayToggleState,
    missingDisplayToggles,
    shortcuts: buildShortcutArtifacts(config),
    pageSize: normalizePopupPageSize(config.popupPageSize),
    shouldPersistDefaultPageSize: !Number.isFinite(Number(config.popupPageSize)),
    grayscaleValue,
    opacityValue,
    grayscaleStyle:
      grayscaleValue > 0
        ? {
            filter: "grayscale(" + grayscaleValue / 100 + ")",
          }
        : {},
    opacityStyle: {
      "--page-bg-alpha": (1 - opacityValue / 100).toFixed(2),
    },
  };
}

// Options extends the popup preference domain with settings-page-only fields,
// while still reusing the same shared popup preference + shortcut artifacts.
export function buildOptionsPreferenceArtifacts(config = {}) {
  const popupPreferenceArtifacts = buildPopupPreferenceArtifacts(config);

  return {
    ...popupPreferenceArtifacts,
    darkMode: !!config.darkMode,
    normalFontSize: !!config.normalFontSize,
    showBadge: config.showBadge ? config.showBadge : 1,
    BadgeContent: config.BadgeContent ? config.BadgeContent : 1,
    BadgeType: config.BadgeType ? config.BadgeType : 1,
  };
}
