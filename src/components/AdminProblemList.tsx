import type { ChangeEvent, MouseEvent, RefObject } from 'react'
import type {
  ProblemItem,
  ProblemOrderBy,
} from '../api/problem'
import { formatDateTimeText } from '../utils/datetime'

type AdminProblemListProps = {
  problems: ProblemItem[]
  problemLoading: boolean
  problemError: string
  problemPage: number
  problemMaxPage: number
  problemPageSize: number
  problemPageSizeLabel: string
  problemPageSizeDropdownOpen: boolean
  problemPageSizeDropUp: boolean
  problemOrderField: ProblemOrderBy
  problemOrderDesc: boolean
  problemOrderLabel: string
  problemOrderDropdownOpen: boolean
  problemStatusFilter: string
  problemStatusFilterLabel: string
  problemStatusFilterOpen: boolean
  problemVisibleFilter: string
  problemVisibleFilterLabel: string
  problemVisibleFilterOpen: boolean
  hasSelectedProblems: boolean
  isAllCurrentPageSelected: boolean
  selectedProblemIds: number[]
  onToggleBatchDropdown: () => void
  problemBatchDropdownOpen: boolean
  problemBatchSubmitting: boolean
  onBatchPublish: () => void
  onBatchDelete: () => void
  onBatchUnpublish: () => void
  onBatchInvisible: () => void
  onBatchVisible: () => void
  problemTitleFilterInput: string
  onChangeTitleFilterInput: (value: string) => void
  onApplyTitleSearch: () => void
  onResetFilters: () => void
  onToggleOrderDropdown: () => void
  onChangeOrderField: (field: ProblemOrderBy) => void
  onChangeOrderDesc: (desc: boolean) => void
  onToggleStatusFilterOpen: () => void
  onChangeStatusFilter: (value: 'all' | '0' | '1' | '2') => void
  onToggleVisibleFilterOpen: () => void
  onChangeVisibleFilter: (value: 'all' | '0' | '1') => void
  onToggleSelectAll: (checked: boolean) => void
  onToggleSelectOne: (id: number, checked: boolean) => void
  onOpenProblemDetail: (problem: ProblemItem) => void
  onStartCreateProblem: () => void
  onChangePageSizeDropdownOpen: (
    open: boolean,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void
  onChangePageSize: (size: number) => void
  onChangePage: (page: number) => void
  problemLoadingForControls: boolean
  headerCheckboxRef: RefObject<HTMLInputElement | null>
}

export default function AdminProblemList(props: AdminProblemListProps) {
  const {
    problems,
    problemLoading,
    problemError,
    problemPage,
    problemMaxPage,
    problemPageSize,
    problemPageSizeLabel,
    problemPageSizeDropdownOpen,
    problemPageSizeDropUp,
    problemOrderField,
    problemOrderDesc,
    problemOrderLabel,
    problemOrderDropdownOpen,
    problemStatusFilter,
    problemStatusFilterLabel,
    problemStatusFilterOpen,
    problemVisibleFilter,
    problemVisibleFilterLabel,
    problemVisibleFilterOpen,
    hasSelectedProblems,
    isAllCurrentPageSelected,
    selectedProblemIds,
    onToggleBatchDropdown,
    problemBatchDropdownOpen,
    problemBatchSubmitting,
    onBatchPublish,
    onBatchDelete,
    onBatchUnpublish,
    onBatchInvisible,
    onBatchVisible,
    problemTitleFilterInput,
    onChangeTitleFilterInput,
    onApplyTitleSearch,
    onResetFilters,
    onToggleOrderDropdown,
    onChangeOrderField,
    onChangeOrderDesc,
    onToggleStatusFilterOpen,
    onChangeStatusFilter,
    onToggleVisibleFilterOpen,
    onChangeVisibleFilter,
    onToggleSelectAll,
    onToggleSelectOne,
    onOpenProblemDetail,
    onStartCreateProblem,
    onChangePageSizeDropdownOpen,
    onChangePageSize,
    onChangePage,
    problemLoadingForControls,
    headerCheckboxRef,
  } = props

  function handleHeaderCheckboxChange(e: ChangeEvent<HTMLInputElement>) {
    onToggleSelectAll(e.target.checked)
  }

  function handleRowCheckboxChange(
    e: ChangeEvent<HTMLInputElement>,
    id: number,
  ) {
    onToggleSelectOne(id, e.target.checked)
  }

  return (
    <div className="problem-list">
      {problemError && (
        <div className="competition-error">{problemError}</div>
      )}
      {!problemError && (
        <>
          {problemLoading && (
            <div className="competition-empty">正在加载题目列表…</div>
          )}
          <div className="problem-list-toolbar">
            <div className="problem-batch-group">
              <span className="problem-batch-label">批量操作</span>
              <div className="problem-batch-select-wrapper">
                <button
                  type="button"
                  className={
                    'problem-batch-select' +
                    (problemBatchDropdownOpen
                      ? ' problem-batch-select-open'
                      : '')
                  }
                  disabled={!hasSelectedProblems || problemBatchSubmitting}
                  onClick={onToggleBatchDropdown}
                >
                  选择操作
                </button>
                {problemBatchDropdownOpen && (
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
                      onClick={onBatchDelete}
                    >
                      批量删除
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
                      onClick={onBatchInvisible}
                    >
                      批量设为不可见
                    </button>
                    <button
                      type="button"
                      className="problem-batch-menu-item"
                      onClick={onBatchVisible}
                    >
                      批量设为可见
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="problem-toolbar-right">
              <div className="problem-search-group">
                <button
                  type="button"
                  className="competition-refresh-btn"
                  onClick={onResetFilters}
                  disabled={problemLoadingForControls}
                  aria-label="重置筛选并刷新题目列表"
                  title="重置筛选并刷新"
                >
                  ↻
                </button>
                <div className="problem-search-input-wrapper">
                  <button
                    type="button"
                    className="problem-search-icon-btn"
                    onClick={onApplyTitleSearch}
                    disabled={problemLoadingForControls}
                    aria-label="搜索"
                    title="搜索"
                  >
                    🔍
                  </button>
                  <input
                    type="text"
                    className="problem-search-input"
                    placeholder="搜索题目标题"
                    value={problemTitleFilterInput}
                    onChange={(e) =>
                      onChangeTitleFilterInput(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onApplyTitleSearch()
                      }
                    }}
                    disabled={problemLoadingForControls}
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
                      (problemOrderDropdownOpen
                        ? ' problem-sort-select-open'
                        : '')
                    }
                    onClick={onToggleOrderDropdown}
                    disabled={problemLoadingForControls}
                  >
                    {problemOrderLabel}
                  </button>
                  {problemOrderDropdownOpen && (
                    <div className="problem-sort-menu">
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (problemOrderField === 'id'
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          onChangeOrderField('id')
                        }}
                      >
                        按 ID
                      </button>
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (problemOrderField === 'created_at'
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          onChangeOrderField('created_at')
                        }}
                      >
                        按创建时间
                      </button>
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (problemOrderField === 'updated_at'
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          onChangeOrderField('updated_at')
                        }}
                      >
                        按更新时间
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={
                    'problem-sort-order-btn' +
                    (!problemOrderDesc
                      ? ' problem-sort-order-btn-active'
                      : '')
                  }
                  onClick={() => onChangeOrderDesc(false)}
                  disabled={problemLoadingForControls}
                >
                  升序
                </button>
                <button
                  type="button"
                  className={
                    'problem-sort-order-btn' +
                    (problemOrderDesc
                      ? ' problem-sort-order-btn-active'
                      : '')
                  }
                  onClick={() => onChangeOrderDesc(true)}
                  disabled={problemLoadingForControls}
                >
                  降序
                </button>
              </div>
            </div>
          </div>
          <div className="problem-list-table">
            <div className="problem-list-row problem-list-row-header">
              <div className="problem-col-select">
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  className="problem-select-checkbox"
                  checked={isAllCurrentPageSelected}
                  disabled={problemLoading || problems.length === 0}
                  onChange={handleHeaderCheckboxChange}
                />
              </div>
              <div className="problem-col-id">ID</div>
              <div className="problem-col-title">标题</div>
              <div className="problem-col-status-header">
                <div className="problem-filter-header">
                  <span>状态</span>
                  <div className="problem-filter-wrapper">
                    <button
                      type="button"
                      className={
                        'problem-filter-icon-btn' +
                        (problemStatusFilter !== 'all'
                          ? ' problem-filter-icon-btn-active'
                          : '') +
                        (problemStatusFilterOpen
                          ? ' problem-filter-icon-btn-open'
                          : '')
                      }
                      onClick={onToggleStatusFilterOpen}
                      disabled={problemLoadingForControls}
                      aria-label={problemStatusFilterLabel}
                    />
                    {problemStatusFilterOpen && (
                      <div className="problem-filter-menu">
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (problemStatusFilter === 'all'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => {
                            onChangeStatusFilter('all')
                          }}
                        >
                          全部
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (problemStatusFilter === '0'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => {
                            onChangeStatusFilter('0')
                          }}
                        >
                          未发布
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (problemStatusFilter === '1'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => {
                            onChangeStatusFilter('1')
                          }}
                        >
                          已发布
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (problemStatusFilter === '2'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => {
                            onChangeStatusFilter('2')
                          }}
                        >
                          已删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="problem-col-visible-header">
                <div className="problem-filter-header">
                  <span>非赛时可见性</span>
                  <div className="problem-filter-wrapper">
                    <button
                      type="button"
                      className={
                        'problem-filter-icon-btn' +
                        (problemVisibleFilter !== 'all'
                          ? ' problem-filter-icon-btn-active'
                          : '') +
                        (problemVisibleFilterOpen
                          ? ' problem-filter-icon-btn-open'
                          : '')
                      }
                      onClick={onToggleVisibleFilterOpen}
                      disabled={problemLoadingForControls}
                      aria-label={problemVisibleFilterLabel}
                    />
                    {problemVisibleFilterOpen && (
                      <div className="problem-filter-menu">
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (problemVisibleFilter === 'all'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => {
                            onChangeVisibleFilter('all')
                          }}
                        >
                          全部
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (problemVisibleFilter === '1'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => {
                            onChangeVisibleFilter('1')
                          }}
                        >
                          可见
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (problemVisibleFilter === '0'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => {
                            onChangeVisibleFilter('0')
                          }}
                        >
                          不可见
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="problem-col-limits">限制</div>
              <div className="problem-col-time">创建时间</div>
              <div className="problem-col-time">更新时间</div>
              <div className="problem-col-actions">操作</div>
            </div>
            <div className="problem-list-body">
              {!problemLoading && problems.length === 0 && (
                <div className="problem-list-row problem-list-row-empty">
                  <div className="problem-col-select" />
                  <div className="problem-col-id" />
                  <div className="problem-col-title">暂无题目</div>
                  <div className="problem-col-status" />
                  <div className="problem-col-visible" />
                  <div className="problem-col-limits" />
                  <div className="problem-col-time" />
                  <div className="problem-col-time" />
                  <div className="problem-col-actions" />
                </div>
              )}
              {!problemLoading &&
                problems.length > 0 &&
                problems.map((p) => (
                  <div
                    key={p.id}
                    className="problem-list-row"
                    onClick={() => {
                      onOpenProblemDetail(p)
                    }}
                  >
                    <div className="problem-col-select">
                      <input
                        type="checkbox"
                        className="problem-select-checkbox"
                        checked={selectedProblemIds.includes(p.id)}
                        disabled={problemLoading}
                        onChange={(e) =>
                          handleRowCheckboxChange(e, p.id)
                        }
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      />
                    </div>
                    <div className="problem-col-id">{p.id}</div>
                    <div className="problem-col-title">{p.title}</div>
                    <div className="problem-col-status">
                      <span
                        className={
                          'problem-status-pill ' +
                          (p.status === 0
                            ? 'problem-status-pill-pending'
                            : p.status === 1
                              ? 'problem-status-pill-active'
                              : 'problem-status-pill-deleted')
                        }
                      >
                        {p.status === 0
                          ? '未发布'
                          : p.status === 1
                            ? '已发布'
                            : '已删除'}
                      </span>
                    </div>
                    <div className="problem-col-visible">
                      <span
                        className={
                          'problem-visible-pill ' +
                          (p.visible === 1
                            ? 'problem-visible-pill-on'
                            : 'problem-visible-pill-off')
                        }
                      >
                        {p.visible === 1 ? '可见' : '不可见'}
                      </span>
                    </div>
                    <div className="problem-col-limits">
                      {p.time_limit} ms / {p.memory_limit} MB
                    </div>
                    <div className="problem-col-time">
                      {formatDateTimeText(p.created_at)}
                    </div>
                    <div className="problem-col-time">
                      {formatDateTimeText(p.updated_at)}
                    </div>
                    <div className="problem-col-actions">
                      <button
                        type="button"
                        className="problem-action-btn"
                        aria-label="查看详情"
                        title="查看详情"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenProblemDetail(p)
                        }}
                      >
                        👁
                      </button>
                      <button
                        type="button"
                        className="problem-action-btn problem-action-danger"
                        aria-label="删除题目"
                        title="删除题目"
                        disabled={p.status === 2}
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
              aria-label="新增题目"
              title="新增题目"
              disabled={problemLoadingForControls}
              onClick={onStartCreateProblem}
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
                    (problemPageSizeDropdownOpen
                      ? ' problem-sort-select-open'
                      : '')
                  }
                  onClick={(e) => {
                    onChangePageSizeDropdownOpen(
                      !problemPageSizeDropdownOpen,
                      e,
                    )
                  }}
                  disabled={problemLoadingForControls}
                >
                  {problemPageSizeLabel}
                </button>
                {problemPageSizeDropdownOpen && (
                  <div
                    className={
                      'problem-sort-menu' +
                      (problemPageSizeDropUp
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
                          (problemPageSize === size
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          onChangePageSize(size)
                        }}
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
              onClick={() =>
                onChangePage(Math.max(1, problemPage - 1))
              }
              disabled={problemPage <= 1 || problemLoadingForControls}
            >
              上一页
            </button>
            <span className="competition-page-info">
              第 {problemPage} / {problemMaxPage} 页
            </span>
            <button
              type="button"
              onClick={() =>
                onChangePage(
                  Math.min(problemMaxPage, problemPage + 1),
                )
              }
              disabled={
                problemPage >= problemMaxPage || problemLoadingForControls
              }
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  )
}
