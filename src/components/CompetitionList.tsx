import { useEffect, useState } from 'react'
import { fetchCompetitionList, type CompetitionItem } from '../api/competition'
import { formatDateTimeText } from '../utils/datetime'

const PAGE_SIZE = 10

type Props = {
  onSelect?: (item: CompetitionItem) => void
}

export default function CompetitionList({ onSelect }: Props) {
  const [items, setItems] = useState<CompetitionItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load(page)
  }, [page])

  async function load(targetPage: number) {
    setLoading(true)
    setError('')
    try {
      const res = await fetchCompetitionList(targetPage, PAGE_SIZE)
      if (!res.ok || !res.data || !res.data.data) {
        setError(res.data?.message ?? '获取比赛列表失败')
        return
      }
      const data = res.data.data
      setItems(data.list)
      setTotal(data.total)
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const maxPage = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1

  function getStatusLabel(item: CompetitionItem) {
    const now = Date.now()
    const startAt = new Date(item.start_time).getTime()
    const endAt = new Date(item.end_time).getTime()
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) return ''
    if (now < startAt) return '未开始'
    if (now >= startAt && now < endAt) return '进行中'
    return '已结束'
  }

  function getStatusTone(item: CompetitionItem) {
    const now = Date.now()
    const startAt = new Date(item.start_time).getTime()
    const endAt = new Date(item.end_time).getTime()
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) return ''
    if (now < startAt) return 'upcoming'
    if (now >= startAt && now < endAt) return 'running'
    return 'finished'
  }

  return (
    <div className="competition-page">
      <div className="competition-header">
        <h2>比赛列表</h2>
        <div className="competition-actions">
          <button
            type="button"
            className="competition-refresh-btn"
            onClick={() => load(page)}
            disabled={loading}
            aria-label="刷新比赛列表"
          >
            ↻
          </button>
        </div>
      </div>
      {error && <div className="competition-error">{error}</div>}
      <div className="competition-list">
        {loading ? (
          <div className="competition-empty">加载中…</div>
        ) : items.length === 0 ? (
          <div className="competition-empty">暂无比赛</div>
        ) : (
          <div className="competition-card-list">
            {items.map((item) => (
              <div
                key={item.id}
                className="competition-card"
                onClick={() => onSelect?.(item)}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
              >
                <div className="competition-card-title">{item.name}</div>
                <div className="competition-card-meta">
                  <span
                    className={
                      'competition-card-status' +
                      (getStatusTone(item)
                        ? ' competition-card-status-' + getStatusTone(item)
                        : '')
                    }
                  >
                    <span className="competition-card-status-dot" />
                    <span>{getStatusLabel(item)}</span>
                  </span>
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
      </div>
      <div className="competition-pagination">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          上一页
        </button>
        <span className="competition-page-info">
          第 {page} / {maxPage} 页
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= maxPage || loading}
        >
          下一页
        </button>
      </div>
    </div>
  )
}
