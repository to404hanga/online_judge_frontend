import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from 'react'
import {
  fetchAdminCompetitionList,
  type CompetitionItem,
  type CompetitionOrderBy,
  updateCompetition,
} from '../api/competition'
import { formatDateTimeText } from '../utils/datetime'

type CompetitionStatusFilter = 'all' | '0' | '1' | '2'
type CompetitionPhaseFilter = 'all' | '0' | '1' | '2'
type CompetitionRuntimeTone = 'upcoming' | 'running' | 'finished'

export default function AdminCompetitionSection() {
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [competitionLoading, setCompetitionLoading] = useState(false)
  const [competitionError, setCompetitionError] = useState('')
  const [competitionPage, setCompetitionPage] = useState(1)
  const [competitionTotal, setCompetitionTotal] = useState(0)
  const [competitionPageSize, setCompetitionPageSize] = useState(10)
  const [competitionOrderField, setCompetitionOrderField] =
    useState<CompetitionOrderBy>('id')
  const [competitionOrderDesc, setCompetitionOrderDesc] = useState(false)
  const [competitionOrderDropdownOpen, setCompetitionOrderDropdownOpen] =
    useState(false)
  const [competitionStatusFilter, setCompetitionStatusFilter] =
    useState<CompetitionStatusFilter>('all')
  const [competitionStatusFilterOpen, setCompetitionStatusFilterOpen] =
    useState(false)
  const [competitionPhaseFilter, setCompetitionPhaseFilter] =
    useState<CompetitionPhaseFilter>('all')
  const [competitionPhaseFilterOpen, setCompetitionPhaseFilterOpen] =
    useState(false)
  const [competitionNameFilter, setCompetitionNameFilter] = useState('')
  const [competitionNameFilterInput, setCompetitionNameFilterInput] =
    useState('')
  const [competitionPageSizeDropdownOpen, setCompetitionPageSizeDropdownOpen] =
    useState(false)
  const [competitionPageSizeDropUp, setCompetitionPageSizeDropUp] =
    useState(false)
  const [competitionRefreshToken, setCompetitionRefreshToken] = useState(0)
  const [selectedCompetitionIds, setSelectedCompetitionIds] = useState<
    number[]
  >([])
  const [competitionBatchSubmitting, setCompetitionBatchSubmitting] =
    useState(false)
  const [competitionBatchDropdownOpen, setCompetitionBatchDropdownOpen] =
    useState(false)
  const competitionHeaderSelectRef = useRef<HTMLInputElement | null>(null)
  const [competitionAlertOpen, setCompetitionAlertOpen] = useState(false)
  const [competitionAlertTitle, setCompetitionAlertTitle] = useState('')
  const [competitionAlertMessage, setCompetitionAlertMessage] = useState('')

  useEffect(() => {
    void loadCompetitions(
      competitionPage,
      competitionPageSize,
      competitionOrderField,
      competitionOrderDesc,
      competitionStatusFilter,
      competitionPhaseFilter,
      competitionNameFilter,
    )
  }, [
    competitionPage,
    competitionPageSize,
    competitionOrderField,
    competitionOrderDesc,
    competitionStatusFilter,
    competitionPhaseFilter,
    competitionNameFilter,
    competitionRefreshToken,
  ])

  async function loadCompetitions(
    targetPage: number,
    pageSize: number,
    orderBy: CompetitionOrderBy,
    desc: boolean,
    statusFilter: CompetitionStatusFilter,
    phaseFilter: CompetitionPhaseFilter,
    nameFilter: string,
  ) {
    setCompetitionLoading(true)
    setCompetitionError('')
    try {
      const statusValue =
        statusFilter === 'all' ? undefined : Number(statusFilter)
      const phaseValue =
        phaseFilter === 'all' ? undefined : Number(phaseFilter)
      const nameValue =
        nameFilter && nameFilter.trim().length > 0
          ? nameFilter.trim()
          : undefined
      const res = await fetchAdminCompetitionList(
        targetPage,
        pageSize,
        orderBy,
        desc,
        statusValue,
        phaseValue,
        nameValue,
      )
      if (!res.ok || !res.data || !res.data.data) {
        setCompetitions([])
        setCompetitionTotal(0)
        setSelectedCompetitionIds([])
        setCompetitionError(res.data?.message ?? '获取比赛列表失败')
        return
      }
      const data = res.data.data
      setCompetitions(data.list)
      setCompetitionTotal(data.total)
      setSelectedCompetitionIds((prev) =>
        prev.filter((id) => data.list.some((item) => item.id === id)),
      )
    } catch {
      setCompetitions([])
      setCompetitionTotal(0)
      setSelectedCompetitionIds([])
      setCompetitionError('网络错误，请稍后重试')
    } finally {
      setCompetitionLoading(false)
    }
  }

  const competitionMaxPage =
    competitionTotal > 0
      ? Math.ceil(competitionTotal / competitionPageSize)
      : 1

  const competitionOrderLabel =
    competitionOrderField === 'id'
      ? '按 ID'
      : competitionOrderField === 'start_time'
        ? '按开始时间'
        : '按结束时间'

  const competitionStatusFilterLabel =
    competitionStatusFilter === 'all'
      ? '全部状态'
      : competitionStatusFilter === '0'
        ? '仅未发布'
        : competitionStatusFilter === '1'
          ? '仅已发布'
          : '仅已删除'

  const competitionPhaseFilterLabel =
    competitionPhaseFilter === 'all'
      ? '全部比赛'
      : competitionPhaseFilter === '0'
        ? '仅未开始'
        : competitionPhaseFilter === '1'
          ? '仅进行中'
          : '仅已结束'

  const competitionPageSizeLabel = `${competitionPageSize}`

  const hasSelectedCompetitions = selectedCompetitionIds.length > 0
  const isAllCurrentPageSelected =
    competitions.length > 0 &&
    competitions.every((c) => selectedCompetitionIds.includes(c.id))
  const isHeaderIndeterminate =
    hasSelectedCompetitions && !isAllCurrentPageSelected

  useEffect(() => {
    if (!competitionHeaderSelectRef.current) return
    competitionHeaderSelectRef.current.indeterminate = isHeaderIndeterminate
  }, [isHeaderIndeterminate])

  function applyCompetitionNameSearch() {
    setCompetitionNameFilter(competitionNameFilterInput.trim())
    setCompetitionPage(1)
  }

  function handleResetFilters() {
    setCompetitionPage(1)
    setCompetitionOrderField('id')
    setCompetitionOrderDesc(false)
    setCompetitionStatusFilter('all')
    setCompetitionPhaseFilter('all')
    setCompetitionNameFilter('')
    setCompetitionNameFilterInput('')
    setCompetitionOrderDropdownOpen(false)
    setCompetitionStatusFilterOpen(false)
    setCompetitionPhaseFilterOpen(false)
    setCompetitionPageSizeDropdownOpen(false)
    setCompetitionBatchDropdownOpen(false)
    setSelectedCompetitionIds([])
    setCompetitionRefreshToken((v) => v + 1)
  }

  function handleChangeStatusFilter(value: CompetitionStatusFilter) {
    setCompetitionStatusFilter(value)
    setCompetitionPage(1)
    setCompetitionStatusFilterOpen(false)
  }

  function handleChangePhaseFilter(value: CompetitionPhaseFilter) {
    setCompetitionPhaseFilter(value)
    setCompetitionPage(1)
    setCompetitionPhaseFilterOpen(false)
  }

  function handleChangePageSizeDropdownOpen(
    open: boolean,
    event?: MouseEvent<HTMLButtonElement>,
  ) {
    if (open && !competitionPageSizeDropdownOpen && event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const estimatedMenuHeight = 180
      setCompetitionPageSizeDropUp(spaceBelow < estimatedMenuHeight)
    }
    setCompetitionPageSizeDropdownOpen(open)
  }

  function getRuntimeStatusTone(item: CompetitionItem): CompetitionRuntimeTone {
    const now = Date.now()
    const startAt = new Date(item.start_time).getTime()
    const endAt = new Date(item.end_time).getTime()
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) return 'upcoming'
    if (now < startAt) return 'upcoming'
    if (now >= startAt && now < endAt) return 'running'
    return 'finished'
  }

  function getRuntimeStatusLabel(item: CompetitionItem) {
    const tone = getRuntimeStatusTone(item)
    if (tone === 'upcoming') return '未开始'
    if (tone === 'running') return '进行中'
    if (tone === 'finished') return '已结束'
    return ''
  }

  function renderStatusPill(status: number) {
    const text =
      status === 0 ? '未发布' : status === 1 ? '已发布' : '已删除'
    const toneClass =
      status === 0
        ? 'problem-status-pill-pending'
        : status === 1
          ? 'problem-status-pill-active'
          : 'problem-status-pill-deleted'
    return <span className={`problem-status-pill ${toneClass}`}>{text}</span>
  }

  function renderRuntimePill(item: CompetitionItem) {
    const tone = getRuntimeStatusTone(item)
    const text = getRuntimeStatusLabel(item)
    if (!text) return null
    const toneClass =
      tone === 'upcoming'
        ? 'competition-runtime-pill-upcoming'
        : tone === 'running'
          ? 'competition-runtime-pill-running'
          : 'competition-runtime-pill-finished'
    return (
      <span className={`competition-runtime-pill ${toneClass}`}>{text}</span>
    )
  }

  async function batchUpdateSelectedCompetitions(patch: { status?: number }) {
    if (!hasSelectedCompetitions) return
    setCompetitionBatchSubmitting(true)
    try {
      const results = await Promise.all(
        selectedCompetitionIds.map((id) =>
          updateCompetition({
            competition_id: id,
            ...patch,
          }),
        ),
      )
      const failed = results.filter(
        (res) =>
          !res.ok ||
          !res.data ||
          typeof res.data.code !== 'number' ||
          res.data.code !== 200,
      )
      if (failed.length > 0) {
        setCompetitionAlertTitle('操作失败')
        setCompetitionAlertMessage('部分比赛更新失败，请稍后重试')
        setCompetitionAlertOpen(true)
      }
      await loadCompetitions(
        competitionPage,
        competitionPageSize,
        competitionOrderField,
        competitionOrderDesc,
        competitionStatusFilter,
        competitionPhaseFilter,
        competitionNameFilter,
      )
      setSelectedCompetitionIds([])
    } catch {
      setCompetitionAlertTitle('操作失败')
      setCompetitionAlertMessage('批量操作失败，请稍后重试')
      setCompetitionAlertOpen(true)
    } finally {
      setCompetitionBatchSubmitting(false)
    }
  }

  function handleHeaderCheckboxChange(e: ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked
    if (checked) {
      setSelectedCompetitionIds(competitions.map((c) => c.id))
    } else {
      setSelectedCompetitionIds([])
    }
  }

  function handleRowCheckboxChange(
    e: ChangeEvent<HTMLInputElement>,
    id: number,
  ) {
    const checked = e.target.checked
    if (checked) {
      setSelectedCompetitionIds((prev) =>
        prev.includes(id) ? prev : [...prev, id],
      )
    } else {
      setSelectedCompetitionIds((prev) => prev.filter((cid) => cid !== id))
    }
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
              onClick={() =>
                setCompetitionBatchDropdownOpen((open) => !open)
              }
            >
              选择操作
            </button>
            {competitionBatchDropdownOpen && (
              <div className="problem-batch-menu">
                <button
                  type="button"
                  className="problem-batch-menu-item"
                  onClick={async () => {
                    setCompetitionBatchDropdownOpen(false)
                    await batchUpdateSelectedCompetitions({ status: 1 })
                  }}
                >
                  批量发布
                </button>
                <button
                  type="button"
                  className="problem-batch-menu-item"
                  onClick={async () => {
                    setCompetitionBatchDropdownOpen(false)
                    await batchUpdateSelectedCompetitions({ status: 0 })
                  }}
                >
                  批量设为未发布
                </button>
                <button
                  type="button"
                  className="problem-batch-menu-item"
                  onClick={async () => {
                    setCompetitionBatchDropdownOpen(false)
                    await batchUpdateSelectedCompetitions({ status: 2 })
                  }}
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
            onClick={handleResetFilters}
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
                onClick={applyCompetitionNameSearch}
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
                onChange={(e) =>
                  setCompetitionNameFilterInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    applyCompetitionNameSearch()
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
                onClick={() =>
                  setCompetitionOrderDropdownOpen((open) => !open)
                }
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
                    onClick={() => {
                      setCompetitionOrderField('id')
                      setCompetitionOrderDropdownOpen(false)
                    }}
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
                    onClick={() => {
                      setCompetitionOrderField('start_time')
                      setCompetitionOrderDropdownOpen(false)
                    }}
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
                    onClick={() => {
                      setCompetitionOrderField('end_time')
                      setCompetitionOrderDropdownOpen(false)
                    }}
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
              onClick={() => setCompetitionOrderDesc(false)}
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
              onClick={() => setCompetitionOrderDesc(true)}
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
                  ref={competitionHeaderSelectRef}
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
                      onClick={() =>
                        setCompetitionStatusFilterOpen((open) => !open)
                      }
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
                          onClick={() => handleChangeStatusFilter('all')}
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
                          onClick={() => handleChangeStatusFilter('0')}
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
                          onClick={() => handleChangeStatusFilter('1')}
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
                          onClick={() => handleChangeStatusFilter('2')}
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
                      onClick={() =>
                        setCompetitionPhaseFilterOpen((open) => !open)
                      }
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
                          onClick={() => handleChangePhaseFilter('all')}
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
                          onClick={() => handleChangePhaseFilter('0')}
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
                          onClick={() => handleChangePhaseFilter('1')}
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
                          onClick={() => handleChangePhaseFilter('2')}
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
                  <div className="competition-admin-col-name">
                    暂无比赛
                  </div>
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
                  >
                    <div className="competition-admin-col-select">
                      <input
                        type="checkbox"
                        className="problem-select-checkbox"
                        checked={selectedCompetitionIds.includes(c.id)}
                        disabled={competitionLoading || competitionBatchSubmitting}
                        onChange={(e) => handleRowCheckboxChange(e, c.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      />
                    </div>
                    <div className="competition-admin-col-id">
                      {c.id}
                    </div>
                    <div className="competition-admin-col-name">
                      {c.name}
                    </div>
                    <div className="competition-admin-col-status">
                      {renderStatusPill(c.status)}
                    </div>
                    <div className="competition-admin-col-runtime-status">
                      {renderRuntimePill(c)}
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
                    handleChangePageSizeDropdownOpen(
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
                        onClick={() => {
                          setCompetitionPageSize(size)
                          setCompetitionPage(1)
                          setCompetitionPageSizeDropdownOpen(false)
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
                setCompetitionPage((page) => Math.max(1, page - 1))
              }
              disabled={competitionPage <= 1 || competitionLoading}
            >
              上一页
            </button>
            <span className="competition-page-info">
              第 {competitionPage} / {competitionMaxPage} 页
            </span>
            <button
              type="button"
              onClick={() =>
                setCompetitionPage((page) => page + 1)
              }
              disabled={
                competitionPage >= competitionMaxPage ||
                competitionLoading
              }
            >
              下一页
            </button>
            </div>
          </>
        )}
      </div>
      {competitionAlertOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-title">
              {competitionAlertTitle || '提示'}
            </div>
            <div className="admin-modal-message">{competitionAlertMessage}</div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-primary-btn"
                onClick={() => setCompetitionAlertOpen(false)}
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
