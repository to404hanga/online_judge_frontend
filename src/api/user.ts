import { deleteJson, getJson, postJson, putJson } from './http'

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

export async function createAdminUser(username: string, realname: string, role: number) {
  return postJson<AdminUserActionResponse>('/api/online-judge-controller?cmd=CreateUser', {
    username,
    realname,
    role,
  })
}

export type AddUsersToCompetitionResponseData = {
  insert_success: number
}

export type AddUsersToCompetitionResponse = {
  code: number
  message: string
  data?: AddUsersToCompetitionResponseData
}

export async function addUsersToCompetition(
  competitionId: number,
  userIdList: number[],
) {
  return postJson<AddUsersToCompetitionResponse>(
    `/api/online-judge-controller?cmd=AddUsersToCompetition&competition_id=${competitionId}`,
    {
      user_id_list: userIdList,
    },
  )
}

export type CompetitionUserItem = {
  id: number
  competition_id: number
  user_id: number
  username: string
  realname: string
  status: number
}

export type CompetitionUserListData = {
  total: number
  page: number
  page_size: number
  list: CompetitionUserItem[]
}

export type CompetitionUserListResponse = {
  code: number
  message: string
  data?: CompetitionUserListData
}

export type CompetitionUserOrderBy = 'id' | 'username' | 'realname'

export async function fetchCompetitionUserList(
  competitionId: number,
  page: number,
  pageSize: number,
  orderBy: CompetitionUserOrderBy = 'id',
  desc = false,
  username?: string,
  realname?: string,
  status?: number,
) {
  return getJson<CompetitionUserListResponse>('/api/online-judge-controller', {
    cmd: 'GetCompetitionUserList',
    competition_id: competitionId,
    page,
    page_size: pageSize,
    order_by: orderBy,
    desc,
    username,
    realname,
    status,
  })
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
