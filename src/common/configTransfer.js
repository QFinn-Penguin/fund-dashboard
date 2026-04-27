import { buildOptionsImportArtifacts } from "./fundStorage";
import { normalizePopupPageSize } from "./popupPreferences";

export const CONFIG_EXPORT_SCHEMA_VERSION = 1;
export const CONFIG_EXPORT_KIND = "fund-dashboard-config";

export const CONFIG_IMPORT_ERROR_MESSAGES = {
  empty: "导入失败：未读取到配置内容。",
  invalid_json: "导入失败：配置文件不是合法的 JSON。",
  invalid_root: "导入失败：配置内容必须是 JSON 对象。",
  invalid_kind: "导入失败：这不是基金看板的配置导出文件。",
  unsupported_schema: "导入失败：该配置文件版本暂不受支持，请先升级插件。",
  missing_payload: "导入失败：配置文件缺少 payload 数据。",
  invalid_payload: "导入失败：配置文件里的 payload 结构不正确。",
};

export function buildNormalizedExportConfig(config = {}) {
  const normalizedConfigArtifacts = buildOptionsImportArtifacts({
    ...config,
    popupPageSize: normalizePopupPageSize(config.popupPageSize),
  });
  const normalizedConfig = {
    ...normalizedConfigArtifacts.persistedConfig,
  };

  delete normalizedConfig.holiday;

  return normalizedConfig;
}

export function buildExportConfigText(config = {}) {
  return JSON.stringify(buildExportConfigEnvelope(config), null, 2);
}

export function buildExportConfigEnvelope(config = {}) {
  return {
    kind: CONFIG_EXPORT_KIND,
    schemaVersion: CONFIG_EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    payload: buildNormalizedExportConfig(config),
  };
}

export function unpackImportedConfig(rawConfig = {}) {
  if (!rawConfig || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
    return {};
  }

  if (
    rawConfig.kind === CONFIG_EXPORT_KIND &&
    Number(rawConfig.schemaVersion) >= 1 &&
    rawConfig.payload &&
    typeof rawConfig.payload === "object" &&
    !Array.isArray(rawConfig.payload)
  ) {
    return {
      ...rawConfig.payload,
    };
  }

  return {
    ...rawConfig,
  };
}

export function validateAndUnpackImportedConfigText(rawText = "") {
  const normalizedText = String(rawText || "").trim();

  if (!normalizedText) {
    return {
      ok: false,
      code: "empty",
      message: CONFIG_IMPORT_ERROR_MESSAGES.empty,
      config: null,
    };
  }

  let parsedConfig = null;
  try {
    parsedConfig = JSON.parse(normalizedText);
  } catch (error) {
    return {
      ok: false,
      code: "invalid_json",
      message: CONFIG_IMPORT_ERROR_MESSAGES.invalid_json,
      config: null,
    };
  }

  if (!parsedConfig || typeof parsedConfig !== "object" || Array.isArray(parsedConfig)) {
    return {
      ok: false,
      code: "invalid_root",
      message: CONFIG_IMPORT_ERROR_MESSAGES.invalid_root,
      config: null,
    };
  }

  const hasEnvelopeMarkers =
    Object.prototype.hasOwnProperty.call(parsedConfig, "kind") ||
    Object.prototype.hasOwnProperty.call(parsedConfig, "schemaVersion") ||
    Object.prototype.hasOwnProperty.call(parsedConfig, "payload");

  if (hasEnvelopeMarkers) {
    if (parsedConfig.kind !== CONFIG_EXPORT_KIND) {
      return {
        ok: false,
        code: "invalid_kind",
        message: CONFIG_IMPORT_ERROR_MESSAGES.invalid_kind,
        config: null,
      };
    }

    if (!Number.isInteger(Number(parsedConfig.schemaVersion)) || Number(parsedConfig.schemaVersion) < 1) {
      return {
        ok: false,
        code: "unsupported_schema",
        message: CONFIG_IMPORT_ERROR_MESSAGES.unsupported_schema,
        config: null,
      };
    }

    if (Number(parsedConfig.schemaVersion) > CONFIG_EXPORT_SCHEMA_VERSION) {
      return {
        ok: false,
        code: "unsupported_schema",
        message: CONFIG_IMPORT_ERROR_MESSAGES.unsupported_schema,
        config: null,
      };
    }

    if (!Object.prototype.hasOwnProperty.call(parsedConfig, "payload")) {
      return {
        ok: false,
        code: "missing_payload",
        message: CONFIG_IMPORT_ERROR_MESSAGES.missing_payload,
        config: null,
      };
    }

    if (!parsedConfig.payload || typeof parsedConfig.payload !== "object" || Array.isArray(parsedConfig.payload)) {
      return {
        ok: false,
        code: "invalid_payload",
        message: CONFIG_IMPORT_ERROR_MESSAGES.invalid_payload,
        config: null,
      };
    }
  }

  return {
    ok: true,
    code: null,
    message: "",
    config: unpackImportedConfig(parsedConfig),
  };
}
