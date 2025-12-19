import { deleteJson, getJson, putJson } from './http'

export type UserInfo = {
  username: string
  realname: string
  role: number
  status: number
}

export async function fetchUserInfo() {
  return getJson<UserInfo>('/auth/info')
}

export type AdminUserItem = {
  id: number
  username: string
  realname: string
  role: number
  status: number
  created_at: string
  updated_at: string
}

export type AdminUserListData = {
  total: number
  page: number
  page_size: number
  list: AdminUserItem[]
}

export type AdminUserListResponse = {
  code: number
  message: string
  data?: AdminUserListData
}

export type UserOrderBy = 'id' | 'username' | 'realname'

export async function fetchAdminUserList(
  page: number,
  pageSize: number,
  orderBy?: UserOrderBy,
  desc?: boolean,
  username?: string,
  realname?: string,
  role?: number,
  status?: number,
) {
  return getJson<AdminUserListResponse>('/api/online-judge-controller', {
    cmd: 'GetUserList',
    page,
    page_size: pageSize,
    order_by: orderBy,
    desc,
    username,
    realname,
    role,
    status,
  })
}

export type AdminUserActionResponse = {
  code: number
  message: string
  data?: unknown
}

export async function disableAdminUser(userId: number) {
  return putJson<AdminUserActionResponse>('/api/online-judge-controller?cmd=UpdateUser', {
    user_id: userId,
    status: 1,
  })
}

export async function enableAdminUser(userId: number) {
  return putJson<AdminUserActionResponse>('/api/online-judge-controller?cmd=UpdateUser', {
    user_id: userId,
    status: 0,
  })
}

export async function deleteAdminUser(userId: number) {
  return deleteJson<AdminUserActionResponse>('/api/online-judge-controller?cmd=DeleteUser', {
    user_id: userId,
  })
}

export async function resetAdminUserPassword(userId: number) {
  return putJson<AdminUserActionResponse>('/api/online-judge-controller?cmd=ResetPassword', {
    user_id: userId,
  })
}
