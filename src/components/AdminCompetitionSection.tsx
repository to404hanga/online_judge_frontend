import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from 'react'
import {
  fetchAdminCompetitionList,
  fetchAdminCompetitionDetail,
  fetchAdminCompetitionProblemList,
  type CompetitionItem,
  type CompetitionDetailItem,
  type CompetitionOrderBy,
  type CompetitionProblemItem,
  addCompetitionProblems,
  enableCompetitionProblems,
  disableCompetitionProblems,
  removeCompetitionProblems,
  updateCompetition,
  createCompetition,
} from '../api/competition'
import { fetchProblemList, type ProblemItem } from '../api/problem'
import { formatDateTimeText } from '../utils/datetime'

type CompetitionStatusFilter = 'all' | '0' | '1' | '2'
type CompetitionPhaseFilter = 'all' | '0' | '1' | '2'
type CompetitionRuntimeTone = 'upcoming' | 'running' | 'finished'

const COMPETITION_TIMEZONE_OPTIONS = [
  { label: 'UTC+8', offset: 480 },
  { label: 'UTC', offset: 0 },
]

function toDateTimeLocalValue(source: string, offsetMinutes: number) {
  if (!source) return ''
  const trimmed = source.trim()
  if (!trimmed) return ''

  if (trimmed.includes('T')) {
    const date = new Date(trimmed)
    const time = date.getTime()
    if (!Number.isFinite(time)) return ''
    const localMs = time + offsetMinutes * 60 * 1000
    const local = new Date(localMs)
    const year = local.getUTCFullYear()
    const month = `${local.getUTCMonth() + 1}`.padStart(2, '0')
    const day = `${local.getUTCDate()}`.padStart(2, '0')
    const hours = `${local.getUTCHours()}`.padStart(2, '0')
    const minutes = `${local.getUTCMinutes()}`.padStart(2, '0')
    const seconds = `${local.getUTCSeconds()}`.padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d+)?$/u.exec(trimmed)
  if (!match) return ''
  const year = match[1]
  const month = match[2]
  const day = match[3]
  const hours = match[4]
  const minutes = match[5]
  const seconds = match[6]
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

function toRfc3339FromLocal(value: string, offsetMinutes: number) {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/u.exec(trimmed)
  if (!match) return ''
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hours = Number(match[4])
  const minutes = Number(match[5])
  const seconds = Number(match[6] ?? '0')
  const utcMs =
    Date.UTC(year, month - 1, day, hours, minutes, seconds) -
    offsetMinutes * 60 * 1000
  const date = new Date(utcMs)
  if (!Number.isFinite(date.getTime())) return ''
  return date.toISOString()
}

export default function AdminCompetitionSection() {
  type ImportProblemItem = Pick<
    ProblemItem,
    'id' | 'title' | 'time_limit' | 'memory_limit'
  >

  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [competitionLoading, setCompetitionLoading] = useState(false)
  const [competitionError, setCompetitionError] = useState('')
  const [competitionPage, setCompetitionPage] = useState(1)
  const [competitionTotal, setCompetitionTotal] = useState(0)
  const [competitionPageSize, setCompetitionPageSize] = useState(10)
  const [competitionOrderField, setCompetitionOrderField] =
    useState<CompetitionOrderBy>('id')
  const [competitionOrderDesc, setCompetitionOrderDesc] = useState(false)
  const [competitionOrderDropdownOpen, setCompetitionOrderDropdownOpen] =
    useState(false)
  const [competitionStatusFilter, setCompetitionStatusFilter] =
    useState<CompetitionStatusFilter>('all')
  const [competitionStatusFilterOpen, setCompetitionStatusFilterOpen] =
    useState(false)
  const [competitionPhaseFilter, setCompetitionPhaseFilter] =
    useState<CompetitionPhaseFilter>('all')
  const [competitionPhaseFilterOpen, setCompetitionPhaseFilterOpen] =
    useState(false)
  const [competitionNameFilter, setCompetitionNameFilter] = useState('')
  const [competitionNameFilterInput, setCompetitionNameFilterInput] =
    useState('')
  const [competitionPageSizeDropdownOpen, setCompetitionPageSizeDropdownOpen] =
    useState(false)
  const [competitionPageSizeDropUp, setCompetitionPageSizeDropUp] =
    useState(false)
  const [competitionRefreshToken, setCompetitionRefreshToken] = useState(0)
  const [selectedCompetitionIds, setSelectedCompetitionIds] = useState<
    number[]
  >([])
  const [competitionBatchSubmitting, setCompetitionBatchSubmitting] =
    useState(false)
  const [competitionBatchDropdownOpen, setCompetitionBatchDropdownOpen] =
    useState(false)
  const competitionHeaderSelectRef = useRef<HTMLInputElement | null>(null)
  const competitionDetailRequestRef = useRef(0)
  const [activeCompetitionId, setActiveCompetitionId] = useState<number | null>(
    null,
  )
  const [activeCompetition, setActiveCompetition] =
    useState<CompetitionDetailItem | null>(null)
  const [competitionDetailLoading, setCompetitionDetailLoading] = useState(false)
  const [competitionDetailError, setCompetitionDetailError] = useState('')
  const [competitionDetailEditing, setCompetitionDetailEditing] =
    useState(false)
  const [competitionDetailNameDraft, setCompetitionDetailNameDraft] =
    useState('')
  const [competitionDetailStatusDraft, setCompetitionDetailStatusDraft] =
    useState<number | null>(null)
  const [competitionDetailStartTimeDraft, setCompetitionDetailStartTimeDraft] =
    useState('')
  const [competitionDetailEndTimeDraft, setCompetitionDetailEndTimeDraft] =
    useState('')
  const [
    competitionDetailStatusDropdownOpen,
    setCompetitionDetailStatusDropdownOpen,
  ] = useState(false)
  const [competitionDetailSubmitting, setCompetitionDetailSubmitting] =
    useState(false)
  const [competitionDetailTimezoneOffset, setCompetitionDetailTimezoneOffset] =
    useState(480)
  const [competitionProblems, setCompetitionProblems] = useState<
    CompetitionProblemItem[]
  >([])
  const [competitionProblemsLoading, setCompetitionProblemsLoading] =
    useState(false)
  const [competitionProblemsError, setCompetitionProblemsError] = useState('')
  const [competitionProblemsUpdating, setCompetitionProblemsUpdating] =
    useState(false)
  const [competitionProblemsDeleting, setCompetitionProblemsDeleting] =
    useState(false)
  const [competitionProblemDeletingId, setCompetitionProblemDeletingId] =
    useState<number | null>(null)
  const [competitionProblemDeleteConfirm, setCompetitionProblemDeleteConfirm] =
    useState<CompetitionProblemItem | null>(null)
  const [importProblemModalOpen, setImportProblemModalOpen] = useState(false)
  const [importProblemList, setImportProblemList] = useState<ImportProblemItem[]>(
    [],
  )
  const [selectedImportProblemIds, setSelectedImportProblemIds] = useState<
    number[]
  >([])
  const [importProblemPage, setImportProblemPage] = useState(1)
  const [importProblemTotal, setImportProblemTotal] = useState(0)
  const [importProblemLoading, setImportProblemLoading] = useState(false)
  const [importProblemSubmitting, setImportProblemSubmitting] = useState(false)
  const [importProblemError, setImportProblemError] = useState('')
  const [competitionAlertOpen, setCompetitionAlertOpen] = useState(false)
  const [competitionAlertTitle, setCompetitionAlertTitle] = useState('')
  const [competitionAlertMessage, setCompetitionAlertMessage] = useState('')

  const [createCompetitionModalOpen, setCreateCompetitionModalOpen] =
    useState(false)
  const [createCompetitionName, setCreateCompetitionName] = useState('')
  const [createCompetitionTimezoneOffset, setCreateCompetitionTimezoneOffset] =
    useState(480)
  const [createCompetitionStartLocal, setCreateCompetitionStartLocal] =
    useState('')
  const [createCompetitionEndLocal, setCreateCompetitionEndLocal] =
    useState('')
  const [createCompetitionSubmitting, setCreateCompetitionSubmitting] =
    useState(false)

  const competitionProblemIdSet = new Set(
    competitionProblems.map((item) => item.problem_id),
  )

  useEffect(() => {
    const problemIdSet = new Set(
      competitionProblems.map((item) => item.problem_id),
    )
    setSelectedImportProblemIds((prev) =>
      prev.filter((id) => !problemIdSet.has(id)),
    )
  }, [competitionProblems])

  useEffect(() => {
    if (!importProblemModalOpen) return
    void loadImportProblemList(importProblemPage)
  }, [importProblemModalOpen, importProblemPage])

  useEffect(() => {
    void loadCompetitions(
      competitionPage,
      competitionPageSize,
      competitionOrderField,
      competitionOrderDesc,
      competitionStatusFilter,
      competitionPhaseFilter,
      competitionNameFilter,
    )
  }, [
    competitionPage,
    competitionPageSize,
    competitionOrderField,
    competitionOrderDesc,
    competitionStatusFilter,
    competitionPhaseFilter,
    competitionNameFilter,
    competitionRefreshToken,
  ])

  async function loadCompetitionProblems(competitionId: number) {
    setCompetitionProblemsLoading(true)
    setCompetitionProblemsError('')
    try {
      const res = await fetchAdminCompetitionProblemList(competitionId)
      if (!res.ok || !res.data || !res.data.data) {
        setCompetitionProblems([])
        setCompetitionProblemsError(res.data?.message ?? '获取比赛题目列表失败')
        return
      }
      setCompetitionProblems(res.data.data)
    } catch {
      setCompetitionProblems([])
      setCompetitionProblemsError('网络错误，请稍后重试')
    } finally {
      setCompetitionProblemsLoading(false)
    }
  }

  async function loadCompetitionDetail(competitionId: number, offsetMinutes: number) {
    const requestId = competitionDetailRequestRef.current + 1
    competitionDetailRequestRef.current = requestId

    setCompetitionDetailLoading(true)
    setCompetitionDetailError('')
    try {
      const res = await fetchAdminCompetitionDetail(competitionId)
      if (competitionDetailRequestRef.current !== requestId) return

      if (!res.ok || !res.data || !res.data.data) {
        setActiveCompetition(null)
        setCompetitionDetailError(res.data?.message ?? '获取比赛详情失败')
        return
      }

      const detail = res.data.data
      setActiveCompetition(detail)
      setCompetitions((prev) =>
        prev.map((item) =>
          item.id === detail.id
            ? {
                id: detail.id,
                name: detail.name,
                status: detail.status,
                start_time: detail.start_time,
                end_time: detail.end_time,
                creator_id: detail.creator_id,
                updater_id: detail.updater_id,
                created_at: detail.created_at,
                updated_at: detail.updated_at,
              }
            : item,
        ),
      )

      if (!competitionDetailEditing) {
        setCompetitionDetailNameDraft(detail.name)
        setCompetitionDetailStatusDraft(detail.status)
        setCompetitionDetailStartTimeDraft(
          toDateTimeLocalValue(detail.start_time, offsetMinutes),
        )
        setCompetitionDetailEndTimeDraft(
          toDateTimeLocalValue(detail.end_time, offsetMinutes),
        )
      }
    } catch {
      if (competitionDetailRequestRef.current !== requestId) return
      setActiveCompetition(null)
      setCompetitionDetailError('网络错误，请稍后重试')
    } finally {
      if (competitionDetailRequestRef.current === requestId) {
        setCompetitionDetailLoading(false)
      }
    }
  }

  async function loadCompetitions(
    targetPage: number,
    pageSize: number,
    orderBy: CompetitionOrderBy,
    desc: boolean,
    statusFilter: CompetitionStatusFilter,
    phaseFilter: CompetitionPhaseFilter,
    nameFilter: string,
  ) {
    setCompetitionLoading(true)
    setCompetitionError('')
    try {
      const statusValue =
        statusFilter === 'all' ? undefined : Number(statusFilter)
      const phaseValue =
        phaseFilter === 'all' ? undefined : Number(phaseFilter)
      const nameValue =
        nameFilter && nameFilter.trim().length > 0
          ? nameFilter.trim()
          : undefined
      const res = await fetchAdminCompetitionList(
        targetPage,
        pageSize,
        orderBy,
        desc,
        statusValue,
        phaseValue,
        nameValue,
      )
      if (!res.ok || !res.data || !res.data.data) {
        setCompetitions([])
        setCompetitionTotal(0)
        setSelectedCompetitionIds([])
        setCompetitionError(res.data?.message ?? '获取比赛列表失败')
        return
      }
      const data = res.data.data
      setCompetitions(data.list)
      setCompetitionTotal(data.total)
      setSelectedCompetitionIds((prev) =>
        prev.filter((id) => data.list.some((item) => item.id === id)),
      )
    } catch {
      setCompetitions([])
      setCompetitionTotal(0)
      setSelectedCompetitionIds([])
      setCompetitionError('网络错误，请稍后重试')
    } finally {
      setCompetitionLoading(false)
    }
  }

  const competitionMaxPage =
    competitionTotal > 0
      ? Math.ceil(competitionTotal / competitionPageSize)
      : 1

  const competitionOrderLabel =
    competitionOrderField === 'id'
      ? '按 ID'
      : competitionOrderField === 'start_time'
        ? '按开始时间'
        : '按结束时间'

  const competitionStatusFilterLabel =
    competitionStatusFilter === 'all'
      ? '全部状态'
      : competitionStatusFilter === '0'
        ? '仅未发布'
        : competitionStatusFilter === '1'
          ? '仅已发布'
          : '仅已删除'

  const competitionPhaseFilterLabel =
    competitionPhaseFilter === 'all'
      ? '全部比赛'
      : competitionPhaseFilter === '0'
        ? '仅未开始'
        : competitionPhaseFilter === '1'
          ? '仅进行中'
          : '仅已结束'

  const competitionPageSizeLabel = `${competitionPageSize}`

  const hasSelectedCompetitions = selectedCompetitionIds.length > 0
  const isAllCurrentPageSelected =
    competitions.length > 0 &&
    competitions.every((c) => selectedCompetitionIds.includes(c.id))
  const isHeaderIndeterminate =
    hasSelectedCompetitions && !isAllCurrentPageSelected

  useEffect(() => {
    if (!competitionHeaderSelectRef.current) return
    competitionHeaderSelectRef.current.indeterminate = isHeaderIndeterminate
  }, [isHeaderIndeterminate])

  function applyCompetitionNameSearch() {
    setCompetitionNameFilter(competitionNameFilterInput.trim())
    setCompetitionPage(1)
  }

  function handleResetFilters() {
    setCompetitionPage(1)
    setCompetitionOrderField('id')
    setCompetitionOrderDesc(false)
    setCompetitionStatusFilter('all')
    setCompetitionPhaseFilter('all')
    setCompetitionNameFilter('')
    setCompetitionNameFilterInput('')
    setCompetitionOrderDropdownOpen(false)
    setCompetitionStatusFilterOpen(false)
    setCompetitionPhaseFilterOpen(false)
    setCompetitionPageSizeDropdownOpen(false)
    setCompetitionBatchDropdownOpen(false)
    setSelectedCompetitionIds([])
    setCompetitionRefreshToken((v) => v + 1)
  }

  function handleChangeStatusFilter(value: CompetitionStatusFilter) {
    setCompetitionStatusFilter(value)
    setCompetitionPage(1)
    setCompetitionStatusFilterOpen(false)
  }

  function handleChangePhaseFilter(value: CompetitionPhaseFilter) {
    setCompetitionPhaseFilter(value)
    setCompetitionPage(1)
    setCompetitionPhaseFilterOpen(false)
  }

  function handleChangePageSizeDropdownOpen(
    open: boolean,
    event?: MouseEvent<HTMLButtonElement>,
  ) {
    if (open && !competitionPageSizeDropdownOpen && event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const estimatedMenuHeight = 180
      setCompetitionPageSizeDropUp(spaceBelow < estimatedMenuHeight)
    }
    setCompetitionPageSizeDropdownOpen(open)
  }

  function getRuntimeStatusTone(item: CompetitionItem): CompetitionRuntimeTone {
    const now = Date.now()
    const startAt = new Date(item.start_time).getTime()
    const endAt = new Date(item.end_time).getTime()
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) return 'upcoming'
    if (now < startAt) return 'upcoming'
    if (now >= startAt && now < endAt) return 'running'
    return 'finished'
  }

  function getRuntimeStatusLabel(item: CompetitionItem) {
    const tone = getRuntimeStatusTone(item)
    if (tone === 'upcoming') return '未开始'
    if (tone === 'running') return '进行中'
    if (tone === 'finished') return '已结束'
    return ''
  }

  function renderStatusPill(status: number) {
    const text =
      status === 0 ? '未发布' : status === 1 ? '已发布' : '已删除'
    const toneClass =
      status === 0
        ? 'problem-status-pill-pending'
        : status === 1
          ? 'problem-status-pill-active'
          : 'problem-status-pill-deleted'
    return <span className={`problem-status-pill ${toneClass}`}>{text}</span>
  }

  function renderRuntimePill(item: CompetitionItem) {
    const tone = getRuntimeStatusTone(item)
    const text = getRuntimeStatusLabel(item)
    if (!text) return null
    const toneClass =
      tone === 'upcoming'
        ? 'competition-runtime-pill-upcoming'
        : tone === 'running'
          ? 'competition-runtime-pill-running'
          : 'competition-runtime-pill-finished'
    return (
      <span className={`competition-runtime-pill ${toneClass}`}>{text}</span>
    )
  }

  function renderCompetitionProblemStatusPill(status: number) {
    const effective = status === 1
    const text = effective ? '启用' : '禁用'
    const toneClass = effective
      ? 'problem-status-pill-active'
      : 'problem-status-pill-deleted'
    return (
      <span className={`problem-status-pill ${toneClass}`}>
        {text}
      </span>
    )
  }

  async function batchUpdateSelectedCompetitions(patch: { status?: number }) {
    if (!hasSelectedCompetitions) return
    setCompetitionBatchSubmitting(true)
    try {
      const results = await Promise.all(
        selectedCompetitionIds.map((id) =>
          updateCompetition({
            id,
            ...patch,
          }),
        ),
      )
      const failed = results.filter(
        (res) =>
          !res.ok ||
          !res.data ||
          typeof res.data.code !== 'number' ||
          res.data.code !== 200,
      )
      if (failed.length > 0) {
        setCompetitionAlertTitle('操作失败')
        setCompetitionAlertMessage('部分比赛更新失败，请稍后重试')
        setCompetitionAlertOpen(true)
      }
      await loadCompetitions(
        competitionPage,
        competitionPageSize,
        competitionOrderField,
        competitionOrderDesc,
        competitionStatusFilter,
        competitionPhaseFilter,
        competitionNameFilter,
      )
      setSelectedCompetitionIds([])
    } catch {
      setCompetitionAlertTitle('操作失败')
      setCompetitionAlertMessage('批量操作失败，请稍后重试')
      setCompetitionAlertOpen(true)
    } finally {
      setCompetitionBatchSubmitting(false)
    }
  }

  function handleHeaderCheckboxChange(e: ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked
    if (checked) {
      setSelectedCompetitionIds(competitions.map((c) => c.id))
    } else {
      setSelectedCompetitionIds([])
    }
  }

  function handleRowCheckboxChange(
    e: ChangeEvent<HTMLInputElement>,
    id: number,
  ) {
    const checked = e.target.checked
    if (checked) {
      setSelectedCompetitionIds((prev) =>
        prev.includes(id) ? prev : [...prev, id],
      )
    } else {
      setSelectedCompetitionIds((prev) => prev.filter((cid) => cid !== id))
    }
  }

  function openCompetitionDetail(item: CompetitionItem) {
    setActiveCompetitionId(item.id)
    setActiveCompetition(null)
    setCompetitionDetailError('')
    setCompetitionDetailEditing(false)
    setCompetitionDetailStatusDropdownOpen(false)
    setCompetitionDetailTimezoneOffset(480)
    setCompetitionDetailNameDraft('')
    setCompetitionDetailStatusDraft(null)
    setCompetitionDetailStartTimeDraft('')
    setCompetitionDetailEndTimeDraft('')
    setCompetitionDetailSubmitting(false)
    setCompetitionProblemsDeleting(false)
    setCompetitionProblemDeletingId(null)
    setCompetitionProblemDeleteConfirm(null)
    setImportProblemModalOpen(false)
    setImportProblemList([])
    setImportProblemPage(1)
    setImportProblemTotal(0)
    setImportProblemLoading(false)
    setImportProblemError('')
    void loadCompetitionDetail(item.id, 480)
    void loadCompetitionProblems(item.id)
  }

  function closeCompetitionDetail() {
    competitionDetailRequestRef.current += 1
    setActiveCompetitionId(null)
    setActiveCompetition(null)
    setCompetitionDetailEditing(false)
    setCompetitionDetailStatusDropdownOpen(false)
    setCompetitionDetailSubmitting(false)
    setCompetitionDetailLoading(false)
    setCompetitionDetailError('')
    setCompetitionProblems([])
    setCompetitionProblemsError('')
    setCompetitionProblemsDeleting(false)
    setCompetitionProblemDeletingId(null)
    setCompetitionProblemDeleteConfirm(null)
    setImportProblemModalOpen(false)
    setImportProblemList([])
    setImportProblemPage(1)
    setImportProblemTotal(0)
    setImportProblemLoading(false)
    setImportProblemError('')
    void loadCompetitions(
      competitionPage,
      competitionPageSize,
      competitionOrderField,
      competitionOrderDesc,
      competitionStatusFilter,
      competitionPhaseFilter,
      competitionNameFilter,
    )
  }

  const competitionDetailHasChanges =
    competitionDetailEditing &&
    activeCompetition !== null &&
    (competitionDetailNameDraft !== activeCompetition.name ||
      (competitionDetailStatusDraft !== null &&
        competitionDetailStatusDraft !== activeCompetition.status) ||
      toRfc3339FromLocal(
        competitionDetailStartTimeDraft,
        competitionDetailTimezoneOffset,
      ) !== activeCompetition.start_time ||
      toRfc3339FromLocal(
        competitionDetailEndTimeDraft,
        competitionDetailTimezoneOffset,
      ) !== activeCompetition.end_time)

  async function handleConfirmCompetitionDetailChanges() {
    if (
      !activeCompetition ||
      !competitionDetailEditing ||
      !competitionDetailHasChanges ||
      competitionDetailSubmitting
    ) {
      return
    }

    const trimmedName = competitionDetailNameDraft.trim()
    const trimmedStartTime = competitionDetailStartTimeDraft.trim()
    const trimmedEndTime = competitionDetailEndTimeDraft.trim()

    const body: {
      id: number
      name?: string
      start_time?: string
      end_time?: string
      status?: number
    } = {
      id: activeCompetition.id,
    }

    if (trimmedName !== activeCompetition.name) {
      body.name = trimmedName
    }
    const startIso = toRfc3339FromLocal(
      trimmedStartTime,
      competitionDetailTimezoneOffset,
    )
    const endIso = toRfc3339FromLocal(
      trimmedEndTime,
      competitionDetailTimezoneOffset,
    )

    if (startIso && startIso !== activeCompetition.start_time) {
      body.start_time = startIso
    }
    if (endIso && endIso !== activeCompetition.end_time) {
      body.end_time = endIso
    }
    if (
      competitionDetailStatusDraft !== null &&
      competitionDetailStatusDraft !== activeCompetition.status
    ) {
      body.status = competitionDetailStatusDraft
    }

    if (
      typeof body.name === 'undefined' &&
      typeof body.start_time === 'undefined' &&
      typeof body.end_time === 'undefined' &&
      typeof body.status === 'undefined'
    ) {
      return
    }

    setCompetitionDetailSubmitting(true)
    try {
      const res = await updateCompetition(body)
      if (!res.ok || !res.data || res.data.code !== 200) {
        const msg = res.data?.message ?? '更新比赛失败'
        setCompetitionAlertTitle('操作失败')
        setCompetitionAlertMessage(msg)
        setCompetitionAlertOpen(true)
        return
      }

      if (!activeCompetition) return
      const updated: CompetitionDetailItem = {
        ...activeCompetition,
        name: body.name ?? activeCompetition.name,
        start_time: body.start_time ?? activeCompetition.start_time,
        end_time: body.end_time ?? activeCompetition.end_time,
        status: body.status ?? activeCompetition.status,
      }

      const listItem: CompetitionItem = {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        start_time: updated.start_time,
        end_time: updated.end_time,
        creator_id: updated.creator_id,
        updater_id: updated.updater_id,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      }

      setActiveCompetition(updated)
      setCompetitions((prev) =>
        prev.map((item) => (item.id === updated.id ? listItem : item)),
      )
      setCompetitionDetailNameDraft(updated.name)
      setCompetitionDetailStatusDraft(updated.status)
      setCompetitionDetailStartTimeDraft(
        toDateTimeLocalValue(
          updated.start_time,
          competitionDetailTimezoneOffset,
        ),
      )
      setCompetitionDetailEndTimeDraft(
        toDateTimeLocalValue(
          updated.end_time,
          competitionDetailTimezoneOffset,
        ),
      )
      setCompetitionDetailEditing(false)
      setCompetitionDetailStatusDropdownOpen(false)
    } catch {
      setCompetitionAlertTitle('操作失败')
      setCompetitionAlertMessage('更新比赛失败，请稍后重试')
      setCompetitionAlertOpen(true)
    } finally {
      setCompetitionDetailSubmitting(false)
    }
  }

  async function handleUpdateCompetitionProblemStatus(
    competitionId: number,
    problemId: number,
    targetStatus: number,
  ) {
    if (competitionProblemsUpdating) return
    setCompetitionProblemsUpdating(true)
    try {
      const api =
        targetStatus === 1 ? enableCompetitionProblems : disableCompetitionProblems
      const res = await api(competitionId, [problemId])
      if (!res.ok || !res.data || res.data.code !== 200) {
        const msg = res.data?.message ?? '更新比赛题目状态失败'
        setCompetitionAlertTitle('操作失败')
        setCompetitionAlertMessage(msg)
        setCompetitionAlertOpen(true)
        return
      }
      await loadCompetitionProblems(competitionId)
    } catch {
      setCompetitionAlertTitle('操作失败')
      setCompetitionAlertMessage('更新比赛题目状态失败，请稍后重试')
      setCompetitionAlertOpen(true)
    } finally {
      setCompetitionProblemsUpdating(false)
    }
  }

  function handleDeleteCompetitionProblem(problem: CompetitionProblemItem) {
    setCompetitionProblemDeleteConfirm(problem)
  }

  async function handleConfirmDeleteCompetitionProblem() {
    if (!competitionProblemDeleteConfirm) return
    if (activeCompetitionId === null) return
    if (competitionProblemsUpdating || competitionProblemsDeleting) return

    const target = competitionProblemDeleteConfirm
    setCompetitionProblemsDeleting(true)
    setCompetitionProblemDeletingId(target.problem_id)
    try {
      const res = await removeCompetitionProblems(activeCompetitionId, [
        target.problem_id,
      ])
      if (!res.ok || !res.data || res.data.code !== 200) {
        const msg = res.data?.message ?? '删除比赛题目失败'
        setCompetitionAlertTitle('操作失败')
        setCompetitionAlertMessage(msg)
        setCompetitionAlertOpen(true)
        return
      }
      setCompetitionProblems((prev) =>
        prev.filter((item) => item.problem_id !== target.problem_id),
      )
    } catch {
      setCompetitionAlertTitle('操作失败')
      setCompetitionAlertMessage('删除比赛题目失败，请稍后重试')
      setCompetitionAlertOpen(true)
    } finally {
      setCompetitionProblemsDeleting(false)
      setCompetitionProblemDeletingId(null)
      setCompetitionProblemDeleteConfirm(null)
    }
  }

  async function loadImportProblemList(page: number) {
    setImportProblemLoading(true)
    setImportProblemError('')
    try {
      const res = await fetchProblemList(page, 10, 'id', true, 1)
      if (!res.ok || !res.data || res.data.code !== 200) {
        setImportProblemList([])
        setImportProblemTotal(0)
        setImportProblemError(res.data?.message ?? '获取题目列表失败')
        return
      }

      const data = res.data.data
      if (!data || !Array.isArray(data.list)) {
        setImportProblemList([])
        setImportProblemTotal(0)
        setImportProblemError('获取题目列表失败')
        return
      }

      setImportProblemTotal(typeof data.total === 'number' ? data.total : 0)
      setImportProblemList(
        data.list.map((item) => ({
          id: item.id,
          title: item.title,
          time_limit: item.time_limit,
          memory_limit: item.memory_limit,
        })),
      )
    } catch {
      setImportProblemList([])
      setImportProblemTotal(0)
      setImportProblemError('网络错误，请稍后重试')
    } finally {
      setImportProblemLoading(false)
    }
  }

  function openImportProblemModal() {
    setImportProblemModalOpen(true)
    setImportProblemList([])
    setSelectedImportProblemIds([])
    setImportProblemPage(1)
    setImportProblemTotal(0)
    setImportProblemSubmitting(false)
    setImportProblemError('')
  }

  async function handleAddSelectedImportProblems() {
    if (activeCompetitionId === null) return
    if (importProblemSubmitting) return

    const problemIdSet = new Set(
      competitionProblems.map((item) => item.problem_id),
    )
    const selectedIds = selectedImportProblemIds.filter(
      (id) => !problemIdSet.has(id),
    )
    if (selectedIds.length === 0) return

    setImportProblemSubmitting(true)
    try {
      const res = await addCompetitionProblems(activeCompetitionId, selectedIds)
      if (!res.ok || !res.data || res.data.code !== 200) {
        setCompetitionAlertTitle('添加失败')
        setCompetitionAlertMessage(res.data?.message ?? '添加比赛题目失败')
        setCompetitionAlertOpen(true)
        return
      }

      setSelectedImportProblemIds([])
      await loadCompetitionProblems(activeCompetitionId)
      setCompetitionAlertTitle('添加成功')
      setCompetitionAlertMessage('已添加到比赛题目列表')
      setCompetitionAlertOpen(true)
    } catch {
      setCompetitionAlertTitle('添加失败')
      setCompetitionAlertMessage('网络错误，请稍后重试')
      setCompetitionAlertOpen(true)
    } finally {
      setImportProblemSubmitting(false)
    }
  }

  function openCreateCompetitionModal() {
    if (competitionLoading) return
    setCreateCompetitionModalOpen(true)
    setCreateCompetitionName('')
    setCreateCompetitionTimezoneOffset(480)
    setCreateCompetitionStartLocal('')
    setCreateCompetitionEndLocal('')
    setCreateCompetitionSubmitting(false)
  }

  function createCompetitionHasChanges() {
    return (
      createCompetitionName.trim() !== '' &&
      createCompetitionStartLocal.trim() !== '' &&
      createCompetitionEndLocal.trim() !== ''
    )
  }

  async function handleSubmitCreateCompetition(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (createCompetitionSubmitting) return
    if (!createCompetitionHasChanges()) return

    const startValue = createCompetitionStartLocal.trim()
    const endValue = createCompetitionEndLocal.trim()
    const offset = createCompetitionTimezoneOffset
    const startIso = toRfc3339FromLocal(startValue, offset)
    const endIso = toRfc3339FromLocal(endValue, offset)
    if (!startIso || !endIso) {
      setCompetitionAlertTitle('创建失败')
      setCompetitionAlertMessage('开始时间或结束时间格式不正确')
      setCompetitionAlertOpen(true)
      return
    }

    const startMs = Date.parse(startIso)
    const endMs = Date.parse(endIso)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      setCompetitionAlertTitle('创建失败')
      setCompetitionAlertMessage('开始时间或结束时间解析失败')
      setCompetitionAlertOpen(true)
      return
    }
    if (startMs >= endMs) {
      setCompetitionAlertTitle('创建失败')
      setCompetitionAlertMessage('开始时间必须早于结束时间')
      setCompetitionAlertOpen(true)
      return
    }

    const startWithMs = startIso.replace(/\.\d{3}Z$/u, '.000Z')
    const endWithMs = endIso.replace(/\.\d{3}Z$/u, '.000Z')

    setCreateCompetitionSubmitting(true)
    try {
      const res = await createCompetition({
        name: createCompetitionName.trim(),
        start_time: startWithMs,
        end_time: endWithMs,
      })
      if (!res.ok || !res.data || res.data.code !== 200) {
        setCompetitionAlertTitle('创建失败')
        setCompetitionAlertMessage(res.data?.message ?? '创建比赛失败')
        setCompetitionAlertOpen(true)
        return
      }

      setCreateCompetitionModalOpen(false)
      setCompetitionAlertTitle('创建成功')
      setCompetitionAlertMessage('比赛已创建')
      setCompetitionAlertOpen(true)
      setCompetitionRefreshToken((token) => token + 1)
    } catch {
      setCompetitionAlertTitle('创建失败')
      setCompetitionAlertMessage('网络错误，请稍后重试')
      setCompetitionAlertOpen(true)
    } finally {
      setCreateCompetitionSubmitting(false)
    }
  }

  if (activeCompetitionId !== null) {
    return (
      <>
        <div className="problem-detail">
          <div className="competition-detail-split">
          <div className="competition-detail-left">
            <div className="problem-detail-header">
              <button
                type="button"
                className="problem-detail-back-btn"
                onClick={closeCompetitionDetail}
              >
                ← 返回比赛列表
              </button>
              <div className="problem-detail-header-main">
                <div className="competition-detail-title-row">
                  <div className="problem-detail-title">
                    {activeCompetition?.name || '比赛详情'}
                  </div>
                  <div className="competition-detail-title-id">
                    ID {activeCompetitionId}
                  </div>
                </div>
                <div className="competition-detail-meta-lines">
                  {competitionDetailLoading && (
                    <div className="competition-detail-meta-line">
                      正在加载比赛详情…
                    </div>
                  )}
                  {!competitionDetailLoading && competitionDetailError && (
                    <div className="competition-detail-meta-line">
                      {competitionDetailError}
                    </div>
                  )}
                  {!competitionDetailLoading &&
                    !competitionDetailError &&
                    activeCompetition && (
                      <>
                        <div className="competition-detail-meta-line">
                          最后更新用户{' '}
                          {activeCompetition.updater_realname?.trim()
                            ? activeCompetition.updater_realname
                            : activeCompetition.updater_id}{' '}
                          · {formatDateTimeText(activeCompetition.updated_at)}
                        </div>
                        <div className="competition-detail-meta-line">
                          创建用户{' '}
                          {activeCompetition.creator_realname?.trim()
                            ? activeCompetition.creator_realname
                            : activeCompetition.creator_id}{' '}
                          · {formatDateTimeText(activeCompetition.created_at)}
                        </div>
                      </>
                    )}
                </div>
              </div>
            </div>
            <div className="problem-detail-body">
              <div className="problem-detail-section">
                <div className="problem-detail-section-title">基本信息</div>
                <div className="problem-detail-main-row">
                  <div className="problem-detail-grid">
                    <div className="problem-detail-item-label">比赛名称</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <div className="problem-detail-title-input-wrapper">
                          <input
                            type="text"
                            className="problem-detail-input problem-detail-input-title"
                            maxLength={255}
                            value={competitionDetailNameDraft}
                            onChange={(e) =>
                              setCompetitionDetailNameDraft(e.target.value)
                            }
                          />
                          <span className="problem-detail-title-counter">
                            {competitionDetailNameDraft.length} / 255
                          </span>
                        </div>
                      ) : (
                        activeCompetition?.name ?? '-'
                      )}
                    </div>
                    <div className="problem-detail-item-label">发布状态</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <div className="problem-sort-select-wrapper">
                          <button
                            type="button"
                            className={
                              'problem-sort-select problem-detail-select-trigger' +
                              (competitionDetailStatusDropdownOpen
                                ? ' problem-sort-select-open'
                                : '')
                            }
                            onClick={() =>
                              setCompetitionDetailStatusDropdownOpen(
                                (open) => !open,
                              )
                            }
                          >
                            {(competitionDetailStatusDraft ??
                              (activeCompetition?.status ?? 0)) === 0
                              ? '未发布'
                            : (competitionDetailStatusDraft ??
                                (activeCompetition?.status ?? 0)) === 1
                                ? '已发布'
                                : '已删除'}
                          </button>
                          {competitionDetailStatusDropdownOpen && (
                            <div className="problem-sort-menu problem-detail-select-menu">
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => {
                                  setCompetitionDetailStatusDraft(0)
                                  setCompetitionDetailStatusDropdownOpen(false)
                                }}
                              >
                                未发布
                              </button>
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => {
                                  setCompetitionDetailStatusDraft(1)
                                  setCompetitionDetailStatusDropdownOpen(false)
                                }}
                              >
                                已发布
                              </button>
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => {
                                  setCompetitionDetailStatusDraft(2)
                                  setCompetitionDetailStatusDropdownOpen(false)
                                }}
                              >
                                已删除
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        (activeCompetition
                          ? renderStatusPill(activeCompetition.status)
                          : '-')
                      )}
                    </div>
                    <div className="problem-detail-item-label">进行状态</div>
                    <div className="problem-detail-item-value">
                      {activeCompetition ? renderRuntimePill(activeCompetition) : '-'}
                    </div>
                    <div className="problem-detail-item-label">时区</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <select
                          className="problem-detail-input problem-detail-input-inline"
                          value={competitionDetailTimezoneOffset}
                          onChange={(e) => {
                            const nextOffset = Number(e.target.value)
                            if (Number.isNaN(nextOffset)) {
                              setCompetitionDetailTimezoneOffset(0)
                              return
                            }
                            const prevOffset = competitionDetailTimezoneOffset
                            const startValue =
                              competitionDetailStartTimeDraft.trim()
                            const endValue = competitionDetailEndTimeDraft.trim()
                            if (startValue) {
                              const iso = toRfc3339FromLocal(
                                startValue,
                                prevOffset,
                              )
                              if (iso) {
                                setCompetitionDetailStartTimeDraft(
                                  toDateTimeLocalValue(iso, nextOffset),
                                )
                              }
                            }
                            if (endValue) {
                              const iso = toRfc3339FromLocal(endValue, prevOffset)
                              if (iso) {
                                setCompetitionDetailEndTimeDraft(
                                  toDateTimeLocalValue(iso, nextOffset),
                                )
                              }
                            }
                            setCompetitionDetailTimezoneOffset(nextOffset)
                          }}
                        >
                          {COMPETITION_TIMEZONE_OPTIONS.map((item) => (
                            <option key={item.offset} value={item.offset}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        (COMPETITION_TIMEZONE_OPTIONS.find(
                          (item) =>
                            item.offset === competitionDetailTimezoneOffset,
                        ) ?? COMPETITION_TIMEZONE_OPTIONS[0]
                        ).label
                      )}
                    </div>
                    <div className="problem-detail-item-label">开始时间</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <input
                          type="datetime-local"
                          className="problem-detail-input problem-detail-input-inline"
                          style={{ minWidth: '180px' }}
                          value={competitionDetailStartTimeDraft}
                          step={1}
                          onChange={(e) =>
                            setCompetitionDetailStartTimeDraft(e.target.value)
                          }
                        />
                      ) : (
                        (activeCompetition
                          ? formatDateTimeText(activeCompetition.start_time)
                          : '-')
                      )}
                    </div>
                    <div className="problem-detail-item-label">结束时间</div>
                    <div className="problem-detail-item-value">
                      {competitionDetailEditing ? (
                        <input
                          type="datetime-local"
                          className="problem-detail-input problem-detail-input-inline"
                          style={{ minWidth: '180px' }}
                          value={competitionDetailEndTimeDraft}
                          step={1}
                          onChange={(e) =>
                            setCompetitionDetailEndTimeDraft(e.target.value)
                          }
                        />
                      ) : (
                        (activeCompetition
                          ? formatDateTimeText(activeCompetition.end_time)
                          : '-')
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={
                  'problem-detail-actions' +
                  (!competitionDetailEditing ? ' competition-detail-actions-left' : '')
                }
              >
                {!competitionDetailEditing && (
                  <button
                    type="button"
                    className="problem-detail-edit-btn"
                    disabled={
                      !activeCompetition ||
                      competitionDetailLoading ||
                      !!competitionDetailError
                    }
                    onClick={() => {
                      if (!activeCompetition) return
                      setCompetitionDetailNameDraft(activeCompetition.name)
                      setCompetitionDetailStatusDraft(activeCompetition.status)
                      setCompetitionDetailStartTimeDraft(
                        toDateTimeLocalValue(
                          activeCompetition.start_time,
                          competitionDetailTimezoneOffset,
                        ),
                      )
                      setCompetitionDetailEndTimeDraft(
                        toDateTimeLocalValue(
                          activeCompetition.end_time,
                          competitionDetailTimezoneOffset,
                        ),
                      )
                      setCompetitionDetailEditing(true)
                      setCompetitionDetailStatusDropdownOpen(false)
                    }}
                  >
                    修改
                  </button>
                )}
                {competitionDetailEditing && (
                  <>
                    <button
                      type="button"
                      className="problem-detail-cancel-btn"
                      onClick={() => {
                        if (!activeCompetition) return
                        setCompetitionDetailNameDraft(activeCompetition.name)
                        setCompetitionDetailStatusDraft(activeCompetition.status)
                        setCompetitionDetailStartTimeDraft(
                          toDateTimeLocalValue(
                            activeCompetition.start_time,
                            competitionDetailTimezoneOffset,
                          ),
                        )
                        setCompetitionDetailEndTimeDraft(
                          toDateTimeLocalValue(
                            activeCompetition.end_time,
                            competitionDetailTimezoneOffset,
                          ),
                        )
                        setCompetitionDetailEditing(false)
                        setCompetitionDetailStatusDropdownOpen(false)
                      }}
                    >
                      取消修改
                    </button>
                    <button
                      type="button"
                      className="problem-detail-confirm-btn"
                      disabled={
                        !competitionDetailHasChanges || competitionDetailSubmitting
                      }
                      onClick={handleConfirmCompetitionDetailChanges}
                    >
                      确认修改
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="competition-detail-right">
            <div className="problem-detail-section">
              <div className="problem-detail-section-title-row">
                <div className="problem-detail-section-title">比赛题目</div>
                <button
                  type="button"
                  className="problem-add-button"
                  aria-label="导入题目"
                  title="导入题目"
                  onClick={openImportProblemModal}
                >
                  ＋
                </button>
              </div>
              <div className="problem-detail-main-row">
                {competitionProblemsLoading && (
                  <div className="competition-empty">正在加载比赛题目…</div>
                )}
                {!competitionProblemsLoading && competitionProblemsError && (
                  <div className="competition-error">{competitionProblemsError}</div>
                )}
                {!competitionProblemsLoading &&
                  !competitionProblemsError &&
                  competitionProblems.length === 0 && (
                    <div className="competition-empty">当前比赛暂无题目</div>
                  )}
                {!competitionProblemsLoading &&
                  !competitionProblemsError &&
                  competitionProblems.length > 0 && (
                    <div className="competition-admin-list-table competition-problem-list-table">
                      <div className="competition-admin-list-row competition-admin-list-row-header competition-problem-list-row">
                        <div className="competition-admin-col-id">题目ID</div>
                        <div className="competition-admin-col-name">题目标题</div>
                        <div className="competition-admin-col-status">状态</div>
                        <div className="competition-admin-col-actions">操作</div>
                      </div>
                      <div className="competition-admin-list-body">
                        {competitionProblems.map((item) => (
                          <div
                            key={item.id}
                            className="competition-admin-list-row competition-problem-list-row"
                          >
                            <div className="competition-admin-col-id">
                              {item.problem_id}
                            </div>
                            <div className="competition-admin-col-name">
                              {item.problem_title}
                            </div>
                            <div className="competition-admin-col-status">
                              {renderCompetitionProblemStatusPill(item.status)}
                            </div>
                            <div className="competition-admin-col-actions problem-col-actions">
                                {item.status === 1 ? (
                                  <button
                                    type="button"
                                    className="competition-problem-action-btn competition-problem-action-btn-danger"
                                    disabled={
                                      competitionProblemsUpdating ||
                                      competitionProblemsDeleting ||
                                      activeCompetitionId === null
                                    }
                                    onClick={() => {
                                      if (activeCompetitionId === null) return
                                      void handleUpdateCompetitionProblemStatus(
                                        activeCompetitionId,
                                        item.problem_id,
                                        0,
                                      )
                                    }}
                                  >
                                    禁用
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="competition-problem-action-btn"
                                    disabled={
                                      competitionProblemsUpdating ||
                                      competitionProblemsDeleting ||
                                      activeCompetitionId === null
                                    }
                                    onClick={() => {
                                      if (activeCompetitionId === null) return
                                      void handleUpdateCompetitionProblemStatus(
                                        activeCompetitionId,
                                        item.problem_id,
                                        1,
                                      )
                                    }}
                                  >
                                    启用
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="competition-problem-action-btn competition-problem-action-btn-danger"
                                  disabled={
                                    competitionProblemsUpdating ||
                                    competitionProblemsDeleting ||
                                    activeCompetitionId === null
                                  }
                                  onClick={() => {
                                    handleDeleteCompetitionProblem(item)
                                  }}
                                >
                                  {competitionProblemsDeleting &&
                                  competitionProblemDeletingId === item.problem_id
                                    ? '删除中…'
                                    : '删除'}
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
        </div>
        {competitionProblemDeleteConfirm && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-title">确认删除</div>
              <div className="admin-modal-message">
                确认要删除比赛题目（题目ID: {competitionProblemDeleteConfirm.problem_id}）吗？
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="problem-detail-edit-btn"
                  disabled={competitionProblemsDeleting}
                  onClick={() => setCompetitionProblemDeleteConfirm(null)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="admin-modal-primary-btn"
                  disabled={competitionProblemsDeleting}
                  onClick={handleConfirmDeleteCompetitionProblem}
                >
                  {competitionProblemsDeleting ? '删除中…' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
        {importProblemModalOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal" style={{ width: '640px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <div className="admin-modal-title">导入题目</div>
              <div
                className="admin-modal-message"
                style={{
                  flex: '1 1 auto',
                  minHeight: 0,
                  marginBottom: '12px',
                  overflow: 'hidden',
                }}
              >
                {importProblemLoading && <div>正在加载题目列表…</div>}
                {!importProblemLoading && importProblemError && (
                  <div>{importProblemError}</div>
                )}
                {!importProblemLoading &&
                  !importProblemError &&
                  importProblemList.length === 0 && (
                    <div>暂无可导入的题目</div>
                  )}
                {!importProblemLoading &&
                  !importProblemError &&
                  importProblemList.length > 0 && (
                    <div className="competition-admin-list-table competition-problem-list-table import-problem-table">
                      <div className="competition-admin-list-row competition-admin-list-row-header import-problem-list-row">
                        <div className="competition-admin-col-select"></div>
                        <div className="competition-admin-col-id">题目ID</div>
                        <div className="competition-admin-col-name">题目标题</div>
                        <div className="competition-admin-col-status">时间限制</div>
                        <div className="competition-admin-col-actions">内存限制</div>
                      </div>
                      <div className="competition-admin-list-body">
                        {importProblemList.map((item) => {
                          const isInCompetition = competitionProblemIdSet.has(item.id)
                          const checkboxTip = isInCompetition
                            ? '该题目已在当前比赛题目列表中'
                            : '选择题目'
                          return (
                            <div
                              key={item.id}
                              className={
                                'competition-admin-list-row import-problem-list-row' +
                                (isInCompetition
                                  ? ' import-problem-list-row-disabled'
                                  : '')
                              }
                            >
                            <div className="competition-admin-col-select">
                              <span title={checkboxTip}>
                                <input
                                  type="checkbox"
                                  aria-label={`选择题目 ${item.id}`}
                                  disabled={
                                    isInCompetition ||
                                    importProblemSubmitting
                                  }
                                  checked={
                                    !isInCompetition &&
                                    selectedImportProblemIds.includes(item.id)
                                  }
                                  onChange={() => {
                                    if (isInCompetition) return
                                    if (importProblemSubmitting) return
                                    setSelectedImportProblemIds((prev) =>
                                      prev.includes(item.id)
                                        ? prev.filter((id) => id !== item.id)
                                        : [...prev, item.id],
                                    )
                                  }}
                                />
                              </span>
                            </div>
                            <div className="competition-admin-col-id">
                              {item.id}
                            </div>
                            <div className="competition-admin-col-name">
                              {item.title}
                            </div>
                            <div className="competition-admin-col-status">
                              {item.time_limit} ms
                            </div>
                            <div className="competition-admin-col-actions problem-col-actions">
                              {item.memory_limit} MB
                            </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
              </div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="problem-detail-edit-btn"
                  onClick={() => setImportProblemModalOpen(false)}
                >
                  关闭
                </button>
                <button
                  type="button"
                  className="problem-detail-edit-btn import-problem-add-btn"
                  disabled={
                    importProblemSubmitting ||
                    selectedImportProblemIds.filter(
                      (id) => !competitionProblemIdSet.has(id),
                    ).length === 0 ||
                    activeCompetitionId === null
                  }
                  onClick={handleAddSelectedImportProblems}
                >
                  {importProblemSubmitting ? '添加中…' : '添加'}
                </button>
                {importProblemTotal > 0 && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() =>
                        setImportProblemPage((page) => Math.max(1, page - 1))
                      }
                      disabled={
                        importProblemPage <= 1 ||
                        importProblemLoading ||
                        importProblemSubmitting
                      }
                    >
                      上一页
                    </button>
                    <span className="competition-page-info">
                      第 {importProblemPage} /{' '}
                      {Math.max(
                        1,
                        Math.ceil(importProblemTotal / 10),
                      )}{' '}
                      页
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setImportProblemPage((page) =>
                          Math.min(
                            Math.max(1, Math.ceil(importProblemTotal / 10)),
                            page + 1,
                          ),
                        )
                      }
                      disabled={
                        importProblemPage >=
                          Math.max(1, Math.ceil(importProblemTotal / 10)) ||
                        importProblemLoading ||
                        importProblemSubmitting
                      }
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {competitionAlertOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-title">
                {competitionAlertTitle || '提示'}
              </div>
              <div className="admin-modal-message">{competitionAlertMessage}</div>
              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-modal-primary-btn"
                  onClick={() => setCompetitionAlertOpen(false)}
                >
                  知道了
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="competition-admin-list">
        <div className="problem-list-toolbar">
        <div className="problem-batch-group">
          <span className="problem-batch-label">批量操作</span>
          <div className="problem-batch-select-wrapper">
            <button
              type="button"
              className="problem-batch-select"
              disabled={!hasSelectedCompetitions || competitionBatchSubmitting}
              onClick={() =>
                setCompetitionBatchDropdownOpen((open) => !open)
              }
            >
              选择操作
            </button>
            {competitionBatchDropdownOpen && (
              <div className="problem-batch-menu">
                <button
                  type="button"
                  className="problem-batch-menu-item"
                  onClick={async () => {
                    setCompetitionBatchDropdownOpen(false)
                    await batchUpdateSelectedCompetitions({ status: 1 })
                  }}
                >
                  批量发布
                </button>
                <button
                  type="button"
                  className="problem-batch-menu-item"
                  onClick={async () => {
                    setCompetitionBatchDropdownOpen(false)
                    await batchUpdateSelectedCompetitions({ status: 0 })
                  }}
                >
                  批量设为未发布
                </button>
                <button
                  type="button"
                  className="problem-batch-menu-item"
                  onClick={async () => {
                    setCompetitionBatchDropdownOpen(false)
                    await batchUpdateSelectedCompetitions({ status: 2 })
                  }}
                >
                  批量删除
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="problem-toolbar-right">
          <button
            type="button"
            className="competition-refresh-btn"
            onClick={handleResetFilters}
            disabled={competitionLoading}
            aria-label="重置筛选并刷新比赛列表"
            title="重置筛选并刷新"
          >
            ↻
          </button>
          <div className="problem-search-group">
            <div className="problem-search-input-wrapper">
              <button
                type="button"
                className="problem-search-icon-btn"
                onClick={applyCompetitionNameSearch}
                disabled={competitionLoading}
                aria-label="搜索"
                title="搜索"
              >
                🔍
              </button>
              <input
                type="text"
                className="problem-search-input"
                placeholder="搜索比赛名称"
                value={competitionNameFilterInput}
                onChange={(e) =>
                  setCompetitionNameFilterInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    applyCompetitionNameSearch()
                  }
                }}
                disabled={competitionLoading}
              />
            </div>
          </div>
          <div className="problem-sort-group">
            <span className="problem-sort-label">排序</span>
            <div className="problem-sort-select-wrapper">
              <button
                type="button"
                className={
                  'problem-sort-select' +
                  (competitionOrderDropdownOpen
                    ? ' problem-sort-select-open'
                    : '')
                }
                onClick={() =>
                  setCompetitionOrderDropdownOpen((open) => !open)
                }
                disabled={competitionLoading}
              >
                {competitionOrderLabel}
              </button>
              {competitionOrderDropdownOpen && (
                <div className="problem-sort-menu">
                  <button
                    type="button"
                    className={
                      'problem-sort-menu-item' +
                      (competitionOrderField === 'id'
                        ? ' problem-sort-menu-item-active'
                        : '')
                    }
                    onClick={() => {
                      setCompetitionOrderField('id')
                      setCompetitionOrderDropdownOpen(false)
                    }}
                  >
                    按 ID
                  </button>
                  <button
                    type="button"
                    className={
                      'problem-sort-menu-item' +
                      (competitionOrderField === 'start_time'
                        ? ' problem-sort-menu-item-active'
                        : '')
                    }
                    onClick={() => {
                      setCompetitionOrderField('start_time')
                      setCompetitionOrderDropdownOpen(false)
                    }}
                  >
                    按开始时间
                  </button>
                  <button
                    type="button"
                    className={
                      'problem-sort-menu-item' +
                      (competitionOrderField === 'end_time'
                        ? ' problem-sort-menu-item-active'
                        : '')
                    }
                    onClick={() => {
                      setCompetitionOrderField('end_time')
                      setCompetitionOrderDropdownOpen(false)
                    }}
                  >
                    按结束时间
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className={
                'problem-sort-order-btn' +
                (!competitionOrderDesc
                  ? ' problem-sort-order-btn-active'
                  : '')
              }
              onClick={() => setCompetitionOrderDesc(false)}
              disabled={competitionLoading}
            >
              升序
            </button>
            <button
              type="button"
              className={
                'problem-sort-order-btn' +
                (competitionOrderDesc
                  ? ' problem-sort-order-btn-active'
                  : '')
              }
              onClick={() => setCompetitionOrderDesc(true)}
              disabled={competitionLoading}
            >
              降序
            </button>
          </div>
        </div>
        </div>
        {competitionError && (
          <div className="competition-error">{competitionError}</div>
        )}
        {!competitionError && (
          <>
            {competitionLoading && (
              <div className="competition-empty">正在加载比赛列表…</div>
            )}
            <div className="competition-admin-list-table">
            <div className="competition-admin-list-row competition-admin-list-row-header">
              <div className="competition-admin-col-select">
                <input
                  type="checkbox"
                  ref={competitionHeaderSelectRef}
                  className="problem-select-checkbox"
                  checked={isAllCurrentPageSelected}
                  disabled={competitionLoading || competitions.length === 0}
                  onChange={handleHeaderCheckboxChange}
                />
              </div>
              <div className="competition-admin-col-id">ID</div>
              <div className="competition-admin-col-name">名称</div>
              <div className="competition-admin-col-status">
                <div className="problem-filter-header">
                  <span>发布状态</span>
                  <div className="problem-filter-wrapper">
                    <button
                      type="button"
                      className={
                        'problem-filter-icon-btn' +
                        (competitionStatusFilter !== 'all'
                          ? ' problem-filter-icon-btn-active'
                          : '') +
                        (competitionStatusFilterOpen
                          ? ' problem-filter-icon-btn-open'
                          : '')
                      }
                      onClick={() =>
                        setCompetitionStatusFilterOpen((open) => !open)
                      }
                      disabled={competitionLoading}
                      aria-label={competitionStatusFilterLabel}
                    />
                    {competitionStatusFilterOpen && (
                      <div className="problem-filter-menu">
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (competitionStatusFilter === 'all'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => handleChangeStatusFilter('all')}
                        >
                          全部
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (competitionStatusFilter === '0'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => handleChangeStatusFilter('0')}
                        >
                          未发布
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (competitionStatusFilter === '1'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => handleChangeStatusFilter('1')}
                        >
                          已发布
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (competitionStatusFilter === '2'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => handleChangeStatusFilter('2')}
                        >
                          已删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="competition-admin-col-runtime-status">
                <div className="problem-filter-header">
                  <span>进行状态</span>
                  <div className="problem-filter-wrapper">
                    <button
                      type="button"
                      className={
                        'problem-filter-icon-btn' +
                        (competitionPhaseFilter !== 'all'
                          ? ' problem-filter-icon-btn-active'
                          : '') +
                        (competitionPhaseFilterOpen
                          ? ' problem-filter-icon-btn-open'
                          : '')
                      }
                      onClick={() =>
                        setCompetitionPhaseFilterOpen((open) => !open)
                      }
                      disabled={competitionLoading}
                      aria-label={competitionPhaseFilterLabel}
                    />
                    {competitionPhaseFilterOpen && (
                      <div className="problem-filter-menu">
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (competitionPhaseFilter === 'all'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => handleChangePhaseFilter('all')}
                        >
                          全部
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (competitionPhaseFilter === '0'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => handleChangePhaseFilter('0')}
                        >
                          未开始
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (competitionPhaseFilter === '1'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => handleChangePhaseFilter('1')}
                        >
                          进行中
                        </button>
                        <button
                          type="button"
                          className={
                            'problem-filter-menu-item' +
                            (competitionPhaseFilter === '2'
                              ? ' problem-filter-menu-item-active'
                              : '')
                          }
                          onClick={() => handleChangePhaseFilter('2')}
                        >
                          已结束
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="competition-admin-col-time">开始时间</div>
              <div className="competition-admin-col-time">结束时间</div>
              <div className="competition-admin-col-actions">操作</div>
            </div>
            <div className="competition-admin-list-body">
              {!competitionLoading && competitions.length === 0 && (
                <div className="competition-admin-list-row competition-admin-list-row-empty">
                  <div className="competition-admin-col-select" />
                  <div className="competition-admin-col-id" />
                  <div className="competition-admin-col-name">
                    暂无比赛
                  </div>
                  <div className="competition-admin-col-status" />
                  <div className="competition-admin-col-runtime-status" />
                  <div className="competition-admin-col-time" />
                  <div className="competition-admin-col-time" />
                  <div className="competition-admin-col-actions" />
                </div>
              )}
              {!competitionLoading &&
                competitions.length > 0 &&
                competitions.map((c) => (
                  <div
                    key={c.id}
                    className="competition-admin-list-row"
                    onClick={() => openCompetitionDetail(c)}
                  >
                    <div className="competition-admin-col-select">
                      <input
                        type="checkbox"
                        className="problem-select-checkbox"
                        checked={selectedCompetitionIds.includes(c.id)}
                        disabled={competitionLoading || competitionBatchSubmitting}
                        onChange={(e) => handleRowCheckboxChange(e, c.id)}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      />
                    </div>
                    <div className="competition-admin-col-id">
                      {c.id}
                    </div>
                    <div className="competition-admin-col-name">
                      {c.name}
                    </div>
                    <div className="competition-admin-col-status">
                      {renderStatusPill(c.status)}
                    </div>
                    <div className="competition-admin-col-runtime-status">
                      {renderRuntimePill(c)}
                    </div>
                    <div className="competition-admin-col-time">
                      {formatDateTimeText(c.start_time)}
                    </div>
                    <div className="competition-admin-col-time">
                      {formatDateTimeText(c.end_time)}
                    </div>
                    <div className="competition-admin-col-actions problem-col-actions">
                      <button
                        type="button"
                        className="problem-action-btn"
                        aria-label="查看详情"
                        title="查看详情"
                        onClick={(e) => {
                          e.stopPropagation()
                          openCompetitionDetail(c)
                        }}
                      >
                        👁
                      </button>
                      <button
                        type="button"
                        className="problem-action-btn problem-action-danger"
                        aria-label="删除比赛"
                        title="删除比赛"
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        disabled={c.status === 2}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            </div>
            <div className="competition-pagination">
              <button
                type="button"
                className="problem-add-button"
                title="创建比赛"
                aria-label="创建比赛"
                onClick={openCreateCompetitionModal}
                disabled={competitionLoading}
              >
                ＋
              </button>
              <div className="problem-page-size-group">
              <span className="problem-page-size-label">每页</span>
              <div className="problem-page-size-select-wrapper">
                <button
                  type="button"
                  className={
                    'problem-sort-select problem-page-size-select' +
                    (competitionPageSizeDropdownOpen
                      ? ' problem-sort-select-open'
                      : '')
                  }
                  onClick={(e) =>
                    handleChangePageSizeDropdownOpen(
                      !competitionPageSizeDropdownOpen,
                      e,
                    )
                  }
                  disabled={competitionLoading}
                >
                  {competitionPageSizeLabel}
                </button>
                {competitionPageSizeDropdownOpen && (
                  <div
                    className={
                      'problem-sort-menu' +
                      (competitionPageSizeDropUp
                        ? ' problem-sort-menu-up'
                        : '')
                    }
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (competitionPageSize === size
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          setCompetitionPageSize(size)
                          setCompetitionPage(1)
                          setCompetitionPageSizeDropdownOpen(false)
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="problem-page-size-label">条</span>
              </div>
              <button
              type="button"
              onClick={() =>
                setCompetitionPage((page) => Math.max(1, page - 1))
              }
              disabled={competitionPage <= 1 || competitionLoading}
            >
              上一页
            </button>
            <span className="competition-page-info">
              第 {competitionPage} / {competitionMaxPage} 页
            </span>
              <button
              type="button"
              onClick={() =>
                setCompetitionPage((page) => page + 1)
              }
              disabled={
                competitionPage >= competitionMaxPage ||
                competitionLoading
              }
            >
              下一页
            </button>
            </div>
          </>
        )}
      </div>
      {createCompetitionModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ width: '480px', maxWidth: 'calc(100% - 40px)' }}>
            <div className="admin-modal-title">创建比赛</div>
            <div className="admin-modal-message">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 13 }}>比赛名称</div>
                  <input
                    type="text"
                    className="problem-detail-input"
                    value={createCompetitionName}
                    maxLength={100}
                    onChange={(e) => setCreateCompetitionName(e.target.value)}
                    placeholder="请输入比赛名称"
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 13 }}>时区</div>
                  <select
                    className="problem-detail-select problem-detail-input-inline"
                    value={createCompetitionTimezoneOffset}
                    onChange={(e) => {
                      const nextOffset = Number(e.target.value)
                      if (Number.isNaN(nextOffset)) return
                      const prevOffset = createCompetitionTimezoneOffset
                      const startValue = createCompetitionStartLocal.trim()
                      const endValue = createCompetitionEndLocal.trim()
                      if (startValue) {
                        const iso = toRfc3339FromLocal(startValue, prevOffset)
                        if (iso) {
                          setCreateCompetitionStartLocal(
                            toDateTimeLocalValue(iso, nextOffset),
                          )
                        }
                      }
                      if (endValue) {
                        const iso = toRfc3339FromLocal(endValue, prevOffset)
                        if (iso) {
                          setCreateCompetitionEndLocal(
                            toDateTimeLocalValue(iso, nextOffset),
                          )
                        }
                      }
                      setCreateCompetitionTimezoneOffset(nextOffset)
                    }}
                  >
                    {COMPETITION_TIMEZONE_OPTIONS.map((item) => (
                      <option key={item.offset} value={item.offset}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 13 }}>开始时间</div>
                  <input
                    type="datetime-local"
                    className="problem-detail-input problem-detail-input-inline"
                    style={{ minWidth: '220px' }}
                    value={createCompetitionStartLocal}
                    step={1}
                    onChange={(e) =>
                      setCreateCompetitionStartLocal(e.target.value)
                    }
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: 13 }}>结束时间</div>
                  <input
                    type="datetime-local"
                    className="problem-detail-input problem-detail-input-inline"
                    style={{ minWidth: '220px' }}
                    value={createCompetitionEndLocal}
                    step={1}
                    onChange={(e) =>
                      setCreateCompetitionEndLocal(e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="problem-detail-edit-btn"
                onClick={() => {
                  if (createCompetitionSubmitting) return
                  setCreateCompetitionModalOpen(false)
                }}
                disabled={createCompetitionSubmitting}
              >
                取消
              </button>
              <button
                type="button"
                className="problem-detail-confirm-btn"
                onClick={handleSubmitCreateCompetition}
                disabled={
                  createCompetitionSubmitting || !createCompetitionHasChanges()
                }
              >
                {createCompetitionSubmitting ? '创建中…' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
      {competitionAlertOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-title">
              {competitionAlertTitle || '提示'}
            </div>
            <div className="admin-modal-message">{competitionAlertMessage}</div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-primary-btn"
                onClick={() => setCompetitionAlertOpen(false)}
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
