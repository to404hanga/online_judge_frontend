import { getJson } from './http'

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

export type ProblemOrderBy = 'id' | 'created_at' | 'updated_at'

export async function fetchProblemList(
  page: number,
  pageSize: number,
  orderBy?: ProblemOrderBy,
  desc?: boolean,
) {
  return getJson<ProblemListResponse>('/api/online-judge-controller', {
    cmd: 'GetProblemList',
    page,
    page_size: pageSize,
    order_by: orderBy,
    desc,
  })
}
