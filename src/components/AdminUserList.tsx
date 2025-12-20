import type { MouseEvent } from 'react'
import type { AdminUserItem, UserOrderBy } from '../api/user'
import { formatDateTimeText } from '../utils/datetime'

type AdminUserListProps = {
  users: AdminUserItem[]
  userLoading: boolean
  userError: string
  userNotice: string
  currentUsername?: string
  onOpenCreateUserModal: () => void
  userPage: number
  userMaxPage: number
  userPageSize: number
  userPageSizeLabel: string
  userPageSizeDropdownOpen: boolean
  userPageSizeDropUp: boolean
  userOrderField: UserOrderBy
  userOrderDesc: boolean
  userOrderLabel: string
  userOrderDropdownOpen: boolean
  userRoleFilter: 'all' | '0' | '1'
  userRoleFilterLabel: string
  userRoleFilterOpen: boolean
  userStatusFilter: 'all' | '0' | '1'
  userStatusFilterLabel: string
  userStatusFilterOpen: boolean
  usernameFilterInput: string
  realnameFilterInput: string
  onChangeUsernameFilterInput: (value: string) => void
  onChangeRealnameFilterInput: (value: string) => void
  onApplySearch: () => void
  onResetFilters: () => void
  onToggleOrderDropdown: () => void
  onChangeOrderField: (field: UserOrderBy) => void
  onChangeOrderDesc: (desc: boolean) => void
  onToggleRoleFilterOpen: () => void
  onChangeRoleFilter: (value: 'all' | '0' | '1') => void
  onToggleStatusFilterOpen: () => void
  onChangeStatusFilter: (value: 'all' | '0' | '1') => void
  onChangePageSizeDropdownOpen: (
    open: boolean,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void
  onChangePageSize: (size: number) => void
  onChangePage: (page: number) => void
  userLoadingForControls: boolean
  userActionLoadingMap: Record<number, boolean>
  onToggleUserStatus: (userId: number, currentStatus: number) => void
  onDeleteUser: (userId: number) => void
  onResetPassword: (userId: number) => void
}

export default function AdminUserList(props: AdminUserListProps) {
  const {
    users,
    userLoading,
    userError,
    userNotice,
    currentUsername,
    onOpenCreateUserModal,
    userPage,
    userMaxPage,
    userPageSize,
    userPageSizeLabel,
    userPageSizeDropdownOpen,
    userPageSizeDropUp,
    userOrderField,
    userOrderDesc,
    userOrderLabel,
    userOrderDropdownOpen,
    userRoleFilter,
    userRoleFilterLabel,
    userRoleFilterOpen,
    userStatusFilter,
    userStatusFilterLabel,
    userStatusFilterOpen,
    usernameFilterInput,
    realnameFilterInput,
    onChangeUsernameFilterInput,
    onChangeRealnameFilterInput,
    onApplySearch,
    onResetFilters,
    onToggleOrderDropdown,
    onChangeOrderField,
    onChangeOrderDesc,
    onToggleRoleFilterOpen,
    onChangeRoleFilter,
    onToggleStatusFilterOpen,
    onChangeStatusFilter,
    onChangePageSizeDropdownOpen,
    onChangePageSize,
    onChangePage,
    userLoadingForControls,
    userActionLoadingMap,
    onToggleUserStatus,
    onDeleteUser,
    onResetPassword,
  } = props

  function renderRolePill(role: number) {
    const text = role === 1 ? '管理员' : '普通用户'
    const toneClass = role === 1 ? 'problem-status-pill-active' : 'problem-status-pill-pending'
    return <span className={`problem-status-pill ${toneClass}`}>{text}</span>
  }

  function renderStatusPill(status: number) {
    const text = status === 0 ? '正常' : '禁用'
    const toneClass = status === 0 ? 'problem-status-pill-active' : 'problem-status-pill-deleted'
    return <span className={`problem-status-pill ${toneClass}`}>{text}</span>
  }

  return (
    <div className="problem-list">
      {userError && <div className="competition-error">{userError}</div>}
      {!userError && userNotice && <div className="competition-empty">{userNotice}</div>}
      {!userError && (
        <>
          {userLoading && <div className="competition-empty">正在加载用户列表…</div>}
          <div className="problem-list-toolbar">
            <div className="problem-toolbar-right" style={{ marginLeft: 'auto' }}>
              <div className="problem-search-group">
                <button
                  type="button"
                  className="competition-refresh-btn"
                  onClick={onResetFilters}
                  disabled={userLoadingForControls}
                  aria-label="重置筛选并刷新用户列表"
                  title="重置筛选并刷新"
                >
                  ↻
                </button>
                <div className="problem-search-input-wrapper">
                  <button
                    type="button"
                    className="problem-search-icon-btn"
                    onClick={onApplySearch}
                    disabled={userLoadingForControls}
                    aria-label="搜索"
                    title="搜索"
                  >
                    🔍
                  </button>
                  <input
                    type="text"
                    className="problem-search-input"
                    placeholder="按学号前缀查询"
                    value={usernameFilterInput}
                    onChange={(e) => onChangeUsernameFilterInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onApplySearch()
                    }}
                    disabled={userLoadingForControls}
                  />
                </div>
                <div className="problem-search-input-wrapper">
                  <button
                    type="button"
                    className="problem-search-icon-btn"
                    onClick={onApplySearch}
                    disabled={userLoadingForControls}
                    aria-label="搜索"
                    title="搜索"
                  >
                    🔍
                  </button>
                  <input
                    type="text"
                    className="problem-search-input"
                    placeholder="按真实姓名模糊查询"
                    value={realnameFilterInput}
                    onChange={(e) => onChangeRealnameFilterInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onApplySearch()
                    }}
                    disabled={userLoadingForControls}
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
                      (userOrderDropdownOpen ? ' problem-sort-select-open' : '')
                    }
                    onClick={onToggleOrderDropdown}
                    disabled={userLoadingForControls}
                  >
                    {userOrderLabel}
                  </button>
                  {userOrderDropdownOpen && (
                    <div className="problem-sort-menu">
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (userOrderField === 'id' ? ' problem-sort-menu-item-active' : '')
                        }
                        onClick={() => onChangeOrderField('id')}
                      >
                        按 ID
                      </button>
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (userOrderField === 'username' ? ' problem-sort-menu-item-active' : '')
                        }
                        onClick={() => onChangeOrderField('username')}
                      >
                        按学号
                      </button>
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (userOrderField === 'realname' ? ' problem-sort-menu-item-active' : '')
                        }
                        onClick={() => onChangeOrderField('realname')}
                      >
                        按姓名
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={
                    'problem-sort-order-btn' +
                    (!userOrderDesc ? ' problem-sort-order-btn-active' : '')
                  }
                  onClick={() => onChangeOrderDesc(false)}
                  disabled={userLoadingForControls}
                >
                  升序
                </button>
                <button
                  type="button"
                  className={
                    'problem-sort-order-btn' +
                    (userOrderDesc ? ' problem-sort-order-btn-active' : '')
                  }
                  onClick={() => onChangeOrderDesc(true)}
                  disabled={userLoadingForControls}
                >
                  降序
                </button>
              </div>
            </div>
          </div>

          <div className="user-list-table">
            <div className="user-list-row user-list-row-header">
              <div className="user-col-id">ID</div>
              <div className="user-col-username">学号</div>
              <div className="user-col-realname">姓名</div>
              <div className="user-col-role-header">
                <div className="problem-filter-header">
                  <span>角色</span>
                  <div className="problem-filter-wrapper">
                    <button
                      type="button"
                      className={
                        'problem-filter-icon-btn' +
                        (userRoleFilter !== 'all' ? ' problem-filter-icon-btn-active' : '') +
                        (userRoleFilterOpen ? ' problem-filter-icon-btn-open' : '')
                      }
                      onClick={onToggleRoleFilterOpen}
                      disabled={userLoadingForControls}
                      aria-label={userRoleFilterLabel}
                    />
                    {userRoleFilterOpen && (
                      <div className="problem-filter-menu">
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (userRoleFilter === 'all' ? ' problem-filter-menu-item-active' : '')
                          }
                          onClick={() => onChangeRoleFilter('all')}
                        >
                          全部
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (userRoleFilter === '0' ? ' problem-filter-menu-item-active' : '')
                          }
                          onClick={() => onChangeRoleFilter('0')}
                        >
                          普通用户
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (userRoleFilter === '1' ? ' problem-filter-menu-item-active' : '')
                          }
                          onClick={() => onChangeRoleFilter('1')}
                        >
                          管理员
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="user-col-status-header">
                <div className="problem-filter-header">
                  <span>状态</span>
                  <div className="problem-filter-wrapper">
                    <button
                      type="button"
                      className={
                        'problem-filter-icon-btn' +
                        (userStatusFilter !== 'all' ? ' problem-filter-icon-btn-active' : '') +
                        (userStatusFilterOpen ? ' problem-filter-icon-btn-open' : '')
                      }
                      onClick={onToggleStatusFilterOpen}
                      disabled={userLoadingForControls}
                      aria-label={userStatusFilterLabel}
                    />
                    {userStatusFilterOpen && (
                      <div className="problem-filter-menu">
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (userStatusFilter === 'all' ? ' problem-filter-menu-item-active' : '')
                          }
                          onClick={() => onChangeStatusFilter('all')}
                        >
                          全部
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (userStatusFilter === '0' ? ' problem-filter-menu-item-active' : '')
                          }
                          onClick={() => onChangeStatusFilter('0')}
                        >
                          正常
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (userStatusFilter === '1' ? ' problem-filter-menu-item-active' : '')
                          }
                          onClick={() => onChangeStatusFilter('1')}
                        >
                          禁用
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="user-col-time">创建时间</div>
              <div className="user-col-time">更新时间</div>
              <div className="user-col-actions">操作</div>
            </div>
            <div className="user-list-body">
              {!userLoading && users.length === 0 && (
                <div className="user-list-row user-list-row-empty">
                  <div className="user-col-id" />
                  <div className="user-col-username" />
                  <div className="user-col-realname">暂无用户</div>
                  <div className="user-col-role" />
                  <div className="user-col-status" />
                  <div className="user-col-time" />
                  <div className="user-col-time" />
                  <div className="user-col-actions" />
                </div>
              )}
              {!userLoading &&
                users.length > 0 &&
                users.map((u) => {
                  const isSelf = !!currentUsername && u.username === currentUsername
                  return (
                    <div key={u.id} className="user-list-row">
                    <div className="user-col-id">{u.id}</div>
                    <div className="user-col-username">{u.username}</div>
                    <div className="user-col-realname">{u.realname}</div>
                    <div className="user-col-role">{renderRolePill(u.role)}</div>
                    <div className="user-col-status">{renderStatusPill(u.status)}</div>
                    <div className="user-col-time">{formatDateTimeText(u.created_at)}</div>
                    <div className="user-col-time">{formatDateTimeText(u.updated_at)}</div>
                    <div className="user-col-actions">
                      <div className="user-actions">
                        <button
                          type="button"
                          className={
                            'user-action-btn' + (u.status === 0 ? ' user-action-btn-danger' : '')
                          }
                          onClick={() => onToggleUserStatus(u.id, u.status)}
                          disabled={userLoadingForControls || !!userActionLoadingMap[u.id] || isSelf}
                          aria-label={u.status === 0 ? '禁用用户' : '解禁用户'}
                          title={
                            isSelf
                              ? '不能对自己操作'
                              : u.status === 0
                                ? '禁用'
                                : '解禁'
                          }
                        >
                          {u.status === 0 ? '⊘' : '⬤'}
                        </button>
                        <button
                          type="button"
                          className="user-action-btn"
                          onClick={() => onResetPassword(u.id)}
                          disabled={userLoadingForControls || !!userActionLoadingMap[u.id] || isSelf}
                          aria-label="重置密码"
                          title={isSelf ? '不能对自己操作' : '重置密码'}
                        >
                          ⚿
                        </button>
                        <button
                          type="button"
                          className="user-action-btn user-action-btn-danger"
                          onClick={() => onDeleteUser(u.id)}
                          disabled={userLoadingForControls || !!userActionLoadingMap[u.id] || isSelf}
                          aria-label="删除用户"
                          title={isSelf ? '不能对自己操作' : '删除'}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                  )
                })}
            </div>
          </div>

          <div className="competition-pagination">
            <button
              type="button"
              className="problem-add-button"
              onClick={onOpenCreateUserModal}
              disabled={userLoadingForControls}
              aria-label="添加用户"
              title="添加用户"
            >
              +
            </button>
            <div className="problem-page-size-group">
              <span className="problem-page-size-label">每页</span>
              <div className="problem-page-size-select-wrapper">
                <button
                  type="button"
                  className={
                    'problem-sort-select problem-page-size-select' +
                    (userPageSizeDropdownOpen ? ' problem-sort-select-open' : '')
                  }
                  onClick={(e) => {
                    onChangePageSizeDropdownOpen(!userPageSizeDropdownOpen, e)
                  }}
                  disabled={userLoadingForControls}
                >
                  {userPageSizeLabel}
                </button>
                {userPageSizeDropdownOpen && (
                  <div
                    className={
                      'problem-sort-menu' +
                      (userPageSizeDropUp ? ' problem-sort-menu-up' : '')
                    }
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (userPageSize === size ? ' problem-sort-menu-item-active' : '')
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
              onClick={() => onChangePage(Math.max(1, userPage - 1))}
              disabled={userPage <= 1 || userLoadingForControls}
            >
              上一页
            </button>
            <span className="competition-page-info">
              第 {userPage} / {userMaxPage} 页
            </span>
            <button
              type="button"
              onClick={() => onChangePage(Math.min(userMaxPage, userPage + 1))}
              disabled={userPage >= userMaxPage || userLoadingForControls}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  )
}

