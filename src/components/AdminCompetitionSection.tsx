import {
  useEffect,
  useRef,
  useState,
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
import AdminCompetitionList from './AdminCompetitionList'
import AdminCompetitionDetail from './AdminCompetitionDetail'
import AdminCompetitionAlertModal from './AdminCompetitionAlertModal'
import {
  toDateTimeLocalValue,
  toRfc3339FromLocal,
} from '../utils/competitionTime'

type CompetitionStatusFilter = 'all' | '0' | '1' | '2'
type CompetitionPhaseFilter = 'all' | '0' | '1' | '2'

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

  function handleChangeCompetitionDetailTimezoneOffset(nextOffset: number) {
    const prevOffset = competitionDetailTimezoneOffset
    const startValue = competitionDetailStartTimeDraft.trim()
    const endValue = competitionDetailEndTimeDraft.trim()
    if (startValue) {
      const iso = toRfc3339FromLocal(startValue, prevOffset)
      if (iso) {
        setCompetitionDetailStartTimeDraft(toDateTimeLocalValue(iso, nextOffset))
      }
    }
    if (endValue) {
      const iso = toRfc3339FromLocal(endValue, prevOffset)
      if (iso) {
        setCompetitionDetailEndTimeDraft(toDateTimeLocalValue(iso, nextOffset))
      }
    }
    setCompetitionDetailTimezoneOffset(nextOffset)
  }

  function handleSelectCompetitionDetailStatusDraft(status: number) {
    setCompetitionDetailStatusDraft(status)
    setCompetitionDetailStatusDropdownOpen(false)
  }

  function startCompetitionDetailEdit() {
    if (!activeCompetition) return
    setCompetitionDetailNameDraft(activeCompetition.name)
    setCompetitionDetailStatusDraft(activeCompetition.status)
    setCompetitionDetailStartTimeDraft(
      toDateTimeLocalValue(activeCompetition.start_time, competitionDetailTimezoneOffset),
    )
    setCompetitionDetailEndTimeDraft(
      toDateTimeLocalValue(activeCompetition.end_time, competitionDetailTimezoneOffset),
    )
    setCompetitionDetailEditing(true)
    setCompetitionDetailStatusDropdownOpen(false)
  }

  function cancelCompetitionDetailEdit() {
    if (!activeCompetition) return
    setCompetitionDetailNameDraft(activeCompetition.name)
    setCompetitionDetailStatusDraft(activeCompetition.status)
    setCompetitionDetailStartTimeDraft(
      toDateTimeLocalValue(activeCompetition.start_time, competitionDetailTimezoneOffset),
    )
    setCompetitionDetailEndTimeDraft(
      toDateTimeLocalValue(activeCompetition.end_time, competitionDetailTimezoneOffset),
    )
    setCompetitionDetailEditing(false)
    setCompetitionDetailStatusDropdownOpen(false)
  }

  function handleChangeCreateCompetitionTimezoneOffset(nextOffset: number) {
    const prevOffset = createCompetitionTimezoneOffset
    const startValue = createCompetitionStartLocal.trim()
    const endValue = createCompetitionEndLocal.trim()
    if (startValue) {
      const iso = toRfc3339FromLocal(startValue, prevOffset)
      if (iso) {
        setCreateCompetitionStartLocal(toDateTimeLocalValue(iso, nextOffset))
      }
    }
    if (endValue) {
      const iso = toRfc3339FromLocal(endValue, prevOffset)
      if (iso) {
        setCreateCompetitionEndLocal(toDateTimeLocalValue(iso, nextOffset))
      }
    }
    setCreateCompetitionTimezoneOffset(nextOffset)
  }

  function toggleImportProblemSelected(problemId: number) {
    setSelectedImportProblemIds((prev) =>
      prev.includes(problemId)
        ? prev.filter((id) => id !== problemId)
        : [...prev, problemId],
    )
  }

  return (
    <>
      {activeCompetitionId !== null ? (
        <AdminCompetitionDetail
          activeCompetitionId={activeCompetitionId}
          activeCompetition={activeCompetition}
          competitionDetailLoading={competitionDetailLoading}
          competitionDetailError={competitionDetailError}
          competitionDetailEditing={competitionDetailEditing}
          competitionDetailNameDraft={competitionDetailNameDraft}
          competitionDetailStatusDraft={competitionDetailStatusDraft}
          competitionDetailStartTimeDraft={competitionDetailStartTimeDraft}
          competitionDetailEndTimeDraft={competitionDetailEndTimeDraft}
          competitionDetailStatusDropdownOpen={competitionDetailStatusDropdownOpen}
          competitionDetailSubmitting={competitionDetailSubmitting}
          competitionDetailTimezoneOffset={competitionDetailTimezoneOffset}
          competitionDetailHasChanges={competitionDetailHasChanges}
          onBackToList={closeCompetitionDetail}
          onStartEdit={startCompetitionDetailEdit}
          onCancelEdit={cancelCompetitionDetailEdit}
          onConfirmEdit={handleConfirmCompetitionDetailChanges}
          onChangeNameDraft={setCompetitionDetailNameDraft}
          onToggleStatusDropdown={() =>
            setCompetitionDetailStatusDropdownOpen((open) => !open)
          }
          onChangeStatusDraft={handleSelectCompetitionDetailStatusDraft}
          onChangeTimezoneOffset={handleChangeCompetitionDetailTimezoneOffset}
          onChangeStartTimeDraft={setCompetitionDetailStartTimeDraft}
          onChangeEndTimeDraft={setCompetitionDetailEndTimeDraft}
          competitionProblems={competitionProblems}
          competitionProblemsLoading={competitionProblemsLoading}
          competitionProblemsError={competitionProblemsError}
          competitionProblemsUpdating={competitionProblemsUpdating}
          competitionProblemsDeleting={competitionProblemsDeleting}
          competitionProblemDeletingId={competitionProblemDeletingId}
          competitionProblemDeleteConfirm={competitionProblemDeleteConfirm}
          onUpdateCompetitionProblemStatus={(problemId, targetStatus) => {
            void handleUpdateCompetitionProblemStatus(
              activeCompetitionId,
              problemId,
              targetStatus,
            )
          }}
          onDeleteCompetitionProblem={handleDeleteCompetitionProblem}
          onCancelDeleteCompetitionProblem={() =>
            setCompetitionProblemDeleteConfirm(null)
          }
          onConfirmDeleteCompetitionProblem={handleConfirmDeleteCompetitionProblem}
          importProblemModalOpen={importProblemModalOpen}
          importProblemList={importProblemList}
          selectedImportProblemIds={selectedImportProblemIds}
          importProblemPage={importProblemPage}
          importProblemTotal={importProblemTotal}
          importProblemLoading={importProblemLoading}
          importProblemSubmitting={importProblemSubmitting}
          importProblemError={importProblemError}
          onOpenImportProblemModal={openImportProblemModal}
          onCloseImportProblemModal={() => setImportProblemModalOpen(false)}
          onToggleImportProblemSelected={toggleImportProblemSelected}
          onAddSelectedImportProblems={handleAddSelectedImportProblems}
          onChangeImportProblemPage={setImportProblemPage}
        />
      ) : (
        <AdminCompetitionList
          competitions={competitions}
          competitionLoading={competitionLoading}
          competitionError={competitionError}
          competitionPage={competitionPage}
          competitionMaxPage={competitionMaxPage}
          competitionPageSize={competitionPageSize}
          competitionPageSizeLabel={competitionPageSizeLabel}
          competitionPageSizeDropdownOpen={competitionPageSizeDropdownOpen}
          competitionPageSizeDropUp={competitionPageSizeDropUp}
          competitionOrderField={competitionOrderField}
          competitionOrderDesc={competitionOrderDesc}
          competitionOrderLabel={competitionOrderLabel}
          competitionOrderDropdownOpen={competitionOrderDropdownOpen}
          competitionStatusFilter={competitionStatusFilter}
          competitionStatusFilterLabel={competitionStatusFilterLabel}
          competitionStatusFilterOpen={competitionStatusFilterOpen}
          competitionPhaseFilter={competitionPhaseFilter}
          competitionPhaseFilterLabel={competitionPhaseFilterLabel}
          competitionPhaseFilterOpen={competitionPhaseFilterOpen}
          hasSelectedCompetitions={hasSelectedCompetitions}
          isAllCurrentPageSelected={isAllCurrentPageSelected}
          selectedCompetitionIds={selectedCompetitionIds}
          competitionBatchSubmitting={competitionBatchSubmitting}
          competitionBatchDropdownOpen={competitionBatchDropdownOpen}
          onToggleBatchDropdown={() =>
            setCompetitionBatchDropdownOpen((open) => !open)
          }
          onBatchPublish={async () => {
            setCompetitionBatchDropdownOpen(false)
            await batchUpdateSelectedCompetitions({ status: 1 })
          }}
          onBatchUnpublish={async () => {
            setCompetitionBatchDropdownOpen(false)
            await batchUpdateSelectedCompetitions({ status: 0 })
          }}
          onBatchDelete={async () => {
            setCompetitionBatchDropdownOpen(false)
            await batchUpdateSelectedCompetitions({ status: 2 })
          }}
          onResetFilters={handleResetFilters}
          competitionNameFilterInput={competitionNameFilterInput}
          onChangeNameFilterInput={setCompetitionNameFilterInput}
          onApplyNameSearch={applyCompetitionNameSearch}
          onToggleOrderDropdown={() =>
            setCompetitionOrderDropdownOpen((open) => !open)
          }
          onChangeOrderField={(field) => {
            setCompetitionOrderField(field)
            setCompetitionOrderDropdownOpen(false)
          }}
          onChangeOrderDesc={setCompetitionOrderDesc}
          onToggleStatusFilterOpen={() =>
            setCompetitionStatusFilterOpen((open) => !open)
          }
          onChangeStatusFilter={handleChangeStatusFilter}
          onTogglePhaseFilterOpen={() =>
            setCompetitionPhaseFilterOpen((open) => !open)
          }
          onChangePhaseFilter={handleChangePhaseFilter}
          onToggleSelectAll={(checked) => {
            if (checked) {
              setSelectedCompetitionIds(competitions.map((c) => c.id))
            } else {
              setSelectedCompetitionIds([])
            }
          }}
          onToggleSelectOne={(id, checked) => {
            if (checked) {
              setSelectedCompetitionIds((prev) =>
                prev.includes(id) ? prev : [...prev, id],
              )
            } else {
              setSelectedCompetitionIds((prev) => prev.filter((cid) => cid !== id))
            }
          }}
          onOpenCompetitionDetail={openCompetitionDetail}
          onOpenCreateCompetitionModal={openCreateCompetitionModal}
          onChangePageSizeDropdownOpen={handleChangePageSizeDropdownOpen}
          onChangePageSize={(size) => {
            setCompetitionPageSize(size)
            setCompetitionPage(1)
            setCompetitionPageSizeDropdownOpen(false)
          }}
          onChangePage={setCompetitionPage}
          headerCheckboxRef={competitionHeaderSelectRef}
          createCompetitionModalOpen={createCompetitionModalOpen}
          createCompetitionName={createCompetitionName}
          createCompetitionTimezoneOffset={createCompetitionTimezoneOffset}
          createCompetitionStartLocal={createCompetitionStartLocal}
          createCompetitionEndLocal={createCompetitionEndLocal}
          createCompetitionSubmitting={createCompetitionSubmitting}
          createCompetitionHasChanges={createCompetitionHasChanges()}
          onCloseCreateCompetitionModal={() => {
            if (createCompetitionSubmitting) return
            setCreateCompetitionModalOpen(false)
          }}
          onSubmitCreateCompetition={handleSubmitCreateCompetition}
          onChangeCreateCompetitionName={setCreateCompetitionName}
          onChangeCreateCompetitionTimezoneOffset={
            handleChangeCreateCompetitionTimezoneOffset
          }
          onChangeCreateCompetitionStartLocal={setCreateCompetitionStartLocal}
          onChangeCreateCompetitionEndLocal={setCreateCompetitionEndLocal}
        />
      )}
      <AdminCompetitionAlertModal
        open={competitionAlertOpen}
        title={competitionAlertTitle}
        message={competitionAlertMessage}
        onClose={() => setCompetitionAlertOpen(false)}
      />
    </>
  )
}
