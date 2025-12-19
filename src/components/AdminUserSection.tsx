import { useEffect, useState, type MouseEvent } from 'react'
import {
  deleteAdminUser,
  disableAdminUser,
  enableAdminUser,
  fetchAdminUserList,
  resetAdminUserPassword,
  type AdminUserItem,
  type UserOrderBy,
} from '../api/user'
import AdminUserList from './AdminUserList'

type UserRoleFilter = 'all' | '0' | '1'
type UserStatusFilter = 'all' | '0' | '1'

type Props = {
  currentUsername?: string
}

export default function AdminUserSection({ currentUsername }: Props) {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')
  const [userNotice, setUserNotice] = useState('')
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<number | null>(
    null,
  )
  const [resetPasswordConfirmUserId, setResetPasswordConfirmUserId] = useState<
    number | null
  >(null)
  const [userPage, setUserPage] = useState(1)
  const [userTotal, setUserTotal] = useState(0)
  const [userPageSize, setUserPageSize] = useState(10)
  const [userPageSizeDropdownOpen, setUserPageSizeDropdownOpen] = useState(false)
  const [userPageSizeDropUp, setUserPageSizeDropUp] = useState(false)
  const [userOrderField, setUserOrderField] = useState<UserOrderBy>('id')
  const [userOrderDesc, setUserOrderDesc] = useState(false)
  const [userOrderDropdownOpen, setUserOrderDropdownOpen] = useState(false)
  const [userRoleFilter, setUserRoleFilter] = useState<UserRoleFilter>('all')
  const [userRoleFilterOpen, setUserRoleFilterOpen] = useState(false)
  const [userStatusFilter, setUserStatusFilter] = useState<UserStatusFilter>('all')
  const [userStatusFilterOpen, setUserStatusFilterOpen] = useState(false)
  const [usernameFilter, setUsernameFilter] = useState('')
  const [realnameFilter, setRealnameFilter] = useState('')
  const [usernameFilterInput, setUsernameFilterInput] = useState('')
  const [realnameFilterInput, setRealnameFilterInput] = useState('')
  const [userRefreshToken, setUserRefreshToken] = useState(0)
  const [userActionLoadingMap, setUserActionLoadingMap] = useState<
    Record<number, boolean>
  >({})

  const userMaxPage = userTotal > 0 ? Math.ceil(userTotal / userPageSize) : 1

  useEffect(() => {
    void loadUsers(
      userPage,
      userPageSize,
      userOrderField,
      userOrderDesc,
      userRoleFilter,
      userStatusFilter,
      usernameFilter,
      realnameFilter,
    )
  }, [
    userPage,
    userPageSize,
    userOrderField,
    userOrderDesc,
    userRoleFilter,
    userStatusFilter,
    usernameFilter,
    realnameFilter,
    userRefreshToken,
  ])

  async function loadUsers(
    page: number,
    pageSize: number,
    orderBy: UserOrderBy,
    desc: boolean,
    roleFilter: UserRoleFilter,
    statusFilter: UserStatusFilter,
    username: string,
    realname: string,
  ) {
    setUserLoading(true)
    setUserError('')
    setUserNotice('')
    try {
      const roleValue = roleFilter === 'all' ? undefined : Number(roleFilter)
      const statusValue = statusFilter === 'all' ? undefined : Number(statusFilter)
      const usernameValue = username.trim().length > 0 ? username.trim() : undefined
      const realnameValue = realname.trim().length > 0 ? realname.trim() : undefined

      const res = await fetchAdminUserList(
        page,
        pageSize,
        orderBy,
        desc,
        usernameValue,
        realnameValue,
        roleValue,
        statusValue,
      )
      if (!res.ok || !res.data) {
        setUsers([])
        setUserTotal(0)
        setUserError(res.data?.message ?? '获取用户列表失败')
        return
      }

      if (typeof res.data.code === 'number' && res.data.code !== 200) {
        setUsers([])
        setUserTotal(0)
        setUserError(res.data.message ?? '获取用户列表失败')
        return
      }

      const raw = res.data as unknown as Record<string, unknown>
      const data =
        (raw.data as Record<string, unknown> | undefined) ??
        (raw as Record<string, unknown>)

      const listCandidate =
        (data?.list as unknown) ??
        (data?.user_list as unknown) ??
        (data?.users as unknown) ??
        (data?.rows as unknown)

      const list = Array.isArray(listCandidate) ? (listCandidate as AdminUserItem[]) : null

      const totalCandidate =
        (data?.total as unknown) ??
        (data?.count as unknown) ??
        (data?.total_count as unknown)
      const total = typeof totalCandidate === 'number' ? totalCandidate : 0

      if (list) {
        setUsers(list)
        setUserTotal(total)
        return
      }

      const message =
        typeof raw.message === 'string' ? raw.message.trim().toLowerCase() : ''
      if (typeof raw.code === 'number' && raw.code === 200 && message === 'success') {
        setUsers([])
        setUserTotal(0)
        setUserError('')
        return
      }

      setUsers([])
      setUserTotal(0)
      setUserError('获取用户列表失败：响应体缺少用户列表字段')
    } catch {
      setUsers([])
      setUserTotal(0)
      setUserError('网络错误，请稍后重试')
    } finally {
      setUserLoading(false)
    }
  }

  const userOrderLabel =
    userOrderField === 'id'
      ? '按 ID'
      : userOrderField === 'username'
        ? '按学号'
        : '按姓名'

  const userRoleFilterLabel =
    userRoleFilter === 'all'
      ? '全部角色'
      : userRoleFilter === '0'
        ? '仅普通用户'
        : '仅管理员'

  const userStatusFilterLabel =
    userStatusFilter === 'all'
      ? '全部状态'
      : userStatusFilter === '0'
        ? '仅正常'
        : '仅禁用'

  const userPageSizeLabel = `${userPageSize}`

  const deleteConfirmUser =
    deleteConfirmUserId === null
      ? null
      : users.find((u) => u.id === deleteConfirmUserId) ?? null

  const resetPasswordConfirmUser =
    resetPasswordConfirmUserId === null
      ? null
      : users.find((u) => u.id === resetPasswordConfirmUserId) ?? null

  function isSelfOperation(userId: number) {
    if (!currentUsername) return false
    const target = users.find((u) => u.id === userId)
    return !!target && target.username === currentUsername
  }

  async function handleToggleUserStatus(userId: number, currentStatus: number) {
    setUserError('')
    setUserNotice('')
    setUserActionLoadingMap((prev) => ({ ...prev, [userId]: true }))
    try {
      const res =
        currentStatus === 0 ? await disableAdminUser(userId) : await enableAdminUser(userId)
      if (!res.ok || !res.data) {
        setUserError('用户状态更新失败')
        return
      }
      if (typeof res.data.code === 'number' && res.data.code !== 200) {
        setUserError(res.data.message ?? '用户状态更新失败')
        return
      }
      setUserRefreshToken((v) => v + 1)
    } catch {
      setUserError('网络错误，请稍后重试')
    } finally {
      setUserActionLoadingMap((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
    }
  }

  function handleDeleteUser(userId: number) {
    if (isSelfOperation(userId)) {
      setUserError('不能对自己执行该操作')
      return
    }
    setUserError('')
    setUserNotice('')
    setResetPasswordConfirmUserId(null)
    setDeleteConfirmUserId(userId)
  }

  async function confirmDeleteUser() {
    if (deleteConfirmUserId === null) return
    const ok = await deleteUser(deleteConfirmUserId)
    if (ok) setDeleteConfirmUserId(null)
  }

  async function deleteUser(userId: number) {
    setUserError('')
    setUserNotice('')
    setUserActionLoadingMap((prev) => ({ ...prev, [userId]: true }))
    try {
      const res = await deleteAdminUser(userId)
      if (!res.ok || !res.data) {
        setUserError('删除用户失败')
        return
      }
      if (typeof res.data.code === 'number' && res.data.code !== 200) {
        setUserError(res.data.message ?? '删除用户失败')
        return false
      }
      setUserRefreshToken((v) => v + 1)
      return true
    } catch {
      setUserError('网络错误，请稍后重试')
      return false
    } finally {
      setUserActionLoadingMap((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
    }
  }

  function handleResetPassword(userId: number) {
    if (isSelfOperation(userId)) {
      setUserError('不能对自己执行该操作')
      return
    }
    setUserError('')
    setUserNotice('')
    setDeleteConfirmUserId(null)
    setResetPasswordConfirmUserId(userId)
  }

  async function confirmResetPassword() {
    if (resetPasswordConfirmUserId === null) return
    const ok = await resetPassword(resetPasswordConfirmUserId)
    if (ok) setResetPasswordConfirmUserId(null)
  }

  async function resetPassword(userId: number) {
    setUserError('')
    setUserNotice('')
    setUserActionLoadingMap((prev) => ({ ...prev, [userId]: true }))
    try {
      const res = await resetAdminUserPassword(userId)
      if (!res.ok || !res.data) {
        setUserError('重置密码失败')
        return
      }
      if (typeof res.data.code === 'number' && res.data.code !== 200) {
        setUserError(res.data.message ?? '重置密码失败')
        return false
      }
      setUserNotice('密码已重置')
      return true
    } catch {
      setUserError('网络错误，请稍后重试')
      return false
    } finally {
      setUserActionLoadingMap((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
    }
  }

  function applySearch() {
    setUsernameFilter(usernameFilterInput.trim())
    setRealnameFilter(realnameFilterInput.trim())
    setUserPage(1)
  }

  function handleResetFilters() {
    setUserPage(1)
    setUserPageSize(10)
    setUserOrderField('id')
    setUserOrderDesc(false)
    setUserRoleFilter('all')
    setUserStatusFilter('all')
    setUsernameFilter('')
    setRealnameFilter('')
    setUsernameFilterInput('')
    setRealnameFilterInput('')
    setUserOrderDropdownOpen(false)
    setUserRoleFilterOpen(false)
    setUserStatusFilterOpen(false)
    setUserPageSizeDropdownOpen(false)
    setUserRefreshToken((v) => v + 1)
  }

  function handleChangePageSizeDropdownOpen(
    open: boolean,
    event?: MouseEvent<HTMLButtonElement>,
  ) {
    if (open && !userPageSizeDropdownOpen && event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const estimatedMenuHeight = 180
      setUserPageSizeDropUp(spaceBelow < estimatedMenuHeight)
    }
    setUserPageSizeDropdownOpen(open)
  }

  const userLoadingForControls = userLoading

  return (
    <>
      <AdminUserList
        users={users}
        userLoading={userLoading}
        userError={userError}
        userNotice={userNotice}
        currentUsername={currentUsername}
        userPage={userPage}
        userMaxPage={userMaxPage}
        userPageSize={userPageSize}
        userPageSizeLabel={userPageSizeLabel}
        userPageSizeDropdownOpen={userPageSizeDropdownOpen}
        userPageSizeDropUp={userPageSizeDropUp}
        userOrderField={userOrderField}
        userOrderDesc={userOrderDesc}
        userOrderLabel={userOrderLabel}
        userOrderDropdownOpen={userOrderDropdownOpen}
        userRoleFilter={userRoleFilter}
        userRoleFilterLabel={userRoleFilterLabel}
        userRoleFilterOpen={userRoleFilterOpen}
        userStatusFilter={userStatusFilter}
        userStatusFilterLabel={userStatusFilterLabel}
        userStatusFilterOpen={userStatusFilterOpen}
        usernameFilterInput={usernameFilterInput}
        realnameFilterInput={realnameFilterInput}
        onChangeUsernameFilterInput={setUsernameFilterInput}
        onChangeRealnameFilterInput={setRealnameFilterInput}
        onApplySearch={applySearch}
        onResetFilters={handleResetFilters}
        onToggleOrderDropdown={() => setUserOrderDropdownOpen((open) => !open)}
        onChangeOrderField={(field) => {
          setUserOrderField(field)
          setUserOrderDropdownOpen(false)
        }}
        onChangeOrderDesc={setUserOrderDesc}
        onToggleRoleFilterOpen={() => setUserRoleFilterOpen((open) => !open)}
        onChangeRoleFilter={(value) => {
          setUserRoleFilter(value)
          setUserPage(1)
          setUserRoleFilterOpen(false)
        }}
        onToggleStatusFilterOpen={() => setUserStatusFilterOpen((open) => !open)}
        onChangeStatusFilter={(value) => {
          setUserStatusFilter(value)
          setUserPage(1)
          setUserStatusFilterOpen(false)
        }}
        onChangePageSizeDropdownOpen={handleChangePageSizeDropdownOpen}
        onChangePageSize={(size) => {
          setUserPageSize(size)
          setUserPage(1)
          setUserPageSizeDropdownOpen(false)
        }}
        onChangePage={setUserPage}
        userLoadingForControls={userLoadingForControls}
        userActionLoadingMap={userActionLoadingMap}
        onToggleUserStatus={handleToggleUserStatus}
        onDeleteUser={handleDeleteUser}
        onResetPassword={handleResetPassword}
      />
      {deleteConfirmUserId !== null && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-title">确认删除</div>
            <div className="admin-modal-message">
              确认要删除该用户吗？该操作不可恢复。
              {deleteConfirmUser && (
                <>
                  <br />
                  用户ID: {deleteConfirmUser.id}，学号: {deleteConfirmUser.username}
                </>
              )}
              {!deleteConfirmUser && <> 用户ID: {deleteConfirmUserId}</>}
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="problem-detail-edit-btn"
                disabled={!!userActionLoadingMap[deleteConfirmUserId]}
                onClick={() => setDeleteConfirmUserId(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="admin-modal-primary-btn"
                disabled={!!userActionLoadingMap[deleteConfirmUserId]}
                onClick={confirmDeleteUser}
              >
                {userActionLoadingMap[deleteConfirmUserId] ? '删除中…' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
      {resetPasswordConfirmUserId !== null && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-title">确认重置密码</div>
            <div className="admin-modal-message">
              确认要重置该用户密码吗？
              {resetPasswordConfirmUser && (
                <>
                  <br />
                  用户ID: {resetPasswordConfirmUser.id}，学号:{' '}
                  {resetPasswordConfirmUser.username}
                </>
              )}
              {!resetPasswordConfirmUser && <> 用户ID: {resetPasswordConfirmUserId}</>}
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="problem-detail-edit-btn"
                disabled={!!userActionLoadingMap[resetPasswordConfirmUserId]}
                onClick={() => setResetPasswordConfirmUserId(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="admin-modal-primary-btn"
                disabled={!!userActionLoadingMap[resetPasswordConfirmUserId]}
                onClick={confirmResetPassword}
              >
                {userActionLoadingMap[resetPasswordConfirmUserId]
                  ? '重置中…'
                  : '确认重置'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
