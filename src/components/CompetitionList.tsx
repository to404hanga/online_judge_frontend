import { useEffect, useState } from 'react'
import { fetchCompetitionList, type CompetitionItem } from '../api/competition'

const PAGE_SIZE = 10

export default function CompetitionList() {
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

  return (
    <div className="competition-page">
      <div className="competition-header">
        <h2>比赛列表</h2>
        <div className="competition-actions">
          <button
            type="button"
            onClick={() => load(page)}
            disabled={loading}
          >
            刷新
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
          <table className="competition-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>状态</th>
                <th>开始时间</th>
                <th>结束时间</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.status === 1 ? '已发布' : item.status}</td>
                  <td>{item.start_time}</td>
                  <td>{item.end_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
