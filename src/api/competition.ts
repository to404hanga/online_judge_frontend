import {
  deleteJson,
  getJson,
  getJsonWithHeaders,
  getApiBaseUrl,
  getAuthToken,
  postJson,
  postJsonWithHeaders,
  putJson,
} from './http'

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

export type CompetitionDetailItem = CompetitionItem & {
  creator_realname: string
  updater_realname: string
}

export type CompetitionDetailResponse = {
  code: number
  message: string
  data?: CompetitionDetailItem
}

export type CompetitionProblemItem = {
  id: number
  competition_id: number
  problem_id: number
  problem_title: string
  status: number
  created_at: string
  updated_at: string
}

export type CompetitionProblemListResponse = {
  code: number
  message: string
  data?: CompetitionProblemItem[]
}

export type UserCompetitionProblemItem = {
  competition_id: number
  problem_id: number
  problem_title: string
}

export type UserCompetitionProblemListResponse = {
  code: number
  message: string
  data?: UserCompetitionProblemItem[]
}

export type UserCompetitionProblemDetail = {
  id: number
  title: string
  description: string
  time_limit: number
  memory_limit: number
}

export type UserCompetitionProblemDetailResponse = {
  code: number
  message: string
  data?: UserCompetitionProblemDetail
}

export type CompetitionOrderBy =
  | 'id'
  | 'start_time'
  | 'end_time'
  | 'created_at'
  | 'updated_at'

export type UpdateCompetitionRequest = {
  id: number
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

export async function fetchUserCompetitionList(
  page: number,
  pageSize: number,
  orderBy: CompetitionOrderBy,
  desc: boolean,
  phase?: number,
  name?: string,
) {
  return getJson<CompetitionListResponse>('/api/online-judge-controller', {
    cmd: 'UserGetCompetitionList',
    page,
    page_size: pageSize,
    order_by: orderBy,
    desc,
    phase,
    name,
  })
}

export async function fetchAdminCompetitionList(
  page: number,
  pageSize: number,
  orderBy: CompetitionOrderBy,
  desc: boolean,
  status?: number,
  phase?: number,
  name?: string,
) {
  return getJson<CompetitionListResponse>('/api/online-judge-controller', {
    cmd: 'GetCompetitionList',
    page,
    page_size: pageSize,
    order_by: orderBy,
    desc,
    status,
    phase,
    name,
  })
}

export async function fetchAdminCompetitionDetail(competitionId: number) {
  return getJson<CompetitionDetailResponse>('/api/online-judge-controller', {
    cmd: 'GetCompetition',
    competition_id: competitionId,
  })
}

export async function fetchAdminCompetitionProblemList(
  competitionId: number,
) {
  return getJson<CompetitionProblemListResponse>(
    '/api/online-judge-controller',
    {
      cmd: 'GetCompetitionProblemList',
      competition_id: competitionId,
    },
  )
}

export async function updateCompetition(body: UpdateCompetitionRequest) {
  return putJson<UpdateCompetitionResponse>(
    '/api/online-judge-controller?cmd=UpdateCompetition',
    body,
  )
}

export type InitRankingResponse = {
  code: number
  message: string
}

export async function initRanking(competitionId: number) {
  return postJson<InitRankingResponse>(
    '/api/online-judge-controller?cmd=InitRanking',
    {
      competition_id: competitionId,
    },
  )
}

export type UpdateCompetitionProblemStatusResponse = {
  code: number
  message: string
}

export async function addCompetitionProblems(
  competitionId: number,
  problemIds: number[],
) {
  return postJson<UpdateCompetitionProblemStatusResponse>(
    '/api/online-judge-controller?cmd=AddCompetitionProblem',
    {
      competition_id: competitionId,
      problem_ids: problemIds,
    },
  )
}

export async function enableCompetitionProblems(
  competitionId: number,
  problemIds: number[],
) {
  return putJson<UpdateCompetitionProblemStatusResponse>(
    '/api/online-judge-controller?cmd=EnableCompetitionProblem',
    {
      competition_id: competitionId,
      problem_ids: problemIds,
    },
  )
}

export async function disableCompetitionProblems(
  competitionId: number,
  problemIds: number[],
) {
  return putJson<UpdateCompetitionProblemStatusResponse>(
    '/api/online-judge-controller?cmd=DisableCompetitionProblem',
    {
      competition_id: competitionId,
      problem_ids: problemIds,
    },
  )
}

export async function removeCompetitionProblems(
  competitionId: number,
  problemIds: number[],
) {
  return deleteJson<UpdateCompetitionProblemStatusResponse>(
    '/api/online-judge-controller?cmd=RemoveCompetitionProblem',
    {
      competition_id: competitionId,
      problem_ids: problemIds,
    },
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

export type SubmitCompetitionProblemRequest = {
  code: string
  language: number
  problem_id: number
}

export type SubmitCompetitionProblemResponse = {
  code: number
  message: string
}

export async function submitCompetitionProblem(
  competitionJwtToken: string,
  body: SubmitCompetitionProblemRequest,
) {
  return postJsonWithHeaders<SubmitCompetitionProblemResponse>(
    '/api/online-judge-controller?cmd=SubmitCompetitionProblem',
    body,
    {
      'X-Competition-JWT-Token': competitionJwtToken,
    },
  )
}

export async function fetchUserCompetitionProblemList(competitionJwtToken: string) {
  return getJsonWithHeaders<UserCompetitionProblemListResponse>(
    '/api/online-judge-controller',
    {
      cmd: 'UserGetCompetitionProblemList',
    },
    {
      'X-Competition-JWT-Token': competitionJwtToken,
    },
  )
}

export async function fetchUserCompetitionProblemDetail(
  competitionJwtToken: string,
  problemId: number,
) {
  return getJsonWithHeaders<UserCompetitionProblemDetailResponse>(
    '/api/online-judge-controller',
    {
      cmd: 'UserGetCompetitionProblemDetail',
      problem_id: problemId,
    },
    {
      'X-Competition-JWT-Token': competitionJwtToken,
    },
  )
}

export type LatestSubmissionData = {
  id: number
  code: string
  stderr: string
  language: number
  status: number
  result: number
  time_used: number
  memory_used: number
  created_at: string
}

export type GetLatestSubmissionResponse = {
  code: number
  message: string
  data?: LatestSubmissionData
}

export async function getLatestSubmission(
  competitionJwtToken: string,
  problemId: number,
) {
  return getJsonWithHeaders<GetLatestSubmissionResponse>(
    '/api/online-judge-controller',
    {
      cmd: 'GetLatestSubmission',
      problem_id: problemId,
    },
    {
      'X-Competition-JWT-Token': competitionJwtToken,
    },
  )
}

export type CheckUserCompetitionProblemAcceptedResponse = {
  code: number
  message: string
  data?: boolean
}

export async function checkUserCompetitionProblemAccepted(
  competitionJwtToken: string,
  problemId: number,
) {
  return getJsonWithHeaders<CheckUserCompetitionProblemAcceptedResponse>(
    '/api/online-judge-controller',
    {
      cmd: 'CheckUserCompetitionProblemAccepted',
      problem_id: problemId,
    },
    {
      'X-Competition-JWT-Token': competitionJwtToken,
    },
  )
}

export type CompetitionRankingProblemItem = {
  problem_id: number
  result: number
  accepted_at: number
  retries: number
  is_fastest: boolean
}

export type CompetitionRankingUserItem = {
  user_id: number
  username: string
  realname: string
  total_accepted: number
  total_time_used: number
  problems: CompetitionRankingProblemItem[]
}

export type CompetitionRankingListData = {
  total: number
  page: number
  page_size: number
  list: CompetitionRankingUserItem[]
}

export type GetCompetitionRankingListResponse = {
  code: number
  message: string
  data?: CompetitionRankingListData
}

export async function fetchCompetitionRankingList(
  competitionJwtToken: string,
  page: number,
  pageSize: number,
) {
  return getJsonWithHeaders<GetCompetitionRankingListResponse>(
    '/api/online-judge-controller',
    {
      cmd: 'GetCompetitionRankingList',
      page,
      page_size: pageSize,
    },
    {
      'X-Competition-JWT-Token': competitionJwtToken,
    },
  )
}

export async function connectCompetitionTimeEventStream(
  competitionJwtToken: string,
  options: {
    signal: AbortSignal
    onMessage: (value: string) => void
    onError?: (err: unknown) => void
  },
): Promise<void> {
  const url = `${getApiBaseUrl()}/api/online-judge-controller?cmd=TimeEvent`
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'X-Competition-JWT-Token': competitionJwtToken,
  }
  const authToken = getAuthToken()
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
      mode: 'cors',
      signal: options.signal,
    })

    if (!res.ok) {
      let details = ''
      try {
        const text = await res.text()
        if (text) details = text.length > 800 ? `${text.slice(0, 800)}…` : text
      } catch {
        details = ''
      }
      throw new Error(
        `SSE连接失败，状态码: ${res.status}${details ? `，响应: ${details}` : ''}`,
      )
    }
    if (!res.body) {
      throw new Error('SSE连接失败：响应体为空')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/gu, '\n')

      let boundaryIndex = buffer.indexOf('\n\n')
      while (boundaryIndex !== -1) {
        const rawEvent = buffer.slice(0, boundaryIndex)
        buffer = buffer.slice(boundaryIndex + 2)

        const lines = rawEvent.split('\n')
        const dataLines: string[] = []
        for (const line of lines) {
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).replace(/^\s/gu, ''))
          }
        }
        if (dataLines.length > 0) {
          options.onMessage(dataLines.join('\n'))
        }

        boundaryIndex = buffer.indexOf('\n\n')
      }
    }
  } catch (err) {
    if (options.signal.aborted) return
    options.onError?.(err)
    throw err
  }
}

export type CreateCompetitionRequest = {
  name: string
  start_time: string
  end_time: string
}

export type CreateCompetitionResponse = {
  code: number
  message: string
}

export async function createCompetition(body: CreateCompetitionRequest) {
  return postJson<CreateCompetitionResponse>(
    '/api/online-judge-controller?cmd=CreateCompetition',
    body,
  )
}
