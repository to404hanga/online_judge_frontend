import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav'
import { fetchUserInfo, type UserInfo } from '../api/user'
import AdminProblemSection from '../components/AdminProblemSection'
import AdminCompetitionSection from '../components/AdminCompetitionSection'
import AdminUserSection from '../components/AdminUserSection'
import LoginPage from './Login'

type Props = {
  onLogout: () => void
}

type AdminSection = 'problem' | 'competition' | 'user'

export default function AdminPage({ onLogout }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [section, setSection] = useState<AdminSection>('problem')

  useEffect(() => {
    void loadUser()
  }, [])

  async function loadUser() {
    setLoading(true)
    try {
      const res = await fetchUserInfo()
      if (res.ok && res.data) {
        setUser(res.data)
      } else {
        setError('获取管理员信息失败，请重新登录')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const adminSubtitleText =
    section === 'problem'
      ? '这里将用于管理题目列表、题目内容与测试数据等功能。'
      : section === 'competition'
        ? '这里将用于创建与编辑比赛、配置赛程与参赛规则等功能。'
        : '这里将用于查看与管理用户信息、角色与状态等功能。'

  function renderSection() {
    if (section === 'problem') {
      return <AdminProblemSection />
    }
    if (section === 'competition') {
      return <AdminCompetitionSection />
    }
    if (section === 'user') {
      return <AdminUserSection currentUsername={user?.username} />
    }
    return <LoginPage />
  }

  return (
    <div className="app-shell">
      <TopNav
        title="Online Judge 管理后台"
        username={user?.username}
        realname={user?.realname}
        onLogout={onLogout}
        onTitleClick={() => setSection('problem')}
      />
      <main className="page-container">
        <div className="page-content">
          <div className="admin-page">
            {loading && (
              <div className="page-message">正在加载管理员信息…</div>
            )}
            {error && !loading && (
              <div className="page-error">{error}</div>
            )}
            {!loading && !error && (
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-title">管理控制台</div>
                  <div className="admin-card-subtitle">
                    {adminSubtitleText}
                  </div>
                </div>
                <div className="admin-menu">
                  <button
                    type="button"
                    className={
                      'admin-menu-item' +
                      (section === 'problem'
                        ? ' admin-menu-item-active'
                        : '')
                    }
                    onClick={() => setSection('problem')}
                  >
                    题目管理
                  </button>
                  <button
                    type="button"
                    className={
                      'admin-menu-item' +
                      (section === 'competition'
                        ? ' admin-menu-item-active'
                        : '')
                    }
                    onClick={() => setSection('competition')}
                  >
                    比赛管理
                  </button>
                  <button
                    type="button"
                    className={
                      'admin-menu-item' +
                      (section === 'user' ? ' admin-menu-item-active' : '')
                    }
                    onClick={() => setSection('user')}
                  >
                    用户管理
                  </button>
                </div>
                <div className="admin-card-body">{renderSection()}</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

