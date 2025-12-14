import { getJson, putJson } from './http'

export type ProblemItem = {
  id: number
  title: string
  description: string
  status: number
  time_limit: number
  memory_limit: number
  visible: number
  creator_id: number
  updater_id: number
  created_at: string
  updated_at: string
}

export type ProblemDetail = {
  id: number
  title: string
  description: string
  status: number
  time_limit: number
  memory_limit: number
  visible: number
  creator_id: number
  creator_realname: string
  updater_id: number
  updater_realname: string
  created_at: string
  updated_at: string
}

export type ProblemListData = {
  total: number
  page: number
  page_size: number
  list: ProblemItem[]
}

export type ProblemListResponse = {
  code: number
  message: string
  data?: ProblemListData
}

export type ProblemDetailResponse = {
  code: number
  message: string
  data?: ProblemDetail
}

export type ProblemOrderBy = 'id' | 'created_at' | 'updated_at'

export async function fetchProblemList(
  page: number,
  pageSize: number,
  orderBy?: ProblemOrderBy,
  desc?: boolean,
  status?: number,
  visible?: number,
  title?: string,
) {
  return getJson<ProblemListResponse>('/api/online-judge-controller', {
    cmd: 'GetProblemList',
    page,
    page_size: pageSize,
    order_by: orderBy,
    desc,
    status,
    visible,
    title,
  })
}

export async function fetchProblemDetail(problemId: number) {
  return getJson<ProblemDetailResponse>('/api/online-judge-controller', {
    cmd: 'GetProblem',
    problem_id: problemId,
  })
}

export type UpdateProblemRequest = {
  problem_id: number
  title?: string
  description?: string
  status?: number
  time_limit?: number
  memory_limit?: number
  visible?: number
}

export type UpdateProblemResponse = {
  code: number
  message: string
}

export async function updateProblem(body: UpdateProblemRequest) {
  return putJson<UpdateProblemResponse>(
    '/api/online-judge-controller?cmd=UpdateProblem',
    body,
  )
}
