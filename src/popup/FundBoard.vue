<template>
  <div>
    <div
      v-if="isGetStorage"
      v-loading="loadingList"
      :element-loading-background="loadingBackground"
      class="table-row fund-board"
      :class="{ 'fund-board--browse': !isEdit, 'fund-board--edit': isEdit }"
      style="min-height:160px"
    >
      <div v-if="!loadingList && listError" class="panel-state panel-state--error">
        <div class="panel-state__title">基金数据加载失败</div>
        <div class="panel-state__desc">{{ listError }}</div>
        <button class="btn" @click="refreshHandler">重新加载</button>
      </div>
      <div v-else-if="!loadingList && !dataList.length" class="panel-state">
        <div class="panel-state__title">当前分组暂无基金</div>
        <div class="panel-state__desc">
          {{ isEdit ? '可以直接搜索并添加基金到当前分组。' : '切换分组或进入编辑模式添加基金。' }}
        </div>
      </div>
      <template v-else>
        <div v-if="isEdit" class="fund-board__edit-head">
          <div class="fund-board__edit-head-copy">
            <div class="fund-board__edit-eyebrow">PORTFOLIO EDIT MODE</div>
            <div class="fund-board__edit-title">持仓控制面板</div>
            <div class="fund-board__edit-meta">拖拽排序已启用 · 单击仓位管理进入记录维护</div>
          </div>
          <div class="fund-board__edit-badge">{{ dataList.length }} / {{ fundListGroup.length || 1 }}</div>
        </div>
        <table :class="[tableHeight, { 'fund-table--browse': !isEdit, 'fund-table--edit': isEdit }]">
          <thead>
            <tr>
              <th v-if="isEdit" class="fund-table__delete-anchor"></th>
              <th class="align-center">
                {{ isEdit ? '基金名称' : '基金名称（' + dataList.length + '）' }}
              </th>
              <template v-if="isEdit">
                <th class="fund-table__code">基金代码</th>
                <th class="fund-table__input">成本价</th>
                <th class="fund-table__input">持有份额</th>
                <th @click="sortListHandler('amount')" class="pointer">
                  持有额
                  <span :class="sortType.amount" class="down-arrow"></span>
                </th>
                <th class="fund-table__operation">仓位管理</th>
                <th class="fund-table__focus-col">特别关注</th>
                <th @click="sortListHandler('costGains')" class="pointer">
                  持有收益
                  <span :class="sortType.costGains" class="down-arrow"></span>
                </th>
              </template>
              <template v-else>
                <th v-if="showGSZ">估算净值</th>
                <th v-if="showAmount" @click="sortListHandler('amount')" class="pointer">
                  持有额
                  <span :class="sortType.amount" class="down-arrow"></span>
                </th>
                <th v-if="showCost" @click="sortListHandler('costGains')" class="pointer">
                  持有收益
                  <span :class="sortType.costGains" class="down-arrow"></span>
                </th>
                <th v-if="showCostRate" @click="sortListHandler('costGainsRate')" class="pointer">
                  持有收益率
                  <span :class="sortType.costGainsRate" class="down-arrow"></span>
                </th>
                <th @click="sortListHandler('gszzl')" class="pointer">
                  最新涨跌幅
                  <span :class="sortType.gszzl" class="down-arrow"></span>
                </th>
                <th v-if="showGains" @click="sortListHandler('gains')" class="pointer">
                  当日收益
                  <span :class="sortType.gains" class="down-arrow"></span>
                </th>
                <th>更新时间</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(el, index) in displayDataList"
              :key="el.fundcode"
              :draggable="isEdit"
              :class="[
                drag,
                {
                  'fund-row--focused': !isEdit && isFocusedFundHandler(el.fundcode),
                },
              ]"
              @dragstart="handleDragStartHandler($event, el)"
              @dragover.prevent="handleDragOverHandler($event, el)"
              @dragenter="handleDragEnterHandler($event, el, index)"
              @dragend="handleDragEndHandler($event, el)"
            >
              <td v-if="isEdit" class="fund-table__delete-anchor">
                <button
                  class="edit-delete-btn"
                  type="button"
                  aria-label="删除基金"
                  title="删除基金"
                  @click="deleteFundHandler(el.fundcode)"
                >
                  <span class="edit-delete-btn__icon" aria-hidden="true"></span>
                </button>
              </td>
              <td
                :class="isEdit ? 'fundName-noclick align-left' : 'fundName align-left'"
                :title="el.name"
                @click.stop="!isEdit && openFundDetailHandler(el)"
              >
                <div class="fund-cell">
                  <div class="fund-cell__name">{{ el.name }}</div>
                  <div v-if="!isEdit" class="fund-cell__meta-wrap">
                    <div class="fund-cell__meta-row">
                      <div class="fund-cell__meta">{{ el.fundcode }}</div>
                      <div v-if="isFocusedFundHandler(el.fundcode)" class="fund-cell__focus-badge">
                        <span class="fund-cell__focus-badge-dot" aria-hidden="true"></span>
                        特别关注
                      </div>
                    </div>
                  </div>
                </div>
              </td>
              <template v-if="isEdit">
                <td class="fund-table__code">{{ el.fundcode }}</td>
                <td class="fund-table__input">
                  <input
                    v-model="el.cost"
                    class="btn num"
                    placeholder="持仓成本价"
                    type="text"
                    @input="changeCostHandler(el, index)"
                  />
                </td>
                <td class="fund-table__input">
                  <input
                    v-model="el.num"
                    class="btn num"
                    placeholder="输入持有份额"
                    type="text"
                    @input="changeNumHandler(el, index)"
                  />
                </td>
                <td>{{ formatMoneyDisplayHandler(el.amount) }}</td>
                <td class="fund-table__operation">
                  <button type="button" class="edit-transaction-trigger" @click="openTransactionDialogHandler(el)">
                    <span class="edit-transaction-trigger__title">仓位管理</span>
                    <span class="edit-transaction-trigger__meta">{{ visibleTransactionsHandler(el).length }} 条</span>
                  </button>
                </td>
                <td class="fund-table__focus-col">
                  <button
                    type="button"
                    class="edit-focus-btn"
                    :class="{ 'is-active': el.fundcode == realtimeFundcode }"
                    :title="el.fundcode == realtimeFundcode ? '取消特别关注' : '设为特别关注'"
                    @click="focusFundHandler(el.fundcode)"
                  >
                    {{ el.fundcode == realtimeFundcode ? '已关注' : '关注' }}
                  </button>
                </td>
                <td :class="resolveTrendClassHandler(el.costGains)">
                  {{ formatMoneyDisplayHandler(el.costGains) }}
                </td>
              </template>
              <template v-else>
                <td v-if="showGSZ">{{ el.gsz }}</td>
                <td v-if="showAmount">{{ formatMoneyDisplayHandler(el.amount) }}</td>
                <td v-if="showCost" :class="resolveTrendClassHandler(el.costGains)">
                  {{ formatMoneyDisplayHandler(el.costGains) }}
                </td>
                <td v-if="showCostRate" :class="resolveTrendClassHandler(el.costGainsRate)">
                  {{ formatPercentDisplayHandler(el.cost > 0 ? el.costGainsRate : null) }}
                </td>
                <td :class="[resolveTrendClassHandler(el.gszzl, el.hasReplace), el.hasReplace ? 'is-stale' : '']">
                  <div class="change-cell">
                    <div class="change-cell__today">
                      {{ el.hasReplace ? '未更新' : `最新：${el.gszzl}%` }}
                    </div>
                     <p
                        v-if="!el.hasReplace && showPrevGszzl && el.prevGszzl !== '' && el.prevGszzl !== null && el.prevGszzl !== undefined"
                        :class="['sub-change', el.prevGszzl >= 0 ? 'up' : 'down']"
                        :title="`次值（上个交易日）：${el.prevGszzl}%`"
                      >
                        次值：{{ el.prevGszzl }}%
                      </p>
                  </div>
                </td>
                <td v-if="showGains" :class="[resolveTrendClassHandler(el.gains, el.hasReplace), el.hasReplace ? 'is-stale' : '']">
                  {{ el.hasReplace ? '--' : formatMoneyDisplayHandler(el.gains) }}
                </td>
                <td :class="{ 'is-stale': el.hasReplace }">
                  {{ formatDisplayTimeHandler(el) }}
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
    <div v-else class="table-row fund-board fund-board--browse popup-skeleton-board">
      <div class="popup-skeleton-board__header">
        <div class="popup-skeleton-line popup-skeleton-line--title"></div>
        <div class="popup-skeleton-chip">正在初始化</div>
      </div>
      <div class="popup-skeleton-board__table">
        <div
          v-for="index in 4"
          :key="`fund-row-skeleton-${index}`"
          class="popup-skeleton-fund-row"
        >
          <div class="popup-skeleton-fund-row__main">
            <div class="popup-skeleton-line popup-skeleton-line--name"></div>
            <div class="popup-skeleton-line popup-skeleton-line--code"></div>
          </div>
          <div class="popup-skeleton-fund-row__metrics">
            <div class="popup-skeleton-line popup-skeleton-line--metric"></div>
            <div class="popup-skeleton-line popup-skeleton-line--metric"></div>
            <div class="popup-skeleton-line popup-skeleton-line--metric"></div>
            <div class="popup-skeleton-line popup-skeleton-line--metric"></div>
          </div>
        </div>
      </div>
      <div class="popup-skeleton-board__foot">首次打开正在同步设置与基金数据…</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FundBoard",
  props: {
    isGetStorage: Boolean,
    loadingList: Boolean,
    loadingBackground: {
      type: String,
      default: "",
    },
    listError: {
      type: String,
      default: "",
    },
    dataList: {
      type: Array,
      default: () => [],
    },
    displayDataList: {
      type: Array,
      default: () => [],
    },
    fundListGroup: {
      type: Array,
      default: () => [],
    },
    isEdit: Boolean,
    tableHeight: {
      type: String,
      default: "",
    },
    drag: {
      type: String,
      default: "",
    },
    sortType: {
      type: Object,
      default: () => ({}),
    },
    showGSZ: Boolean,
    showAmount: Boolean,
    showCost: Boolean,
    showCostRate: Boolean,
    showPrevGszzl: Boolean,
    showGains: Boolean,
    realtimeFundcode: {
      type: String,
      default: "",
    },
    refreshHandler: {
      type: Function,
      required: true,
    },
    sortListHandler: {
      type: Function,
      required: true,
    },
    isFocusedFundHandler: {
      type: Function,
      required: true,
    },
    handleDragStartHandler: {
      type: Function,
      required: true,
    },
    handleDragOverHandler: {
      type: Function,
      required: true,
    },
    handleDragEnterHandler: {
      type: Function,
      required: true,
    },
    handleDragEndHandler: {
      type: Function,
      required: true,
    },
    deleteFundHandler: {
      type: Function,
      required: true,
    },
    openFundDetailHandler: {
      type: Function,
      required: true,
    },
    changeCostHandler: {
      type: Function,
      required: true,
    },
    changeNumHandler: {
      type: Function,
      required: true,
    },
    openTransactionDialogHandler: {
      type: Function,
      required: true,
    },
    focusFundHandler: {
      type: Function,
      required: true,
    },
    visibleTransactionsHandler: {
      type: Function,
      required: true,
    },
    resolveTrendClassHandler: {
      type: Function,
      required: true,
    },
    formatMoneyDisplayHandler: {
      type: Function,
      required: true,
    },
    formatPercentDisplayHandler: {
      type: Function,
      required: true,
    },
    formatDisplayTimeHandler: {
      type: Function,
      required: true,
    },
  },
};
</script>
