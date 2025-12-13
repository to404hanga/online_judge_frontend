import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav'
import { fetchUserInfo, type UserInfo } from '../api/user'
import {
  fetchProblemList,
  type ProblemItem,
  type ProblemOrderBy,
} from '../api/problem'
import { formatDateTimeText } from '../utils/datetime'

type Props = {
  onLogout: () => void
}

type AdminSection = 'problem' | 'competition' | 'user'

export default function AdminPage({ onLogout }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [section, setSection] = useState<AdminSection>('problem')
  const [problems, setProblems] = useState<ProblemItem[]>([])
  const [problemLoading, setProblemLoading] = useState(false)
  const [problemError, setProblemError] = useState('')
  const [problemPage, setProblemPage] = useState(1)
  const [problemTotal, setProblemTotal] = useState(0)
  const [problemOrderField, setProblemOrderField] =
    useState<ProblemOrderBy>('id')
  const [problemOrderDesc, setProblemOrderDesc] = useState(false)
  const [problemOrderDropdownOpen, setProblemOrderDropdownOpen] =
    useState(false)

  const PROBLEM_PAGE_SIZE = 10

  useEffect(() => {
    void loadUser()
  }, [])

  useEffect(() => {
    if (section !== 'problem') return
    void loadProblems(problemPage, problemOrderField, problemOrderDesc)
  }, [section, problemPage, problemOrderField, problemOrderDesc])

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

  async function loadProblems(
    targetPage: number,
    orderBy: ProblemOrderBy,
    desc: boolean,
  ) {
    setProblemLoading(true)
    setProblemError('')
    try {
      const res = await fetchProblemList(
        targetPage,
        PROBLEM_PAGE_SIZE,
        orderBy,
        desc,
      )
      if (!res.ok || !res.data || !res.data.data) {
        setProblemError(res.data?.message ?? '获取题目列表失败')
        return
      }
      const data = res.data.data
      setProblems(data.list)
      setProblemTotal(data.total)
    } catch {
      setProblemError('网络错误，请稍后重试')
    } finally {
      setProblemLoading(false)
    }
  }

  const problemMaxPage =
    problemTotal > 0 ? Math.ceil(problemTotal / PROBLEM_PAGE_SIZE) : 1

  const problemOrderLabel =
    problemOrderField === 'id'
      ? '按 ID'
      : problemOrderField === 'created_at'
        ? '按创建时间'
        : '按更新时间'

  function renderSection() {
    if (section === 'problem') {
      return (
        <div className="problem-list">
          <div className="problem-list-header">
            <div className="problem-list-title">题目管理</div>
            <div className="problem-list-subtitle">
              这里将用于管理题目列表、题目内容与测试数据等功能。
            </div>
          </div>
          {problemError && (
            <div className="competition-error">{problemError}</div>
          )}
          {problemLoading && !problemError && (
            <div className="competition-empty">正在加载题目列表…</div>
          )}
          {!problemLoading && !problemError && problems.length === 0 && (
            <div className="competition-empty">暂无题目</div>
          )}
          {!problemLoading && !problemError && problems.length > 0 && (
            <>
              <div className="problem-list-toolbar">
                <div className="problem-sort-group">
                  <span className="problem-sort-label">排序</span>
                  <div className="problem-sort-select-wrapper">
                    <button
                      type="button"
                      className="problem-sort-select"
                      onClick={() =>
                        setProblemOrderDropdownOpen((open) => !open)
                      }
                      disabled={problemLoading}
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
                            setProblemOrderField('id')
                            setProblemOrderDropdownOpen(false)
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
                            setProblemOrderField('created_at')
                            setProblemOrderDropdownOpen(false)
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
                            setProblemOrderField('updated_at')
                            setProblemOrderDropdownOpen(false)
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
                    onClick={() => setProblemOrderDesc(false)}
                    disabled={problemLoading}
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
                    onClick={() => setProblemOrderDesc(true)}
                    disabled={problemLoading}
                  >
                    降序
                  </button>
                </div>
              </div>
              <div className="problem-list-table">
                <div className="problem-list-row problem-list-row-header">
                  <div className="problem-col-id">ID</div>
                  <div className="problem-col-title">标题</div>
                  <div className="problem-col-status-header">状态</div>
                  <div className="problem-col-visible">可见性</div>
                  <div className="problem-col-limits">限制</div>
                  <div className="problem-col-time">创建时间</div>
                  <div className="problem-col-time">更新时间</div>
                  <div className="problem-col-actions">操作</div>
                </div>
                {problems.map((p) => (
                  <div key={p.id} className="problem-list-row">
                    <div className="problem-col-id">#{p.id}</div>
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
                      >
                        👁
                      </button>
                      <button
                        type="button"
                        className="problem-action-btn"
                        aria-label="修改内容"
                        title="修改内容"
                      >
                        ✏
                      </button>
                      <button
                        type="button"
                        className="problem-action-btn problem-action-danger"
                        aria-label="删除题目"
                        title="删除题目"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="competition-pagination">
                <button
                  type="button"
                  onClick={() =>
                    setProblemPage((p) => Math.max(1, p - 1))
                  }
                  disabled={problemPage <= 1 || problemLoading}
                >
                  上一页
                </button>
                <span className="competition-page-info">
                  第 {problemPage} / {problemMaxPage} 页
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setProblemPage((p) =>
                      Math.min(problemMaxPage, p + 1),
                    )
                  }
                  disabled={
                    problemPage >= problemMaxPage || problemLoading
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
    if (section === 'competition') {
      return (
        <div className="admin-placeholder">
          <h2 className="admin-placeholder-title">比赛管理</h2>
          <p className="admin-placeholder-text">
            这里将用于创建与编辑比赛、配置赛程与参赛规则等功能。
          </p>
        </div>
      )
    }
    return (
      <div className="admin-placeholder">
        <h2 className="admin-placeholder-title">用户管理</h2>
        <p className="admin-placeholder-text">
          这里将用于查看与管理用户信息、角色与状态等功能。
        </p>
      </div>
    )
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
                    请选择需要管理的模块
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
