<template>
  <el-dialog
    :visible.sync="visibleProxy"
    custom-class="transaction-dialog"
    title="仓位管理"
    width="560px"
    :append-to-body="false"
    :modal="true"
    :close-on-click-modal="false"
    :lock-scroll="true"
    :show-close="true"
    top="12px"
    @close="closeHandler"
  >
    <div v-if="activeTransactionFund" class="transaction-dialog__body">
      <div class="transaction-dialog__header">
        <div class="transaction-dialog__headline">
          <div class="transaction-dialog__title-row">
            <div class="transaction-dialog__title">{{ activeTransactionFund.name }}</div>
            <span class="transaction-dialog__mode-chip" :class="modalTransactionOperation === 'reduce' ? 'is-reduce' : 'is-add'">
              {{ modalTransactionOperation === 'reduce' ? '减仓模式' : '加仓模式' }}
            </span>
          </div>
          <div class="transaction-dialog__subtitle">{{ activeTransactionFund.fundcode }}</div>
        </div>
      </div>

      <div class="transaction-dialog__summary-strip" aria-label="仓位摘要">
        <div class="transaction-dialog__summary-block">
          <span>当前份额</span>
          <strong>{{ roundValueHandler(activeTransactionFund.num, 2) }}</strong>
        </div>
        <div class="transaction-dialog__summary-block">
          <span>持仓金额</span>
          <strong>{{ formatMoneyDisplayHandler(activeTransactionFund.amount) }}</strong>
        </div>
        <div class="transaction-dialog__summary-block">
          <span>持仓成本</span>
          <strong>{{ formatMoneyDisplayHandler(activeTransactionFund.holdingCost) }}</strong>
        </div>
      </div>

      <div class="transaction-dialog__mode edit-position-toggle" :style="positionToggleStyle" role="group" aria-label="加减仓操作">
        <span class="edit-position-toggle__cursor" aria-hidden="true"></span>
        <button
          type="button"
          class="edit-position-toggle__btn"
          :class="{ 'is-active': modalTransactionOperation === 'add' }"
          @mouseenter="setPositionTogglePreviewHandler('add')"
          @mouseleave="clearPositionTogglePreviewHandler"
          @focus="setPositionTogglePreviewHandler('add')"
          @blur="clearPositionTogglePreviewHandler"
          @click="switchModalTransactionOperationHandler('add')"
        >
          加仓
        </button>
        <button
          type="button"
          class="edit-position-toggle__btn"
          :class="{ 'is-active': modalTransactionOperation === 'reduce' }"
          @mouseenter="setPositionTogglePreviewHandler('reduce')"
          @mouseleave="clearPositionTogglePreviewHandler"
          @focus="setPositionTogglePreviewHandler('reduce')"
          @blur="clearPositionTogglePreviewHandler"
          @click="switchModalTransactionOperationHandler('reduce')"
        >
          减仓
        </button>
      </div>

      <div class="transaction-dialog__form-card">
        <div class="transaction-dialog__form">
          <div class="transaction-dialog__entry-stack">
            <label class="transaction-dialog__field transaction-dialog__field--date transaction-dialog__field--panel">
              <span class="transaction-dialog__field-label">交易日期</span>
              <el-date-picker
                v-model="modalTransactionDraft.date"
                type="date"
                size="mini"
                value-format="yyyy-MM-dd"
                format="yyyy-MM-dd"
                placeholder="选择日期"
                :clearable="false"
                :editable="false"
                :append-to-body="false"
                popper-class="transaction-dialog-date-popper"
                class="transaction-dialog__date-picker"
              />
            </label>
            <div class="transaction-dialog__entry-main">
              <label v-if="modalTransactionOperation === 'add'" class="transaction-dialog__field transaction-dialog__field--panel transaction-dialog__field--hero">
                <span class="transaction-dialog__field-label">加仓金额</span>
                <input
                  v-model="modalTransactionDraft.amount"
                  type="text"
                  class="transaction-dialog__input transaction-dialog__input--hero"
                  placeholder="请输入金额"
                />
              </label>
              <label v-else class="transaction-dialog__field transaction-dialog__field--panel transaction-dialog__field--hero transaction-dialog__field--hero-reduce">
                <span class="transaction-dialog__field-label">减仓份额</span>
                <div class="transaction-dialog__reduce-field">
                  <input
                    v-model="modalTransactionDraft.shares"
                    type="text"
                    class="transaction-dialog__input transaction-dialog__input--hero"
                    placeholder="请输入份额"
                  />
                  <div
                    class="transaction-dialog__preset-row"
                    :class="{ 'has-active-cursor': !!visibleReduceSharePresetKey }"
                    :style="presetCursorStyle"
                    role="group"
                    aria-label="减仓快捷比例"
                  >
                    <span v-if="visibleReduceSharePresetKey" class="transaction-dialog__preset-cursor" aria-hidden="true"></span>
                    <button
                      v-for="preset in reduceSharePresets"
                      :key="preset.key"
                      type="button"
                      :class="['transaction-dialog__preset-btn', { 'is-active': activeReduceSharePresetKey === preset.key }]"
                      @mouseenter="setReduceSharePresetPreviewHandler(preset.key)"
                      @mouseleave="clearReduceSharePresetPreviewHandler"
                      @focus="setReduceSharePresetPreviewHandler(preset.key)"
                      @blur="clearReduceSharePresetPreviewHandler"
                      @click="applyReduceSharePresetHandler(preset.ratio)"
                    >
                      {{ preset.label }}
                    </button>
                  </div>
                </div>
              </label>
              <label class="transaction-dialog__field transaction-dialog__field--panel transaction-dialog__field--support">
                <span class="transaction-dialog__field-label">手续费</span>
                <input
                  v-model="modalTransactionDraft.fee"
                  type="text"
                  class="transaction-dialog__input transaction-dialog__input--support"
                  placeholder="可填 0"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div
        class="transaction-dialog__notice"
        :class="[
          modalTransactionMessage
            ? modalTransactionMessageType === 'error'
              ? 'is-error'
              : 'is-success'
            : 'is-default',
        ]"
      >
        <div class="transaction-dialog__notice-row">
          <div class="transaction-dialog__notice-copy">
            <div class="transaction-dialog__notice-main">
              {{ modalTransactionMessage || modalTransactionValidation.message }}
            </div>
            <div class="transaction-dialog__notice-meta">
              <template v-if="modalTransactionOperation === 'add'">
                将按当前净值折算份额，并自动刷新持仓成本。
              </template>
              <template v-else>
                最多可减 {{ roundValueHandler(activeTransactionFund.num, 2) }} 份，保存后会自动重算剩余持仓成本。
              </template>
            </div>
          </div>
          <div class="transaction-dialog__actions transaction-dialog__actions--inline">
            <button type="button" class="btn primary" @click="saveModalTransactionHandler">保存记录</button>
            <button type="button" class="btn" @click="resetModalTransactionDraftHandler">重置</button>
          </div>
        </div>
      </div>

      <div class="transaction-dialog__list">
        <div class="transaction-dialog__list-head">
          <div class="transaction-dialog__list-title">历史记录</div>
          <div class="transaction-dialog__list-count">{{ activeTransactionList.length }} 条</div>
        </div>
        <div v-if="activeTransactionList.length" class="edit-transaction-list edit-transaction-list--dialog">
          <div
            v-for="transaction in activeTransactionList"
            :key="transaction.id"
            class="edit-transaction-list__item"
          >
            <span class="edit-transaction-list__badge" :class="transaction.type === 'reduce' ? 'is-reduce' : 'is-add'">
              {{ transaction.type === 'reduce' ? '减' : '加' }}
            </span>
            <div class="edit-transaction-list__content">
              <div class="edit-transaction-list__headline">
                <span class="edit-transaction-list__primary">
                  {{ transaction.type === 'reduce' ? '减仓' : '加仓' }}
                  <template v-if="transaction.type === 'reduce'">
                    {{ roundValueHandler(transaction.shares, 2) }} 份
                  </template>
                  <template v-else>
                    {{ formatMoneyDisplayHandler(transaction.amount) }}
                  </template>
                </span>
                <span class="edit-transaction-list__date">{{ transaction.date || '未设日期' }}</span>
              </div>
              <div class="edit-transaction-list__meta">
                <span>手续费 {{ formatMoneyDisplayHandler(transaction.fee) }}</span>
                <span v-if="transaction.nav">净值 {{ roundValueHandler(transaction.nav, 4) }}</span>
              </div>
            </div>
            <button
              type="button"
              class="edit-transaction-list__remove"
              aria-label="删除交易记录"
              @click="removeModalTransactionHandler(transaction.id)"
            >
              <span class="edit-transaction-list__remove-icon" aria-hidden="true"></span>
            </button>
          </div>
        </div>
        <div v-else class="transaction-dialog__empty">还没有交易记录，先添加一条吧。</div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "TransactionDialog",
  props: {
    visible: Boolean,
    activeTransactionFund: {
      type: Object,
      default: null,
    },
    activeTransactionList: {
      type: Array,
      default: () => [],
    },
    modalTransactionOperation: {
      type: String,
      default: "add",
    },
    modalTransactionDraft: {
      type: Object,
      default: () => ({}),
    },
    modalTransactionMessage: {
      type: String,
      default: "",
    },
    modalTransactionMessageType: {
      type: String,
      default: "success",
    },
    modalTransactionValidation: {
      type: Object,
      default: () => ({ valid: false, message: "" }),
    },
    positionToggleStyle: {
      type: Object,
      default: () => ({}),
    },
    presetCursorStyle: {
      type: Object,
      default: () => ({}),
    },
    visibleReduceSharePresetKey: {
      type: String,
      default: "",
    },
    activeReduceSharePresetKey: {
      type: String,
      default: "",
    },
    reduceSharePresets: {
      type: Array,
      default: () => [],
    },
    closeHandler: {
      type: Function,
      required: true,
    },
    switchModalTransactionOperationHandler: {
      type: Function,
      required: true,
    },
    setPositionTogglePreviewHandler: {
      type: Function,
      required: true,
    },
    clearPositionTogglePreviewHandler: {
      type: Function,
      required: true,
    },
    setReduceSharePresetPreviewHandler: {
      type: Function,
      required: true,
    },
    clearReduceSharePresetPreviewHandler: {
      type: Function,
      required: true,
    },
    applyReduceSharePresetHandler: {
      type: Function,
      required: true,
    },
    saveModalTransactionHandler: {
      type: Function,
      required: true,
    },
    resetModalTransactionDraftHandler: {
      type: Function,
      required: true,
    },
    removeModalTransactionHandler: {
      type: Function,
      required: true,
    },
    formatMoneyDisplayHandler: {
      type: Function,
      required: true,
    },
    roundValueHandler: {
      type: Function,
      required: true,
    },
  },
  computed: {
    visibleProxy: {
      get() {
        return this.visible;
      },
      set(nextVisible) {
        if (!nextVisible) {
          this.closeHandler();
        }
      },
    },
  },
};
</script>
