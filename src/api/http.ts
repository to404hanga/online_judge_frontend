/**
 * HTTP 工具模块
 * - 统一构建请求头（含 JWT）
 * - 发送 JSON 的 POST 请求
 * - 从响应头中提取并持久化 JWT
 */

const TOKEN_KEY = 'jwtToken' // 存储在 localStorage 中的 JWT 键名

// API 基础地址，通过 Vite 的环境变量注入（.env 文件中的 VITE_API_BASE_URL）
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''

// 从本地存储读取当前 JWT
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// 将 JWT 写入本地存储（如果传入为空，则不写入）
function setToken(token: string | null) {
  if (!token) return
  localStorage.setItem(TOKEN_KEY, token)
}

function handleUnauthorizedRedirect(status: number, data: unknown) {
  const hasBodyCode =
    data &&
    typeof data === 'object' &&
    'code' in (data as Record<string, unknown>) &&
    (data as Record<string, unknown>).code === 401

  if (status !== 401 && !hasBodyCode) return

  localStorage.removeItem(TOKEN_KEY)

  if (typeof window === 'undefined') return

  if (window.location.pathname !== '/') {
    window.location.href = '/'
    return
  }

  window.location.reload()
}

// 统一的接口返回结构，便于调用端处理
export type ApiResult<T> = {
  ok: boolean           // 请求是否成功（HTTP 2xx）
  data: T | null        // 响应体解析出的 JSON 数据
  blob?: Blob | null    // 响应体解析出的 Blob 数据（用于文件下载等）
  status: number        // HTTP 状态码
  token?: string | null // 从响应头中读取到的 JWT（若存在）
  headers?: Headers     // 原始响应头（用于读取比赛 JWT 等自定义 Header）
}

// 构建请求头：默认 Accept + 可选 Authorization（JWT），并合并额外头
function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json, */*', // 接受 JSON 响应，也允许二进制流等文件下载
  }
  const token = getToken() // 从本地读取 JWT
  if (token) headers.Authorization = 'Bearer ' + token
  if (extra) Object.assign(headers, extra as Record<string, string>) // 合并额外头部参数
  return headers
}

export async function postJson<T>(
  path: string,
  body: unknown,
): Promise<ApiResult<T>> {
  const url = API_BASE_URL + path
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify(body ?? {}),
  })

  // 后端通过自定义响应头传递新的 JWT
  const headerToken = res.headers.get('X-JWT-Token')
  if (headerToken) setToken(headerToken) // 若存在新 JWT，则更新到本地存储

  let data: T | null = null
  try {
    data = (await res.json()) as T
  } catch {
    data = null
  }

  const result = {
    ok: res.ok,
    data,
    status: res.status,
    token: headerToken,
    headers: res.headers,
  }

  handleUnauthorizedRedirect(result.status, result.data)

  return result
}

export async function postJsonWithHeaders<T>(
  path: string,
  body: unknown,
  extraHeaders: Record<string, string>,
): Promise<ApiResult<T>> {
  const url = API_BASE_URL + path
  const headers = buildHeaders({
    'Content-Type': 'application/json',
    ...extraHeaders,
  })
  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify(body ?? {}),
  })

  const headerToken = res.headers.get('X-JWT-Token')
  if (headerToken) setToken(headerToken)

  let data: T | null = null
  try {
    data = (await res.json()) as T
  } catch {
    data = null
  }

  const result = {
    ok: res.ok,
    data,
    status: res.status,
    token: headerToken,
    headers: res.headers,
  }

  handleUnauthorizedRedirect(result.status, result.data)

  return result
}

export async function postFormData<T>(path: string, body: FormData): Promise<ApiResult<T>> {
  const url = API_BASE_URL + path
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
    mode: 'cors',
    body,
  })

  const headerToken = res.headers.get('X-JWT-Token')
  if (headerToken) setToken(headerToken)

  let data: T | null = null
  try {
    data = (await res.json()) as T
  } catch {
    data = null
  }

  const result = {
    ok: res.ok,
    data,
    status: res.status,
    token: headerToken,
    headers: res.headers,
  }

  handleUnauthorizedRedirect(result.status, result.data)

  return result
}

export async function putJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const url = API_BASE_URL + path
  const res = await fetch(url, {
    method: 'PUT',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify(body ?? {}),
  })

  const headerToken = res.headers.get('X-JWT-Token')
  if (headerToken) setToken(headerToken)

  let data: T | null = null
  try {
    data = (await res.json()) as T
  } catch {
    data = null
  }

  const result = {
    ok: res.ok,
    data,
    status: res.status,
    token: headerToken,
    headers: res.headers,
  }

  handleUnauthorizedRedirect(result.status, result.data)

  return result
}

export async function putJsonWithHeaders<T>(
  path: string,
  body: unknown,
  extraHeaders: Record<string, string>,
): Promise<ApiResult<T>> {
  const url = API_BASE_URL + path
  const headers = buildHeaders({
    'Content-Type': 'application/json',
    ...extraHeaders,
  })
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify(body ?? {}),
  })

  const headerToken = res.headers.get('X-JWT-Token')
  if (headerToken) setToken(headerToken)

  let data: T | null = null
  try {
    data = (await res.json()) as T
  } catch {
    data = null
  }

  const result = {
    ok: res.ok,
    data,
    status: res.status,
    token: headerToken,
    headers: res.headers,
  }

  handleUnauthorizedRedirect(result.status, result.data)

  return result
}

export async function deleteJson<T>(
  path: string,
  body: unknown,
): Promise<ApiResult<T>> {
  const url = API_BASE_URL + path
  const res = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify(body ?? {}),
  })

  const headerToken = res.headers.get('X-JWT-Token')
  if (headerToken) setToken(headerToken)

  let data: T | null = null
  try {
    data = (await res.json()) as T
  } catch {
    data = null
  }

  const result = {
    ok: res.ok,
    data,
    status: res.status,
    token: headerToken,
    headers: res.headers,
  }

  handleUnauthorizedRedirect(result.status, result.data)

  return result
}

// 对外提供获取当前 JWT 的方法
export function getAuthToken(): string | null {
  return getToken()
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function getJson<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): Promise<ApiResult<T>> {
  const search = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return
      search.append(key, String(value))
    })
  }
  const queryString = search.toString()
  const url = API_BASE_URL + path + (queryString ? `?${queryString}` : '')

  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    mode: 'cors',
  })

  const headerToken = res.headers.get('X-JWT-Token')
  if (headerToken) setToken(headerToken)

  let data: T | null = null
  try {
    data = (await res.json()) as T
  } catch {
    data = null
  }

  const result = {
    ok: res.ok,
    data,
    status: res.status,
    token: headerToken,
    headers: res.headers,
  }

  handleUnauthorizedRedirect(result.status, result.data)

  return result
}

export async function getJsonWithHeaders<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> | undefined,
  extraHeaders: Record<string, string>,
): Promise<ApiResult<T>> {
  const search = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return
      search.append(key, String(value))
    })
  }
  const queryString = search.toString()
  const url = API_BASE_URL + path + (queryString ? `?${queryString}` : '')

  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders({
      'Content-Type': 'application/json',
      ...extraHeaders,
    }),
    credentials: 'include',
    mode: 'cors',
  })

  const headerToken = res.headers.get('X-JWT-Token')
  if (headerToken) setToken(headerToken)

  let data: T | null = null
  try {
    data = (await res.json()) as T
  } catch {
    data = null
  }

  const result = {
    ok: res.ok,
    data,
    status: res.status,
    token: headerToken,
    headers: res.headers,
  }

  handleUnauthorizedRedirect(result.status, result.data)

  return result
}

export async function getBlobWithHeaders<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> | undefined,
  extraHeaders: Record<string, string>,
): Promise<ApiResult<T>> {
  const search = new URLSearchParams()
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return
      search.append(key, String(value))
    })
  }
  const queryString = search.toString()
  const url = API_BASE_URL + path + (queryString ? `?${queryString}` : '')

  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders({
      'Content-Type': 'application/json',
      ...extraHeaders,
    }),
    credentials: 'include',
    mode: 'cors',
  })

  const headerToken = res.headers.get('X-JWT-Token')
  if (headerToken) setToken(headerToken)

  const contentType = res.headers.get('Content-Type') ?? ''

  let data: T | null = null
  let blob: Blob | null = null

  if (res.ok) {
    try {
      blob = await res.blob()
    } catch {
      blob = null
    }
  } else if (contentType.includes('application/json')) {
    try {
      data = (await res.json()) as T
    } catch {
      data = null
    }
  } else {
    try {
      const text = await res.text()
      data = (text ? (JSON.parse(text) as T) : null) as T | null
    } catch {
      data = null
    }
  }

  const result = {
    ok: res.ok,
    data,
    blob,
    status: res.status,
    token: headerToken,
    headers: res.headers,
  }

  handleUnauthorizedRedirect(result.status, result.data)

  return result
}
