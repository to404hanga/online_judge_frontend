import { getJson } from './http'

export type CompetitionItem = {
  id: number
  name: string
  status: number
  start_time: string
  end_time: string
  creator_id: number
  updater_id: number
  created_at: string
  updated_at: string
}

export type CompetitionListData = {
  total: number
  page: number
  page_size: number
  list: CompetitionItem[]
}

export type CompetitionListResponse = {
  code: number
  message: string
  data?: CompetitionListData
}

export async function fetchCompetitionList(page: number, pageSize: number) {
  return getJson<CompetitionListResponse>('/api/online-judge-controller', {
    cmd: 'GetCompetitionList',
    page,
    page_size: pageSize,
    status: 1,
  })
}

