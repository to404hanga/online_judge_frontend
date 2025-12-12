import { getJson } from './http'

export type UserInfo = {
  username: string
  realname: string
  role: number
  status: number
}

export async function fetchUserInfo() {
  return getJson<UserInfo>('/auth/info')
}

