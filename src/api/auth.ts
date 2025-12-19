import { postJson } from './http'

// 认证相关类型：登录响应（后端约定返回消息或错误）
export type LoginResponse = {
  message?: string // 成功时的提示消息
  error?: string // 失败时的错误信息
}

export type LogoutResponse = {
  message?: string
  error?: string
}

// 登录接口：传入用户名与密码，返回登录结果与（可能存在的）JWT
export async function login(username: string, password: string) {
  // 向后端发送登录请求（JSON 格式），路径为 /auth/login
  const res = await postJson<LoginResponse>('/auth/login', { username, password })

  // 兼容后端未返回 JSON 的情况（此时 data 为 null）
  const data = res.data ?? {}

  // 约定：存在 message 且状态码为 200 才表示登录成功
  const success = !!data.message && res.status === 200

  // 将统一的返回结构提供给上层：
  // - success：是否成功
  // - message / error：文案提示
  // - token：从响应头 `X-JWT-Token` 中提取的 JWT（若后端下发）
  return {
    success,
    message: data.message,
    error: data.error,
    token: res.token ?? null,
  }
}

export async function logout() {
  const res = await postJson<LogoutResponse>('/auth/logout', {})
  const data = res.data ?? {}
  const success = !!data.message && res.status === 200
  return {
    success,
    message: data.message,
    error: data.error,
  }
}
