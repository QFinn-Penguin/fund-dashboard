<template>
  <div v-if="configShadow" class="shadow">
    <div class="config-box" :style="{ marginTop: top + 'px' }">
      <div class="tab-row config-switcher">
        <button
          @click="checked = 'export'"
          :class="checked == 'export' ? 'checked' : ''"
        >
          导出(JSON文本)
        </button>
        <button
          @click="checked = 'import'"
          :class="checked == 'import' ? 'checked' : ''"
        >
          导入(JSON文本)
        </button>
      </div>
      <div class="tab-content" v-if="checked == 'export'">
        <p class="config-desc">导出当前插件配置，便于备份或迁移到其他浏览器。</p>
        <div class="json-editor-frame json-editor-frame--readonly">
          <div v-if="exportJsonPreviewLines.length" class="json-preview" aria-label="导出的 JSON 配置文本">
            <div
              v-for="line in exportJsonPreviewLines"
              :key="line.number"
              class="json-preview__line"
            >
              <span class="json-preview__line-no">{{ line.number }}</span>
              <span class="json-preview__code" v-html="line.html"></span>
            </div>
          </div>
          <div v-else class="json-preview json-preview--empty">正在生成配置文本...</div>
        </div>
      </div>
      <div class="tab-content" v-else>
        <p class="config-desc">导入配置会覆盖当前内容，请确认文本来源可靠。</p>
        <div class="json-editor-frame json-editor-frame--editable">
          <div class="json-editor-shell">
            <div class="json-editor-gutter" aria-hidden="true">
              <div class="json-editor-gutter__inner" :style="importGutterStyle">
                <span v-for="line in importLineNumbers" :key="line">{{ line }}</span>
              </div>
            </div>
            <textarea
              class="json-editor"
              :rows="15"
              placeholder="请在此粘贴完整 JSON 配置文本"
              v-model="inputConfigStr"
              @scroll="syncImportEditorScroll"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="config-actions">
        <button class="btn btn--ghost" type="button" @click="close">返回</button>
        <button
          v-if="checked == 'export'"
          class="btn btn--primary"
          type="button"
          :disabled="!exportConfigStr"
          @click="copy"
        >
          {{ copyButtonText }}
        </button>
        <button
          v-else
          class="btn btn--primary btn--success"
          type="button"
          :disabled="!inputConfigStr"
          @click="importInput"
        >
          提交配置文本
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { buildOptionsImportArtifacts } from "./fundStorage";
import { getExtensionStorage } from "./extensionStorage";
import { buildExportConfigText, validateAndUnpackImportedConfigText } from "./configTransfer";
import { persistImportedConfig } from "./importConfig";
import { normalizePopupPageSize } from "./popupPreferences";
import { showProjectMessage } from "./message";
import { FUND_TRANSACTIONS_STORAGE_KEY } from "./storageKeys";

export default {
  components: {},
  name: "configBox",
  props: {
    top: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      configShadow: false,
      checked: "export",
      textarea: "",
      exportConfigStr: null,
      inputConfigStr: null,
      copyButtonText: "复制配置文本",
      copyButtonTimer: null,
      importEditorScrollTop: 0,
    };
  },
  watch: {},
  computed: {
    exportJsonPreviewLines() {
      return this.buildJsonPreviewLines(this.exportConfigStr);
    },
    importLineNumbers() {
      const lineCount = String(this.inputConfigStr || "").split(/\r?\n/).length;
      return Array.from({ length: Math.max(lineCount, 1) }, (_, index) => index + 1);
    },
    importGutterStyle() {
      return {
        transform: `translateY(-${this.importEditorScrollTop}px)`,
      };
    },
  },
  mounted() {},
  beforeDestroy() {
    this.clearCopyButtonTimer();
  },
  methods: {
    init() {
      this.configShadow = true;
      this.inputConfigStr = null;
      this.importEditorScrollTop = 0;
      this.copyButtonText = "复制配置文本";
      getExtensionStorage(null, (res) => {
        this.exportConfigStr = buildExportConfigText(res);
      });
    },
    close() {
      this.configShadow = false;
      this.$emit("close", false);
    },
    exportConfig() {},
    buildJsonPreviewLines(source) {
      if (!source) {
        return [];
      }

      return String(source)
        .split(/\r?\n/)
        .map((line, index) => ({
          number: index + 1,
          html: this.renderJsonPreviewLine(line),
        }));
    },
    renderJsonPreviewLine(line) {
      return this.escapeHtml(line)
        .replace(/(&quot;[^&quot;]+&quot;)(\s*:\s*)/g, '<span class="json-token json-token--key">$1</span>$2')
        .replace(/: (&quot;.*?&quot;)([\s,}\]])/g, ': <span class="json-token json-token--string">$1</span>$2')
        .replace(/: (-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)([\s,}\]])/gi, ': <span class="json-token json-token--number">$1</span>$2')
        .replace(/: (true|false|null)([\s,}\]])/g, ': <span class="json-token json-token--literal">$1</span>$2');
    },
    escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },
    syncImportEditorScroll(event) {
      this.importEditorScrollTop = event && event.target ? event.target.scrollTop : 0;
    },
    clearCopyButtonTimer() {
      if (this.copyButtonTimer) {
        window.clearTimeout(this.copyButtonTimer);
        this.copyButtonTimer = null;
      }
    },
    copy() {
      if (!this.exportConfigStr) {
        return;
      }

      const onSuccess = () => {
        this.clearCopyButtonTimer();
        this.copyButtonText = "已复制";
        this.copyButtonTimer = window.setTimeout(() => {
          this.copyButtonText = "复制配置文本";
          this.copyButtonTimer = null;
        }, 1600);
        showProjectMessage(this, {
          message: "已复制到剪贴板，请自行保存！",
          type: "success",
        });
      };

      const fallbackCopy = () => {
        const textarea = document.createElement("textarea");
        textarea.value = this.exportConfigStr;
        textarea.setAttribute("readonly", "readonly");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        try {
          document.execCommand("copy");
          onSuccess();
        } catch (e) {
          showProjectMessage(this, {
            message: "复制失败，请手动复制文本！",
            type: "error",
          });
        } finally {
          document.body.removeChild(textarea);
        }
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(this.exportConfigStr)
          .then(() => {
            onSuccess();
          })
          .catch(() => {
            fallbackCopy();
          });
      } else {
        fallbackCopy();
      }
    },
    importInput() {
      const validationResult = validateAndUnpackImportedConfigText(this.inputConfigStr);
      if (!validationResult.ok) {
        showProjectMessage(this, {
          message: validationResult.message,
          type: "error",
        });
        return;
      }

      const parsedConfig = validationResult.config;
      const configArtifacts = buildOptionsImportArtifacts({
        ...parsedConfig,
        popupPageSize: normalizePopupPageSize(parsedConfig.popupPageSize),
      });
      const config = {
        ...configArtifacts.persistedConfig,
      };
      if (typeof config[FUND_TRANSACTIONS_STORAGE_KEY] === "undefined") {
        config[FUND_TRANSACTIONS_STORAGE_KEY] = {};
      }

      persistImportedConfig(config, () => {
        this.$emit("success", false);

        showProjectMessage(this, {
          message: "恭喜,导入配置成功！",
          type: "success",
        });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.shadow {
  position: fixed;
  width: 100%;
  height: 100%;
  padding: 20px 40px;
  box-sizing: border-box;
  top: 0;
  left: 0;
  background-color: rgba(8, 12, 20, 0.72);
  z-index: 100;
}

.config-box {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 16px;
  width: 560px;
  max-width: calc(100vw - 48px);
  margin: 0 auto;
  text-align: center;
  line-height: 1;
  vertical-align: middle;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

.tab-content {
  padding: 0 22px;
}

.config-desc {
  margin: 0 0 10px;
  padding: 0 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.config-box button {
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #dbe4f0;
  font-weight: 500;
  border-left: 0;
  color: #606266;
  -webkit-appearance: none;
  text-align: center;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  padding: 12px 20px;
  font-size: 14px;
  width: 150px;
  position: relative;
  display: inline-block;
  outline: none;
}

.config-box button:first-child {
  border-left: 1px solid #dcdfe6;
  border-radius: 4px 0 0 4px;
  box-shadow: none !important;
}

.config-box button:last-child {
  border-radius: 0 4px 4px 0;
}

.config-box button.checked {
  color: #2563eb;
  background-color: rgba(59, 130, 246, 0.12);
  border-color: #60a5fa;
}

.json-editor-frame {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 10px 24px rgba(15, 23, 42, 0.06);
}

.json-editor-frame--readonly {
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.78), rgba(248, 250, 252, 0.94));
}

.json-preview {
  min-height: 286px;
  max-height: 360px;
  overflow: auto;
  padding: 10px 0;
  text-align: left;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.65;
  color: #1e293b;
}

.json-preview--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  text-align: center;
}

.json-preview__line {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  min-height: 20px;
}

.json-preview__line:hover {
  background: rgba(59, 130, 246, 0.06);
}

.json-preview__line-no {
  padding: 0 12px 0 8px;
  color: #94a3b8;
  text-align: right;
  user-select: none;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
}

.json-preview__code {
  padding: 0 14px;
  white-space: pre;
}

.json-token--key {
  color: #2563eb;
}

.json-token--string {
  color: #0f766e;
}

.json-token--number {
  color: #9333ea;
}

.json-token--literal {
  color: #dc2626;
}

.json-editor-shell {
  display: flex;
  min-height: 286px;
  max-height: 360px;
  text-align: left;
}

.json-editor-gutter {
  flex: 0 0 54px;
  overflow: hidden;
  padding: 14px 0;
  color: #94a3b8;
  background: rgba(226, 232, 240, 0.32);
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.65;
  user-select: none;
}

.json-editor-gutter__inner {
  display: flex;
  flex-direction: column;
  transition: transform 0.02s linear;
}

.json-editor-gutter span {
  height: 19.8px;
  padding-right: 12px;
  text-align: right;
}

.json-editor {
  flex: 1;
  border: 0;
  resize: vertical;
  min-height: 286px;
  max-height: 360px;
  padding: 14px 16px;
  color: #1e293b;
  background: transparent;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.65;
  letter-spacing: 0.01em;
  outline: none;
  box-sizing: border-box;
}

.json-editor:focus {
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.json-editor::placeholder {
  color: #94a3b8;
}

.tab-row {
  padding: 14px 0;
}

.config-switcher {
  display: inline-flex;
  gap: 0;
  padding: 14px 0 10px;
}

.tab-row:after,
.tab-row:before {
  display: table;
  content: "";
}

.tab-row:after {
  clear: both;
}

.tips {
  font-size: 12px;
  margin: 0;
  color: #aaaaaa;
  line-height: 1.4;
  padding: 5px 15px;
}

.reward-tips {
  padding: 0 50px;
  margin-top: 5px;
}

.config-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 22px 20px;
  background: rgba(248, 250, 252, 0.7);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
}

.btn {
  display: inline-block;
  line-height: 1;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.88);
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin: 0;
  outline: none;
  border: 1px solid #dbe4f0;
  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease, border-color 0.16s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.btn--ghost {
  color: #64748b;
  background: rgba(255, 255, 255, 0.7);
}

.btn--primary {
  min-width: 132px;
  color: #ffffff;
  border-color: rgba(37, 99, 235, 0.8);
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
}

.btn--success {
  border-color: rgba(22, 163, 74, 0.74);
  background: linear-gradient(135deg, #16a34a, #22c55e);
  box-shadow: 0 10px 20px rgba(22, 163, 74, 0.16);
}
.success {
  color: #4eb61b;
  border-color: #4eb61b;
}

.darkMode .config-box {
  color: rgba($color: #ffffff, $alpha: 0.72);
  background: linear-gradient(180deg, #171b22 0%, #1d222b 100%);
  border-color: rgba($color: #ffffff, $alpha: 0.08);
  .btn {
    background-color: rgba($color: #ffffff, $alpha: 0.08);
    color: rgba($color: #ffffff, $alpha: 0.72);
    border: 1px solid rgba($color: #ffffff, $alpha: 0.1);
  }

  .config-actions {
    background: rgba($color: #ffffff, $alpha: 0.04);
    border-top-color: rgba($color: #ffffff, $alpha: 0.08);
  }

  .json-editor-frame {
    border-color: rgba($color: #ffffff, $alpha: 0.1);
    background: linear-gradient(180deg, rgba($color: #ffffff, $alpha: 0.06), rgba($color: #ffffff, $alpha: 0.03));
    box-shadow: inset 0 1px 0 rgba($color: #ffffff, $alpha: 0.05), 0 10px 24px rgba(0, 0, 0, 0.18);
  }

  .json-preview,
  .json-editor {
    color: rgba($color: #ffffff, $alpha: 0.84);
    background: transparent;
  }

  .json-editor::placeholder {
    color: rgba($color: #ffffff, $alpha: 0.38);
  }

  .json-preview__line:hover {
    background: rgba($color: #60a5fa, $alpha: 0.1);
  }

  .json-preview__line-no,
  .json-editor-gutter {
    color: rgba($color: #ffffff, $alpha: 0.38);
    border-right-color: rgba($color: #ffffff, $alpha: 0.08);
  }

  .json-editor-gutter {
    background: rgba($color: #ffffff, $alpha: 0.04);
  }

  .json-token--key {
    color: #93c5fd;
  }

  .json-token--string {
    color: #5eead4;
  }

  .json-token--number {
    color: #d8b4fe;
  }

  .json-token--literal {
    color: #fca5a5;
  }

  .btn--ghost {
    color: rgba($color: #ffffff, $alpha: 0.68);
    background: rgba($color: #ffffff, $alpha: 0.06);
  }

  .btn--primary,
  .btn--success {
    color: #ffffff;
    border: 0;
  }

  .success {
    border: 1px solid rgba($color: #35c46a, $alpha: 0.4);
    background-color: rgba($color: #35c46a, $alpha: 0.16);
  }

  .config-desc {
    color: rgba($color: #ffffff, $alpha: 0.6);
  }

  button {
    background-color: rgba($color: #ffffff, $alpha: 0.08);
    color: rgba($color: #ffffff, $alpha: 0.72);
    border: 1px solid rgba($color: #ffffff, $alpha: 0.1);
  }

  button.checked {
    color: rgba($color: #ffffff, $alpha: 0.96);
    border: 1px solid rgba($color: #5aa4ff, $alpha: 0.3);
    background-color: rgba($color: #5aa4ff, $alpha: 0.2);
  }
}

</style>
