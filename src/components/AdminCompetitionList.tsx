import type { ChangeEvent, MouseEvent, RefObject } from 'react'
import type { CompetitionItem, CompetitionOrderBy } from '../api/competition'
import { formatDateTimeText } from '../utils/datetime'
import { COMPETITION_TIMEZONE_OPTIONS } from '../utils/competitionTime'
import {
  renderCompetitionRuntimePill,
  renderCompetitionStatusPill,
} from './AdminCompetitionPills'

type CompetitionStatusFilter = 'all' | '0' | '1' | '2'
type CompetitionPhaseFilter = 'all' | '0' | '1' | '2'

type AdminCompetitionListProps = {
  competitions: CompetitionItem[]
  competitionLoading: boolean
  competitionError: string
  competitionPage: number
  competitionMaxPage: number
  competitionPageSize: number
  competitionPageSizeLabel: string
  competitionPageSizeDropdownOpen: boolean
  competitionPageSizeDropUp: boolean
  competitionOrderField: CompetitionOrderBy
  competitionOrderDesc: boolean
  competitionOrderLabel: string
  competitionOrderDropdownOpen: boolean
  competitionStatusFilter: CompetitionStatusFilter
  competitionStatusFilterLabel: string
  competitionStatusFilterOpen: boolean
  competitionPhaseFilter: CompetitionPhaseFilter
  competitionPhaseFilterLabel: string
  competitionPhaseFilterOpen: boolean
  hasSelectedCompetitions: boolean
  isAllCurrentPageSelected: boolean
  selectedCompetitionIds: number[]
  competitionBatchSubmitting: boolean
  competitionBatchDropdownOpen: boolean
  onToggleBatchDropdown: () => void
  onBatchPublish: () => void
  onBatchUnpublish: () => void
  onBatchDelete: () => void
  onResetFilters: () => void
  competitionNameFilterInput: string
  onChangeNameFilterInput: (value: string) => void
  onApplyNameSearch: () => void
  onToggleOrderDropdown: () => void
  onChangeOrderField: (field: CompetitionOrderBy) => void
  onChangeOrderDesc: (desc: boolean) => void
  onToggleStatusFilterOpen: () => void
  onChangeStatusFilter: (value: CompetitionStatusFilter) => void
  onTogglePhaseFilterOpen: () => void
  onChangePhaseFilter: (value: CompetitionPhaseFilter) => void
  onToggleSelectAll: (checked: boolean) => void
  onToggleSelectOne: (id: number, checked: boolean) => void
  onOpenCompetitionDetail: (competition: CompetitionItem) => void
  onOpenCreateCompetitionModal: () => void
  onChangePageSizeDropdownOpen: (
    open: boolean,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void
  onChangePageSize: (size: number) => void
  onChangePage: (page: number) => void
  headerCheckboxRef: RefObject<HTMLInputElement | null>

  createCompetitionModalOpen: boolean
  createCompetitionName: string
  createCompetitionTimezoneOffset: number
  createCompetitionStartLocal: string
  createCompetitionEndLocal: string
  createCompetitionSubmitting: boolean
  createCompetitionHasChanges: boolean
  onCloseCreateCompetitionModal: () => void
  onSubmitCreateCompetition: (e: MouseEvent<HTMLButtonElement>) => void
  onChangeCreateCompetitionName: (value: string) => void
  onChangeCreateCompetitionTimezoneOffset: (nextOffset: number) => void
  onChangeCreateCompetitionStartLocal: (value: string) => void
  onChangeCreateCompetitionEndLocal: (value: string) => void
}

export default function AdminCompetitionList(props: AdminCompetitionListProps) {
  const {
    competitions,
    competitionLoading,
    competitionError,
    competitionPage,
    competitionMaxPage,
    competitionPageSize,
    competitionPageSizeLabel,
    competitionPageSizeDropdownOpen,
    competitionPageSizeDropUp,
    competitionOrderField,
    competitionOrderDesc,
    competitionOrderLabel,
    competitionOrderDropdownOpen,
    competitionStatusFilter,
    competitionStatusFilterLabel,
    competitionStatusFilterOpen,
    competitionPhaseFilter,
    competitionPhaseFilterLabel,
    competitionPhaseFilterOpen,
    hasSelectedCompetitions,
    isAllCurrentPageSelected,
    selectedCompetitionIds,
    competitionBatchSubmitting,
    competitionBatchDropdownOpen,
    onToggleBatchDropdown,
    onBatchPublish,
    onBatchUnpublish,
    onBatchDelete,
    onResetFilters,
    competitionNameFilterInput,
    onChangeNameFilterInput,
    onApplyNameSearch,
    onToggleOrderDropdown,
    onChangeOrderField,
    onChangeOrderDesc,
    onToggleStatusFilterOpen,
    onChangeStatusFilter,
    onTogglePhaseFilterOpen,
    onChangePhaseFilter,
    onToggleSelectAll,
    onToggleSelectOne,
    onOpenCompetitionDetail,
    onOpenCreateCompetitionModal,
    onChangePageSizeDropdownOpen,
    onChangePageSize,
    onChangePage,
    headerCheckboxRef,
    createCompetitionModalOpen,
    createCompetitionName,
    createCompetitionTimezoneOffset,
    createCompetitionStartLocal,
    createCompetitionEndLocal,
    createCompetitionSubmitting,
    createCompetitionHasChanges,
    onCloseCreateCompetitionModal,
    onSubmitCreateCompetition,
    onChangeCreateCompetitionName,
    onChangeCreateCompetitionTimezoneOffset,
    onChangeCreateCompetitionStartLocal,
    onChangeCreateCompetitionEndLocal,
  } = props

  function handleHeaderCheckboxChange(e: ChangeEvent<HTMLInputElement>) {
    onToggleSelectAll(e.target.checked)
  }

  function handleRowCheckboxChange(e: ChangeEvent<HTMLInputElement>, id: number) {
    onToggleSelectOne(id, e.target.checked)
  }

  return (
    <>
      <div className="competition-admin-list">
        <div className="problem-list-toolbar">
          <div className="problem-batch-group">
            <span className="problem-batch-label">批量操作</span>
            <div className="problem-batch-select-wrapper">
              <button
                type="button"
                className="problem-batch-select"
                disabled={!hasSelectedCompetitions || competitionBatchSubmitting}
                onClick={onToggleBatchDropdown}
              >
                选择操作
              </button>
              {competitionBatchDropdownOpen && (
                <div className="problem-batch-menu">
                  <button
                    type="button"
                    className="problem-batch-menu-item"
                    onClick={onBatchPublish}
                  >
                    批量发布
                  </button>
                  <button
                    type="button"
                    className="problem-batch-menu-item"
                    onClick={onBatchUnpublish}
                  >
                    批量设为未发布
                  </button>
                  <button
                    type="button"
                    className="problem-batch-menu-item"
                    onClick={onBatchDelete}
                  >
                    批量删除
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="problem-toolbar-right">
            <button
              type="button"
              className="competition-refresh-btn"
              onClick={onResetFilters}
              disabled={competitionLoading}
              aria-label="重置筛选并刷新比赛列表"
              title="重置筛选并刷新"
            >
              ↻
            </button>
            <div className="problem-search-group">
              <div className="problem-search-input-wrapper">
                <button
                  type="button"
                  className="problem-search-icon-btn"
                  onClick={onApplyNameSearch}
                  disabled={competitionLoading}
                  aria-label="搜索"
                  title="搜索"
                >
                  🔍
                </button>
                <input
                  type="text"
                  className="problem-search-input"
                  placeholder="搜索比赛名称"
                  value={competitionNameFilterInput}
                  onChange={(e) => onChangeNameFilterInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onApplyNameSearch()
                    }
                  }}
                  disabled={competitionLoading}
                />
              </div>
            </div>
            <div className="problem-sort-group">
              <span className="problem-sort-label">排序</span>
              <div className="problem-sort-select-wrapper">
                <button
                  type="button"
                  className={
                    'problem-sort-select' +
                    (competitionOrderDropdownOpen
                      ? ' problem-sort-select-open'
                      : '')
                  }
                  onClick={onToggleOrderDropdown}
                  disabled={competitionLoading}
                >
                  {competitionOrderLabel}
                </button>
                {competitionOrderDropdownOpen && (
                  <div className="problem-sort-menu">
                    <button
                      type="button"
                      className={
                        'problem-sort-menu-item' +
                        (competitionOrderField === 'id'
                          ? ' problem-sort-menu-item-active'
                          : '')
                      }
                      onClick={() => onChangeOrderField('id')}
                    >
                      按 ID
                    </button>
                    <button
                      type="button"
                      className={
                        'problem-sort-menu-item' +
                        (competitionOrderField === 'start_time'
                          ? ' problem-sort-menu-item-active'
                          : '')
                      }
                      onClick={() => onChangeOrderField('start_time')}
                    >
                      按开始时间
                    </button>
                    <button
                      type="button"
                      className={
                        'problem-sort-menu-item' +
                        (competitionOrderField === 'end_time'
                          ? ' problem-sort-menu-item-active'
                          : '')
                      }
                      onClick={() => onChangeOrderField('end_time')}
                    >
                      按结束时间
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={
                  'problem-sort-order-btn' +
                  (!competitionOrderDesc
                    ? ' problem-sort-order-btn-active'
                    : '')
                }
                onClick={() => onChangeOrderDesc(false)}
                disabled={competitionLoading}
              >
                升序
              </button>
              <button
                type="button"
                className={
                  'problem-sort-order-btn' +
                  (competitionOrderDesc
                    ? ' problem-sort-order-btn-active'
                    : '')
                }
                onClick={() => onChangeOrderDesc(true)}
                disabled={competitionLoading}
              >
                降序
              </button>
            </div>
          </div>
        </div>
        {competitionError && (
          <div className="competition-error">{competitionError}</div>
        )}
        {!competitionError && (
          <>
            {competitionLoading && (
              <div className="competition-empty">正在加载比赛列表…</div>
            )}
            <div className="competition-admin-list-table">
              <div className="competition-admin-list-row competition-admin-list-row-header">
                <div className="competition-admin-col-select">
                  <input
                    type="checkbox"
                    ref={headerCheckboxRef}
                    className="problem-select-checkbox"
                    checked={isAllCurrentPageSelected}
                    disabled={competitionLoading || competitions.length === 0}
                    onChange={handleHeaderCheckboxChange}
                  />
                </div>
                <div className="competition-admin-col-id">ID</div>
                <div className="competition-admin-col-name">名称</div>
                <div className="competition-admin-col-status">
                  <div className="problem-filter-header">
                    <span>发布状态</span>
                    <div className="problem-filter-wrapper">
                      <button
                        type="button"
                        className={
                          'problem-filter-icon-btn' +
                          (competitionStatusFilter !== 'all'
                            ? ' problem-filter-icon-btn-active'
                            : '') +
                          (competitionStatusFilterOpen
                            ? ' problem-filter-icon-btn-open'
                            : '')
                        }
                        onClick={onToggleStatusFilterOpen}
                        disabled={competitionLoading}
                        aria-label={competitionStatusFilterLabel}
                      />
                      {competitionStatusFilterOpen && (
                        <div className="problem-filter-menu">
                          <button
                            type="button"
                            className={
                              'problem-filter-menu-item' +
                              (competitionStatusFilter === 'all'
                                ? ' problem-filter-menu-item-active'
                                : '')
                            }
                            onClick={() => onChangeStatusFilter('all')}
                          >
                            全部
                          </button>
                          <button
                            type="button"
                            className={
                              'problem-filter-menu-item' +
                              (competitionStatusFilter === '0'
                                ? ' problem-filter-menu-item-active'
                                : '')
                            }
                            onClick={() => onChangeStatusFilter('0')}
                          >
                            未发布
                          </button>
                          <button
                            type="button"
                            className={
                              'problem-filter-menu-item' +
                              (competitionStatusFilter === '1'
                                ? ' problem-filter-menu-item-active'
                                : '')
                            }
                            onClick={() => onChangeStatusFilter('1')}
                          >
                            已发布
                          </button>
                          <button
                            type="button"
                            className={
                              'problem-filter-menu-item' +
                              (competitionStatusFilter === '2'
                                ? ' problem-filter-menu-item-active'
                                : '')
                            }
                            onClick={() => onChangeStatusFilter('2')}
                          >
                            已删除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="competition-admin-col-runtime-status">
                  <div className="problem-filter-header">
                    <span>进行状态</span>
                    <div className="problem-filter-wrapper">
                      <button
                        type="button"
                        className={
                          'problem-filter-icon-btn' +
                          (competitionPhaseFilter !== 'all'
                            ? ' problem-filter-icon-btn-active'
                            : '') +
                          (competitionPhaseFilterOpen
                            ? ' problem-filter-icon-btn-open'
                            : '')
                        }
                        onClick={onTogglePhaseFilterOpen}
                        disabled={competitionLoading}
                        aria-label={competitionPhaseFilterLabel}
                      />
                      {competitionPhaseFilterOpen && (
                        <div className="problem-filter-menu">
                          <button
                            type="button"
                            className={
                              'problem-filter-menu-item' +
                              (competitionPhaseFilter === 'all'
                                ? ' problem-filter-menu-item-active'
                                : '')
                            }
                            onClick={() => onChangePhaseFilter('all')}
                          >
                            全部
                          </button>
                          <button
                            type="button"
                            className={
                              'problem-filter-menu-item' +
                              (competitionPhaseFilter === '0'
                                ? ' problem-filter-menu-item-active'
                                : '')
                            }
                            onClick={() => onChangePhaseFilter('0')}
                          >
                            未开始
                          </button>
                          <button
                            type="button"
                            className={
                              'problem-filter-menu-item' +
                              (competitionPhaseFilter === '1'
                                ? ' problem-filter-menu-item-active'
                                : '')
                            }
                            onClick={() => onChangePhaseFilter('1')}
                          >
                            进行中
                          </button>
                          <button
                            type="button"
                            className={
                              'problem-filter-menu-item' +
                              (competitionPhaseFilter === '2'
                                ? ' problem-filter-menu-item-active'
                                : '')
                            }
                            onClick={() => onChangePhaseFilter('2')}
                          >
                            已结束
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="competition-admin-col-time">开始时间</div>
                <div className="competition-admin-col-time">结束时间</div>
                <div className="competition-admin-col-actions">操作</div>
              </div>
              <div className="competition-admin-list-body">
                {!competitionLoading && competitions.length === 0 && (
                  <div className="competition-admin-list-row competition-admin-list-row-empty">
                    <div className="competition-admin-col-select" />
                    <div className="competition-admin-col-id" />
                    <div className="competition-admin-col-name">暂无比赛</div>
                    <div className="competition-admin-col-status" />
                    <div className="competition-admin-col-runtime-status" />
                    <div className="competition-admin-col-time" />
                    <div className="competition-admin-col-time" />
                    <div className="competition-admin-col-actions" />
                  </div>
                )}
                {!competitionLoading &&
                  competitions.length > 0 &&
                  competitions.map((c) => (
                    <div
                      key={c.id}
                      className="competition-admin-list-row"
                      onClick={() => onOpenCompetitionDetail(c)}
                    >
                      <div className="competition-admin-col-select">
                        <input
                          type="checkbox"
                          className="problem-select-checkbox"
                          checked={selectedCompetitionIds.includes(c.id)}
                          disabled={
                            competitionLoading || competitionBatchSubmitting
                          }
                          onChange={(e) => handleRowCheckboxChange(e, c.id)}
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        />
                      </div>
                      <div className="competition-admin-col-id">{c.id}</div>
                      <div className="competition-admin-col-name">{c.name}</div>
                      <div className="competition-admin-col-status">
                        {renderCompetitionStatusPill(c.status)}
                      </div>
                      <div className="competition-admin-col-runtime-status">
                        {renderCompetitionRuntimePill(c)}
                      </div>
                      <div className="competition-admin-col-time">
                        {formatDateTimeText(c.start_time)}
                      </div>
                      <div className="competition-admin-col-time">
                        {formatDateTimeText(c.end_time)}
                      </div>
                      <div className="competition-admin-col-actions problem-col-actions">
                        <button
                          type="button"
                          className="problem-action-btn"
                          aria-label="查看详情"
                          title="查看详情"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenCompetitionDetail(c)
                          }}
                        >
                          👁
                        </button>
                        <button
                          type="button"
                          className="problem-action-btn problem-action-danger"
                          aria-label="删除比赛"
                          title="删除比赛"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          disabled={c.status === 2}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="competition-pagination">
              <button
                type="button"
                className="problem-add-button"
                title="创建比赛"
                aria-label="创建比赛"
                onClick={onOpenCreateCompetitionModal}
                disabled={competitionLoading}
              >
                ＋
              </button>
              <div className="problem-page-size-group">
                <span className="problem-page-size-label">每页</span>
                <div className="problem-page-size-select-wrapper">
                  <button
                    type="button"
                    className={
                      'problem-sort-select problem-page-size-select' +
                      (competitionPageSizeDropdownOpen
                        ? ' problem-sort-select-open'
                        : '')
                    }
                    onClick={(e) =>
                      onChangePageSizeDropdownOpen(
                        !competitionPageSizeDropdownOpen,
                        e,
                      )
                    }
                    disabled={competitionLoading}
                  >
                    {competitionPageSizeLabel}
                  </button>
                  {competitionPageSizeDropdownOpen && (
                    <div
                      className={
                        'problem-sort-menu' +
                        (competitionPageSizeDropUp
                          ? ' problem-sort-menu-up'
                          : '')
                      }
                    >
                      {[10, 20, 50, 100].map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={
                            'problem-sort-menu-item' +
                            (competitionPageSize === size
                              ? ' problem-sort-menu-item-active'
                              : '')
                          }
                          onClick={() => onChangePageSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="problem-page-size-label">条</span>
              </div>
              <button
                type="button"
                onClick={() => onChangePage(Math.max(1, competitionPage - 1))}
                disabled={competitionPage <= 1 || competitionLoading}
              >
                上一页
              </button>
              <span className="competition-page-info">
                第 {competitionPage} / {competitionMaxPage} 页
              </span>
              <button
                type="button"
                onClick={() => onChangePage(competitionPage + 1)}
                disabled={competitionPage >= competitionMaxPage || competitionLoading}
              >
                下一页
              </button>
            </div>
          </>
        )}
      </div>
      {createCompetitionModalOpen && (
        <div className="admin-modal-overlay">
          <div
            className="admin-modal"
            style={{ width: '480px', maxWidth: 'calc(100% - 40px)' }}
          >
            <div className="admin-modal-title">创建比赛</div>
            <div className="admin-modal-message">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 13 }}>比赛名称</div>
                  <input
                    type="text"
                    className="problem-detail-input"
                    value={createCompetitionName}
                    maxLength={100}
                    onChange={(e) =>
                      onChangeCreateCompetitionName(e.target.value)
                    }
                    placeholder="请输入比赛名称"
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 13 }}>时区</div>
                  <select
                    className="problem-detail-select problem-detail-input-inline"
                    value={createCompetitionTimezoneOffset}
                    onChange={(e) => {
                      const nextOffset = Number(e.target.value)
                      if (Number.isNaN(nextOffset)) return
                      onChangeCreateCompetitionTimezoneOffset(nextOffset)
                    }}
                  >
                    {COMPETITION_TIMEZONE_OPTIONS.map((item) => (
                      <option key={item.offset} value={item.offset}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 13 }}>开始时间</div>
                  <input
                    type="datetime-local"
                    className="problem-detail-input problem-detail-input-inline"
                    style={{ minWidth: '220px' }}
                    value={createCompetitionStartLocal}
                    step={1}
                    onChange={(e) =>
                      onChangeCreateCompetitionStartLocal(e.target.value)
                    }
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 13 }}>结束时间</div>
                  <input
                    type="datetime-local"
                    className="problem-detail-input problem-detail-input-inline"
                    style={{ minWidth: '220px' }}
                    value={createCompetitionEndLocal}
                    step={1}
                    onChange={(e) =>
                      onChangeCreateCompetitionEndLocal(e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="problem-detail-edit-btn"
                onClick={onCloseCreateCompetitionModal}
                disabled={createCompetitionSubmitting}
              >
                取消
              </button>
              <button
                type="button"
                className="problem-detail-confirm-btn"
                onClick={onSubmitCreateCompetition}
                disabled={
                  createCompetitionSubmitting || !createCompetitionHasChanges
                }
              >
                {createCompetitionSubmitting ? '创建中…' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
