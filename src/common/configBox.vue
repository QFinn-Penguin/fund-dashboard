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
        <el-input
          type="textarea"
          :rows="15"
          placeholder="请输入内容"
          v-model="exportConfigStr"
        >
        </el-input>
        <input
          class="btn success"
          type="button"
          value="复制到剪贴板"
          @click="copy"
        />
      </div>
      <div class="tab-content" v-else>
        <p class="config-desc">导入配置会覆盖当前内容，请确认文本来源可靠。</p>
        <el-input
          type="textarea"
          :rows="15"
          placeholder="请在此输入框粘贴配置文本"
          v-model="inputConfigStr"
        >
        </el-input>
        <input
          class="btn success"
          type="button"
          value="提交配置文本"
          @click="importInput"
        />
      </div>

      <div class="tab-row">
        <input class="btn" type="button" value="返回" @click="close" />
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
    };
  },
  watch: {},
  mounted() {},
  methods: {
    init() {
      this.configShadow = true;
      this.inputConfigStr = null;
      getExtensionStorage(null, (res) => {
        this.exportConfigStr = buildExportConfigText(res);
      });
    },
    close() {
      this.configShadow = false;
      this.$emit("close", false);
    },
    exportConfig() {},
    copy() {
      if (!this.exportConfigStr) {
        return;
      }

      const onSuccess = () => {
        this.$message({
          message: "已复制到剪贴板，请自行保存！",
          type: "success",
          center: true,
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
          this.$message({
            message: "复制失败，请手动复制文本！",
            type: "error",
            center: true,
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
        this.$message({
          message: validationResult.message,
          type: "error",
          center: true,
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

        this.$message({
          message: "恭喜,导入配置成功！",
          type: "success",
          center: true,
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
}

.config-box {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  border-radius: 16px;
  width: 500px;
  margin: 0 auto;
  text-align: center;
  line-height: 1;
  vertical-align: middle;
  font-size: 0;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
  .tab-content {
    .btn {
      margin: 15px 0 5px;
    }
  }
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

.btn {
  display: inline-block;
  line-height: 1;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.88);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  margin: 0 5px;
  outline: none;
  border: 1px solid #dbe4f0;
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
