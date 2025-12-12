import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav'
import CompetitionList from '../components/CompetitionList'
import { fetchUserInfo, type UserInfo } from '../api/user'

type Props = {
  onLogout: () => void
}

export default function DashboardPage({ onLogout }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadUser()
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
      return <CompetitionList />
    }

  return (
    <div className="app-shell">
      <TopNav
        title="Online Judge"
        username={user?.username}
        realname={user?.realname}
        onLogout={onLogout}
      />
      <main className="page-container">
        <div className="page-content">{renderContent()}</div>
      </main>
    </div>
  )
}
