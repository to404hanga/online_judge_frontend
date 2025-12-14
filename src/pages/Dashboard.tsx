import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav'
import CompetitionList from '../components/CompetitionList'
import { fetchUserInfo, type UserInfo } from '../api/user'
import {
  type CompetitionItem,
  startCompetition,
} from '../api/competition'
import { formatDateTimeText } from '../utils/datetime'

type Props = {
  onLogout: () => void
}

export default function DashboardPage({ onLogout }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'list' | 'detail' | 'running'>('list')
  const [selectedCompetition, setSelectedCompetition] =
    useState<CompetitionItem | null>(null)
  const [startLoading, setStartLoading] = useState(false)
  const [startError, setStartError] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    void loadUser()
  }, [])

  useEffect(() => {
    function updateNow() {
      setNow(Date.now())
    }

    updateNow()

    const secondTimer = window.setInterval(updateNow, 1000)
    const minuteTimer = window.setInterval(updateNow, 60 * 1000)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        updateNow()
      }
    }

    function handleFocus() {
      updateNow()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(secondTimer)
      window.clearInterval(minuteTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  async function loadUser() {
    setLoading(true)
    setError('')
    try {
      const res = await fetchUserInfo()
      if (!res.ok || !res.data) {
        setError('获取用户信息失败，请重新登录')
        return
      }
      setUser(res.data)
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  function handleGoHome() {
    if (!user) return
    setView('list')
    setSelectedCompetition(null)
    setStartError('')
    setStartLoading(false)
  }

  function formatDuration(ms: number) {
    if (ms <= 0) return '0秒'
    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')
    if (days > 0) {
      return `${days}天 ${hh}:${mm}:${ss}`
    }
    return `${hh}:${mm}:${ss}`
  }

  function handleSelectCompetition(item: CompetitionItem) {
    setSelectedCompetition(item)
    setView('detail')
    setStartError('')
  }

  async function handleStartCompetition() {
    if (!selectedCompetition) return
    setStartError('')
    setStartLoading(true)
    try {
      const res = await startCompetition(selectedCompetition.id)
      const data = res.data
      if (!res.ok || !data || data.code !== 200) {
        setStartError(data?.message ?? '开始比赛失败')
        return
      }
      setView('running')
    } catch {
      setStartError('网络错误，请稍后重试')
    } finally {
      setStartLoading(false)
    }
  }

  function renderCompetitionDetail() {
    if (!selectedCompetition) {
      return <div className="page-message">未找到比赛信息</div>
    }
    const startAt = new Date(selectedCompetition.start_time).getTime()
    const endAt = new Date(selectedCompetition.end_time).getTime()
    const nowMs = now
    const canStart = nowMs >= startAt && nowMs < endAt
    let statusText = ''
    if (Number.isFinite(startAt) && Number.isFinite(endAt)) {
      if (nowMs < startAt) {
        statusText = `距离开始还有 ${formatDuration(startAt - nowMs)}`
      } else if (nowMs >= startAt && nowMs < endAt) {
        statusText = `距离结束还有 ${formatDuration(endAt - nowMs)}`
      } else {
        statusText = '比赛已结束'
      }
    }

    return (
      <div className="competition-detail">
        <div className="competition-detail-main">
          <div className="competition-detail-title">
            {selectedCompetition.name}
          </div>
          <div className="competition-detail-meta">
            <span className="competition-time">
              <span className="competition-time-icon">⏱</span>
              <span className="competition-time-label">开始时间</span>
              <span className="competition-time-value">
                {formatDateTimeText(selectedCompetition.start_time)}
              </span>
            </span>
            <span className="competition-detail-separator" />
            <span className="competition-time">
              <span className="competition-time-icon">🏁</span>
              <span className="competition-time-label">结束时间</span>
              <span className="competition-time-value">
                {formatDateTimeText(selectedCompetition.end_time)}
              </span>
            </span>
          </div>
          {startError && (
            <div className="competition-detail-error">{startError}</div>
          )}
          <div className="competition-detail-actions">
            <button
              type="button"
              className="competition-detail-start"
              onClick={handleStartCompetition}
              disabled={!canStart || startLoading}
            >
              {startLoading ? '开始中…' : '开始比赛'}
            </button>
            {statusText && (
              <span className="competition-detail-status">{statusText}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  function renderRunningPlaceholder() {
    return (
      <div className="page-message">
        比赛页面占位，后续在此实现答题功能
      </div>
    )
  }

  function renderContent() {
    if (loading) {
      return <div className="page-message">正在加载用户信息…</div>
    }
    if (error) {
      return <div className="page-error">{error}</div>
    }
    if (!user) {
      return <div className="page-message">未获取到用户信息</div>
    }
    if (user.status !== 0) {
      return <div className="page-error">当前账号已被禁用，请联系管理员</div>
    }
    if (user.role === 1) {
      return (
        <div className="page-message">
          管理员页面占位，后续在此实现管理功能
        </div>
      )
    }
    if (view === 'detail') {
      return renderCompetitionDetail()
    }
    if (view === 'running') {
      return renderRunningPlaceholder()
    }
    return <CompetitionList onSelect={handleSelectCompetition} />
  }

  return (
    <div className="app-shell">
      <TopNav
        title="Online Judge"
        username={user?.username}
        realname={user?.realname}
        onLogout={onLogout}
        onTitleClick={handleGoHome}
      />
      <main className="page-container">
        <div className="page-content">{renderContent()}</div>
      </main>
    </div>
  )
}
