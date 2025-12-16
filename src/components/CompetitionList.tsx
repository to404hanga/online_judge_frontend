import { useEffect, useState, type MouseEvent } from 'react'
import {
  fetchUserCompetitionList,
  type CompetitionItem,
  type CompetitionOrderBy,
} from '../api/competition'
import { formatDateTimeText } from '../utils/datetime'

type Props = {
  onSelect?: (item: CompetitionItem) => void
}

type CompetitionRuntimeTone = 'upcoming' | 'running' | 'finished'
type CompetitionPhaseFilter = 'all' | '0' | '1' | '2'

const DEFAULT_PAGE_SIZE = 10

export default function CompetitionList({ onSelect }: Props) {
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [orderField, setOrderField] =
    useState<CompetitionOrderBy>('start_time')
  const [orderDesc, setOrderDesc] = useState(true)
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [nameFilterInput, setNameFilterInput] = useState('')
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false)
  const [pageSizeDropUp, setPageSizeDropUp] = useState(false)
  const [phaseFilter, setPhaseFilter] =
    useState<CompetitionPhaseFilter>('all')
  const [phaseFilterOpen, setPhaseFilterOpen] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    void loadCompetitions(
      page,
      pageSize,
      orderField,
      orderDesc,
      phaseFilter,
      nameFilter,
    )
  }, [
    page,
    pageSize,
    orderField,
    orderDesc,
    nameFilter,
    phaseFilter,
    refreshToken,
  ])

  async function loadCompetitions(
    targetPage: number,
    pageSizeValue: number,
    orderBy: CompetitionOrderBy,
    desc: boolean,
    phase: CompetitionPhaseFilter,
    name: string,
  ) {
    setLoading(true)
    setError('')
    try {
      const trimmedName = name.trim()
      const phaseValue =
        phase === 'all' ? undefined : Number(phase)
      const res = await fetchUserCompetitionList(
        targetPage,
        pageSizeValue,
        orderBy,
        desc,
        phaseValue,
        trimmedName ? trimmedName : undefined,
      )
      if (!res.ok || !res.data || !res.data.data) {
        setCompetitions([])
        setTotal(0)
        setError(res.data?.message ?? '获取比赛列表失败')
        return
      }
      const data = res.data.data
      setCompetitions(data.list)
      setTotal(data.total)
    } catch {
      setCompetitions([])
      setTotal(0)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const maxPage =
    total > 0 ? Math.ceil(total / pageSize) : 1

  const orderLabel =
    orderField === 'start_time' ? '按开始时间' : '按结束时间'

  const pageSizeLabel = `${pageSize}`

  const phaseFilterLabel =
    phaseFilter === 'all'
      ? '全部比赛'
      : phaseFilter === '0'
        ? '仅未开始'
        : phaseFilter === '1'
          ? '仅进行中'
          : '仅已结束'

  function applyNameSearch() {
    setNameFilter(nameFilterInput.trim())
    setPage(1)
  }

  function handleResetFilters() {
    setPage(1)
    setPageSize(DEFAULT_PAGE_SIZE)
    setOrderField('start_time')
    setOrderDesc(true)
    setNameFilter('')
    setNameFilterInput('')
    setOrderDropdownOpen(false)
    setPageSizeDropdownOpen(false)
    setPhaseFilter('all')
    setPhaseFilterOpen(false)
    setRefreshToken((v) => v + 1)
  }

  function handleChangePhaseFilter(value: CompetitionPhaseFilter) {
    setPhaseFilter(value)
    setPage(1)
    setPhaseFilterOpen(false)
  }

  function handleChangePageSizeDropdownOpen(
    open: boolean,
    event?: MouseEvent<HTMLButtonElement>,
  ) {
    if (open && !pageSizeDropdownOpen && event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const estimatedMenuHeight = 180
      setPageSizeDropUp(spaceBelow < estimatedMenuHeight)
    }
    setPageSizeDropdownOpen(open)
  }

  function getRuntimeStatusTone(
    item: CompetitionItem,
  ): CompetitionRuntimeTone {
    const now = Date.now()
    const startAt = new Date(item.start_time).getTime()
    const endAt = new Date(item.end_time).getTime()
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt))
      return 'upcoming'
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
      <span className={`competition-runtime-pill ${toneClass}`}>
        {text}
      </span>
    )
  }

  return (
    <div className="competition-admin-list">
      <div className="competition-header">
        <h2>比赛列表</h2>
      </div>
      <div className="problem-list-toolbar">
        <div className="problem-toolbar-right">
          <button
            type="button"
            className="competition-refresh-btn"
            onClick={handleResetFilters}
            disabled={loading}
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
                onClick={applyNameSearch}
                disabled={loading}
                aria-label="搜索"
                title="搜索"
              >
                🔍
              </button>
              <input
                type="text"
                className="problem-search-input"
                placeholder="搜索比赛名称"
                value={nameFilterInput}
                onChange={(e) => setNameFilterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    applyNameSearch()
                  }
                }}
                disabled={loading}
              />
            </div>
          </div>
          <div className="problem-sort-group">
            <span className="problem-sort-label">比赛状态</span>
            <div className="problem-sort-select-wrapper">
              <button
                type="button"
                className={
                  'problem-sort-select' +
                  (phaseFilterOpen ? ' problem-sort-select-open' : '')
                }
                onClick={() =>
                  setPhaseFilterOpen((open) => !open)
                }
                disabled={loading}
              >
                {phaseFilterLabel}
              </button>
              {phaseFilterOpen && (
                <div className="problem-sort-menu">
                  <button
                    type="button"
                    className={
                      'problem-sort-menu-item' +
                      (phaseFilter === 'all'
                        ? ' problem-sort-menu-item-active'
                        : '')
                    }
                    onClick={() => handleChangePhaseFilter('all')}
                  >
                    全部比赛
                  </button>
                  <button
                    type="button"
                    className={
                      'problem-sort-menu-item' +
                      (phaseFilter === '0'
                        ? ' problem-sort-menu-item-active'
                        : '')
                    }
                    onClick={() => handleChangePhaseFilter('0')}
                  >
                    未开始
                  </button>
                  <button
                    type="button"
                    className={
                      'problem-sort-menu-item' +
                      (phaseFilter === '1'
                        ? ' problem-sort-menu-item-active'
                        : '')
                    }
                    onClick={() => handleChangePhaseFilter('1')}
                  >
                    进行中
                  </button>
                  <button
                    type="button"
                    className={
                      'problem-sort-menu-item' +
                      (phaseFilter === '2'
                        ? ' problem-sort-menu-item-active'
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
          <div className="problem-sort-group">
            <span className="problem-sort-label">排序</span>
            <div className="problem-sort-select-wrapper">
              <button
                type="button"
                className={
                  'problem-sort-select' +
                  (orderDropdownOpen
                    ? ' problem-sort-select-open'
                    : '')
                }
                onClick={() =>
                  setOrderDropdownOpen((open) => !open)
                }
                disabled={loading}
              >
                {orderLabel}
              </button>
              {orderDropdownOpen && (
                <div className="problem-sort-menu">
                  <button
                    type="button"
                    className={
                      'problem-sort-menu-item' +
                      (orderField === 'start_time'
                        ? ' problem-sort-menu-item-active'
                        : '')
                    }
                    onClick={() => {
                      setOrderField('start_time')
                      setOrderDropdownOpen(false)
                    }}
                  >
                    按开始时间
                  </button>
                  <button
                    type="button"
                    className={
                      'problem-sort-menu-item' +
                      (orderField === 'end_time'
                        ? ' problem-sort-menu-item-active'
                        : '')
                    }
                    onClick={() => {
                      setOrderField('end_time')
                      setOrderDropdownOpen(false)
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
                (!orderDesc
                  ? ' problem-sort-order-btn-active'
                  : '')
              }
              onClick={() => setOrderDesc(false)}
              disabled={loading}
            >
              升序
            </button>
            <button
              type="button"
              className={
                'problem-sort-order-btn' +
                (orderDesc
                  ? ' problem-sort-order-btn-active'
                  : '')
              }
              onClick={() => setOrderDesc(true)}
              disabled={loading}
            >
              降序
            </button>
          </div>
        </div>
      </div>
      {error && <div className="competition-error">{error}</div>}
      {!error && (
        <>
          {loading && competitions.length === 0 && (
            <div className="competition-empty">正在加载比赛列表…</div>
          )}
          {!loading && competitions.length === 0 && (
            <div className="competition-empty">暂无比赛</div>
          )}
          {!loading && competitions.length > 0 && (
            <div className="competition-card-list">
              {competitions.map((item) => (
                <div
                  key={item.id}
                  className="competition-card"
                  onClick={() => onSelect?.(item)}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                >
                  <div className="competition-card-title">{item.name}</div>
                  <div className="competition-card-meta">
                    <span>{renderRuntimePill(item)}</span>
                    <div className="competition-card-meta-right">
                      <span className="competition-time">
                        <span className="competition-time-icon">⏱</span>
                        <span className="competition-time-label">开始时间</span>
                        <span className="competition-time-value">
                          {formatDateTimeText(item.start_time)}
                        </span>
                      </span>
                      <span className="competition-detail-separator" />
                      <span className="competition-time">
                        <span className="competition-time-icon">🏁</span>
                        <span className="competition-time-label">结束时间</span>
                        <span className="competition-time-value">
                          {formatDateTimeText(item.end_time)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="competition-pagination">
            <div className="problem-page-size-group">
              <span className="problem-page-size-label">每页</span>
              <div className="problem-page-size-select-wrapper">
                <button
                  type="button"
                  className={
                    'problem-sort-select problem-page-size-select' +
                    (pageSizeDropdownOpen
                      ? ' problem-sort-select-open'
                      : '')
                  }
                  onClick={(e) =>
                    handleChangePageSizeDropdownOpen(
                      !pageSizeDropdownOpen,
                      e,
                    )
                  }
                  disabled={loading}
                >
                  {pageSizeLabel}
                </button>
                {pageSizeDropdownOpen && (
                  <div
                    className={
                      'problem-sort-menu' +
                      (pageSizeDropUp
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
                          (pageSize === size
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          setPageSize(size)
                          setPage(1)
                          setPageSizeDropdownOpen(false)
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
                setPage((value) => Math.max(1, value - 1))
              }
              disabled={page <= 1 || loading}
            >
              上一页
            </button>
            <span className="competition-page-info">
              第 {page} / {maxPage} 页
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((value) => value + 1)
              }
              disabled={page >= maxPage || loading}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  )
}
