import { getJson, postJson, putJson } from './http'

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

export type CompetitionOrderBy =
  | 'id'
  | 'start_time'
  | 'end_time'
  | 'created_at'
  | 'updated_at'

export type UpdateCompetitionRequest = {
  competition_id: number
  name?: string
  status?: number
  start_time?: string
  end_time?: string
}

export type UpdateCompetitionResponse = {
  code: number
  message: string
}

export async function fetchCompetitionList(page: number, pageSize: number) {
  return getJson<CompetitionListResponse>('/api/online-judge-controller', {
    cmd: 'GetCompetitionList',
    page,
    page_size: pageSize,
    status: 1,
  })
}

export async function fetchAdminCompetitionList(
  page: number,
  pageSize: number,
  orderBy: CompetitionOrderBy,
  desc: boolean,
  status?: number,
  name?: string,
) {
  return getJson<CompetitionListResponse>('/api/online-judge-controller', {
    cmd: 'GetCompetitionList',
    page,
    page_size: pageSize,
    order_by: orderBy,
    desc,
    status,
    name,
  })
}

export async function updateCompetition(body: UpdateCompetitionRequest) {
  return putJson<UpdateCompetitionResponse>(
    '/api/online-judge-controller?cmd=UpdateCompetition',
    body,
  )
}

export type StartCompetitionResponse = {
  code: number
  message: string
}

export async function startCompetition(competitionId: number) {
  return postJson<StartCompetitionResponse>(
    '/api/online-judge-controller?cmd=StartCompetition',
    {
      competition_id: competitionId,
    },
  )
}
