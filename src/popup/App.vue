<template>
    <div
      id="app"
      class="container"
      ref="app"
      :class="containerClass"
      :style="containerInlineStyles"
    >
    <div class="dashboard-shell">
      <div
        class="market-overview market-overview--market"
        v-if="isGetStorage"
        v-loading="loadingInd"
        :element-loading-background="
          darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'
        "
        :style="seciList.length > 0 ? { minHeight: '55px' } : {}"
      >
          <div
            v-for="(el, index) in indFundData"
            :draggable="isEdit"
            class="tab-col indFund market-card"
            :class="drag"
            :key="el.f12"
            @click.stop="!isEdit && indDetail(el)"
          @dragstart="handleDragStart($event, el)"
          @dragover.prevent="handleDragOver($event, el)"
          @dragenter="handleDragEnter($event, el, index)"
          @dragend="handleDragEnd($event, el)"
          >
          <h5 class="market-card__label">
            {{ el.f14 }}
            <span
              v-if="isEdit"
              @click="dltIndFund(index)"
              class="dltBtn edit red btn"
              >✖</span
            >
          </h5>
          <p class="market-card__value" :class="el.f3 >= 0 ? 'up' : 'down'">
            {{ el.f2
            }}<input
              v-if="isEdit && BadgeContent == 3"
              @click="sltInd(el)"
              :class="el.f13 + '.' + el.f12 == RealtimeIndcode ? 'slt' : ''"
              class="btn edit"
              style="margin-left:5px"
              value="✔"
              type="button"
            />
          </p>
          <p class="market-card__meta" :class="el.f3 >= 0 ? 'up' : 'down'">
            {{ el.f4 }}&nbsp;&nbsp;{{ el.f3 }}%
          </p>
        </div>
        <div v-if="isEdit && indFundData.length < 4" class="tab-col">
          <div
            v-if="!showAddSeciInput"
            class="addSeci"
            @click="() => (showAddSeciInput = true)"
          >
            添加
          </div>
          <div v-else>
            <div style="padding-top:2px">
              <el-select
                size="mini"
                :popper-append-to-body="false"
                v-model="sltSeci"
                style="width:110px"
                placeholder="请选择"
              >
                <el-option
                  v-for="item in userSeciList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </div>
            <div style="margin-top:4px">
              <input
                class="btn"
                type="button"
                value="取消"
                @click="() => (showAddSeciInput = false)"
              />
              <input class="btn" type="button" value="确定" @click="saveSeci" />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="market-overview market-overview--market popup-skeleton-row">
        <div v-for="index in 4" :key="`market-skeleton-${index}`" class="tab-col market-card popup-skeleton-card">
          <div class="popup-skeleton-line popup-skeleton-line--label"></div>
          <div class="popup-skeleton-line popup-skeleton-line--value"></div>
          <div class="popup-skeleton-line popup-skeleton-line--meta"></div>
        </div>
      </div>
      <div v-if="isGetStorage" class="overview-row market-overview">
        <div
          class="tab-col overview-card overview-card--primary overview-card--clickable"
          @click="scrollActiveGroupIntoView"
        >
          <div class="overview-card__label">当前分组</div>
          <div class="overview-card__value">{{ activeGroupLabel }}</div>
          <div class="overview-card__meta">共 {{ dataList.length }} 只基金</div>
        </div>
        <div class="tab-col overview-card overview-card--toggle" :class="overviewDayClass">
          <div class="overview-card__label overview-card__label--inline">
            <span class="overview-card__label-text">当日收益</span>
            <button
              v-if="showGains"
              class="overview-card__toggle overview-card__toggle--inline"
              :title="hideOverviewDayGain ? '显示金额' : '隐藏金额'"
              @click="toggleOverviewDayGain"
            >
              <span
                class="overview-card__toggle-icon"
                :class="{ 'is-masked': hideOverviewDayGain }"
                aria-hidden="true"
              ></span>
            </button>
          </div>
          <div class="overview-card__value">{{ overviewDayGainValue }}</div>
          <div class="overview-card__meta">{{ overviewDayGainMeta }}</div>
        </div>
        <div class="tab-col overview-card" :class="overviewCostClass">
          <div class="overview-card__label">持有收益</div>
          <div class="overview-card__value">{{ overviewCostGainValue }}</div>
          <div class="overview-card__meta">{{ overviewCostGainMeta }}</div>
        </div>
        <div
          class="tab-col overview-card overview-card--clickable overview-card--status"
          :class="overviewStatusClass"
          :title="isLiveUpdate ? '正在实时更新，点击暂停' : '已暂停，点击切换为实时更新'"
          @click="isDuringDate && changeLiveUpdate()"
        >
          <div class="overview-card__label">运行状态</div>
          <div class="overview-card__value">{{ overviewStatusText }}</div>
          <div class="overview-card__meta">{{ overviewUpdateText }}</div>
        </div>
      </div>
      <div v-else class="overview-row market-overview popup-skeleton-row">
        <div
          v-for="index in 4"
          :key="`overview-skeleton-${index}`"
          class="tab-col overview-card popup-skeleton-card"
          :class="{ 'overview-card--primary': index === 1 }"
        >
          <div class="popup-skeleton-line popup-skeleton-line--label"></div>
          <div class="popup-skeleton-line popup-skeleton-line--value"></div>
          <div class="popup-skeleton-line popup-skeleton-line--meta"></div>
        </div>
      </div>
      <div v-if="isEdit" class="input-row edit-command-bar">
        <div class="edit-command-bar__intro">
          <div class="edit-command-bar__eyebrow">EDIT CONTROL DECK</div>
          <div class="edit-command-bar__title">添加基金到当前分组</div>
          <div class="edit-command-bar__meta">
            当前分组：{{ activeGroupLabel }}
            <span>·</span>
            共 {{ dataList.length }} 只基金
          </div>
        </div>
        <div class="edit-command-bar__actions">
          <div class="edit-command-bar__add-group">
            <el-select
              v-model="fundcode"
              multiple
              filterable
              :popper-append-to-body="false"
              remote
              size="mini"
              reserve-keyword
              @visible-change="selectChange"
              placeholder="请输入基金编码，支持按名称或编码搜索"
              :remote-method="remoteMethod"
              :loading="loading"
              no-data-text="未找到匹配基金"
              no-match-text="未找到匹配基金"
              class="edit-command-bar__select"
            >
              <el-option
                v-for="item in searchOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
                :disabled="item.existsInCurrentGroup"
              >
                <div class="fund-search-option">
                  <div class="fund-search-option__main">
                    <span class="fund-search-option__label">{{ item.label }}</span>
                    <span class="fund-search-option__code">{{ item.value }}</span>
                  </div>
                  <div
                    v-if="item.groupHint"
                    class="fund-search-option__meta"
                    :class="{ 'fund-search-option__meta--disabled': item.existsInCurrentGroup }"
                    :title="item.groupHintTitle || ''"
                  >
                    {{ item.groupHintBadge }}
                  </div>
                </div>
              </el-option>
            </el-select>
            <input @click="save" class="btn edit-command-bar__confirm" type="button" value="加入分组" />
          </div>
          <input
            class="btn edit-command-bar__done"
            type="button"
            value="完成编辑"
            @click="toggleEditMode"
          />
        </div>
      </div>
      <div
        v-if="isGetStorage && fundListGroup.length > 1"
        class="group-row group-switcher"
        :class="{ 'group-switcher--edit': isEdit }"
      >
        <div v-if="isEdit" class="group-switcher__status">
          <span class="group-switcher__status-label">分组轨道</span>
          <strong>{{ activeGroupLabel }}</strong>
        </div>
        <button
          class="btn group-nav-btn"
          :disabled="!canScrollGroupViewportLeft"
          @click="scrollGroupViewport(-1)"
        >
          ‹
        </button>
        <div class="group-strip-viewport" ref="groupStripViewport">
          <div class="group-strip" ref="groupStrip">
            <span
              class="group-strip__cursor"
              :class="{ 'is-visible': groupCursorVisible }"
              :style="groupCursorStyle"
              aria-hidden="true"
            ></span>
              <button
                v-for="(group, index) in fundListGroup"
                :key="`group-${index}`"
                class="btn group-btn"
                :class="index === currentGroupIndex ? 'primary' : ''"
                :ref="`groupBtn-${index}`"
                @mouseenter="setGroupCursorPreview(index)"
                @mouseleave="clearGroupCursorPreview"
                @focus="setGroupCursorPreview(index)"
                @blur="clearGroupCursorPreview"
                @click="switchGroup(index)"
              >
                {{ getGroupLabel(group, index) }}
              </button>
          </div>
        </div>
        <button
          class="btn group-nav-btn"
          :disabled="!canScrollGroupViewportRight"
          @click="scrollGroupViewport(1)"
        >
          ›
        </button>
      </div>
      <div v-if="showPagination" class="pagination-row pagination-row--floating-summary">
        <div class="pagination-row__summary">
          <span class="pagination-row__pill">第 {{ currentPage }} / {{ pageCount }} 页</span>
          <span class="pagination-row__range">当前展示 {{ displayDataList.length }} 只</span>
        </div>
        <div class="pagination-row__actions">
          <button
            class="btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            上一页
          </button>
          <button
            class="btn"
            :disabled="currentPage === pageCount"
            @click="changePage(currentPage + 1)"
          >
            下一页
          </button>
        </div>
      </div>
      <fund-board
        :isGetStorage="isGetStorage"
        :loadingList="loadingList"
        :loadingBackground="darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)'"
        :listError="listError"
        :dataList="dataList"
        :displayDataList="displayDataList"
        :fundListGroup="fundListGroup"
        :isEdit="isEdit"
        :tableHeight="tableHeight"
        :drag="drag"
        :sortType="sortType"
        :showGSZ="showGSZ"
        :showAmount="showAmount"
        :showCost="showCost"
        :showCostRate="showCostRate"
        :showPrevGszzl="showPrevGszzl"
        :showGains="showGains"
        :realtimeFundcode="RealtimeFundcode"
        :refreshHandler="refresh"
        :sortListHandler="sortList"
        :isFocusedFundHandler="isFocusedFund"
        :handleDragStartHandler="handleDragStart"
        :handleDragOverHandler="handleDragOver"
        :handleDragEnterHandler="handleDragEnter"
        :handleDragEndHandler="handleDragEnd"
        :deleteFundHandler="dlt"
        :openFundDetailHandler="fundDetail"
        :changeCostHandler="changeCost"
        :changeNumHandler="changeNum"
        :openTransactionDialogHandler="openTransactionDialog"
        :focusFundHandler="slt"
        :visibleTransactionsHandler="visibleTransactions"
        :resolveTrendClassHandler="resolveTrendClass"
        :formatMoneyDisplayHandler="formatMoneyDisplay"
        :formatPercentDisplayHandler="formatPercentDisplay"
        :formatDisplayTimeHandler="formatDisplayTime"
      />
      <div
        v-if="isGetStorage && !isEdit"
        class="input-row toolbar-row"
        :class="{ 'toolbar-row--browse': !isEdit }"
      >
        <div class="toolbar toolbar--primary">
          <input class="btn" type="button" @click="market" value="行情中心" />
          <button
            class="btn toolbar-refresh"
            :class="{ isRefresh: isRefresh }"
            type="button"
            title="手动刷新数据"
            @click="refresh"
          >
            <span class="toolbar-refresh__icon" aria-hidden="true"></span>
            <span>刷新</span>
          </button>
          <input class="btn" type="button" value="编辑" @click="toggleEditMode" />
        </div>
        <div class="toolbar toolbar--secondary">
          <input class="btn" type="button" value="设置" @click="option" />
          <input
            class="btn primary"
            type="button"
            title="φ(>ω<*)"
            value="打赏"
            @click="reward"
          />
        </div>
      </div>
    </div>

    <transaction-dialog
      :visible="transactionDialogVisible"
      :activeTransactionFund="activeTransactionFund"
      :activeTransactionList="activeTransactionList"
      :modalTransactionOperation="modalTransactionOperation"
      :modalTransactionDraft="modalTransactionDraft"
      :modalTransactionMessage="modalTransactionMessage"
      :modalTransactionMessageType="modalTransactionMessageType"
      :modalTransactionValidation="modalTransactionValidation"
      :positionToggleStyle="positionToggleStyle"
      :presetCursorStyle="presetCursorStyle"
      :visibleReduceSharePresetKey="visibleReduceSharePresetKey"
      :activeReduceSharePresetKey="activeReduceSharePresetKey"
      :reduceSharePresets="reduceSharePresets"
      :closeHandler="closeTransactionDialog"
      :switchModalTransactionOperationHandler="switchModalTransactionOperation"
      :setPositionTogglePreviewHandler="setPositionTogglePreview"
      :clearPositionTogglePreviewHandler="clearPositionTogglePreview"
      :setReduceSharePresetPreviewHandler="setReduceSharePresetPreview"
      :clearReduceSharePresetPreviewHandler="clearReduceSharePresetPreview"
      :applyReduceSharePresetHandler="applyReduceSharePreset"
      :saveModalTransactionHandler="saveModalTransaction"
      :resetModalTransactionDraftHandler="resetModalTransactionDraft"
      :removeModalTransactionHandler="removeModalTransaction"
      :formatMoneyDisplayHandler="formatMoneyDisplay"
      :roundValueHandler="roundValue"
    />
    <market
      v-if="marketVisible"
      :darkMode="darkMode"
      @close="closeCharts"
      ref="marketShadow"
    ></market>
    <component
      :is="popupIndDetailComponent"
      v-if="popupIndDetailVisible && popupIndDetailComponent"
      @close="closeCharts"
      :darkMode="darkMode"
      ref="indDetail"
    ></component>
    <div
      v-if="fundDetailVisible"
      class="fund-detail-overlay"
      :class="darkMode ? 'fund-detail-overlay--dark' : ''"
      role="dialog"
      aria-modal="true"
      :aria-label="sltFund && sltFund.name ? `${sltFund.name}基金详情` : '基金详情'"
    >
      <div class="fund-detail-overlay__backdrop" @click="closeCharts"></div>
      <div class="fund-detail-overlay__viewport">
        <div class="fund-detail-overlay__panel">
          <fund-detail
            :key="`fund-detail-${detailKey}`"
            @close="closeCharts"
            @request-holdings="prefetchFundHoldings"
            :fund="sltFund"
            :holdingsLoading="sltFundHoldingsLoading"
            :holdingsList="sltFundHoldings"
            :holdingsQuotes="sltFundHoldingsQuotes"
            :holdingsBonds="sltFundHoldingsBonds"
            :holdingsFofs="sltFundHoldingsFofs"
            :holdingsExpansion="sltFundHoldingsExpansion"
            :holdingsDebug="sltFundHoldingsDebug"
            :darkMode="darkMode"
            ref="fundDetail"
          ></fund-detail>
        </div>
      </div>
    </div>
    <reward v-if="rewardVisible" @close="handleRewardClose" ref="reward"></reward>
  </div>
</template>

<script src="./popup-app.js"></script>

