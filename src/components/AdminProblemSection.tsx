import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from 'react'
import {
  createProblem,
  fetchProblemDetail,
  fetchProblemList,
  type ProblemDetail,
  type ProblemItem,
  type ProblemOrderBy,
  updateProblem,
  uploadProblemTestcase,
} from '../api/problem'
import AdminProblemDetail from './AdminProblemDetail'
import AdminProblemCreate from './AdminProblemCreate'
import AdminProblemList from './AdminProblemList'

type ProblemStatusFilter = 'all' | '0' | '1' | '2'
type ProblemVisibleFilter = 'all' | '0' | '1'

function renderProblemDescriptionInline(text: string): ReactNode[] {
  const elements: ReactNode[] = []
  let remaining = text
  const pattern =
    /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/u
  while (remaining.length > 0) {
    const match = remaining.match(pattern)
    if (!match || match.index === undefined) {
      if (remaining) {
        elements.push(remaining)
      }
      break
    }
    const index = match.index
    if (index > 0) {
      elements.push(remaining.slice(0, index))
    }
    const token = match[0]
    const key = `inline-${elements.length}`
    if (token.startsWith('**') && token.endsWith('**')) {
      elements.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*') && token.endsWith('*')) {
      elements.push(<em key={key}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      elements.push(
        <code key={key} className="problem-detail-inline-code">
          {token.slice(1, -1)}
        </code>,
      )
    } else if (
      token.startsWith('[') &&
      token.includes('](') &&
      token.endsWith(')')
    ) {
      const textPart = token.slice(1, token.indexOf(']('))
      const urlPart = token.slice(
        token.indexOf('](') + 2,
        token.length - 1,
      )
      elements.push(
        <a
          key={key}
          href={urlPart}
          target="_blank"
          rel="noreferrer"
          className="problem-detail-link"
        >
          {textPart}
        </a>,
      )
    } else {
      elements.push(token)
    }
    remaining = remaining.slice(index + token.length)
  }
  return elements
}

function renderProblemDescription(text: string) {
  const nodes: ReactNode[] = []
  const lines = text.split(/\r?\n/u)
  let i = 0
  let key = 0
  let paragraphLines: string[] = []

  function flushParagraph() {
    if (paragraphLines.length === 0) return
    const paraKey = `p-${key}`
    key += 1
    const content: ReactNode[] = []
    paragraphLines.forEach((line, idx) => {
      if (idx > 0) {
        content.push(<br key={`${paraKey}-br-${idx}`} />)
      }
      content.push(...renderProblemDescriptionInline(line))
    })
    nodes.push(
      <p className="problem-detail-paragraph" key={paraKey}>
        {content}
      </p>,
    )
    paragraphLines = []
  }

  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()

    if (trimmed === '') {
      flushParagraph()
      i += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      flushParagraph()
      const startLine = trimmed
      const hasLang = startLine.length > 3
      const fence = hasLang ? startLine.slice(3).trim() : ''
      i += 1
      const codeLines: string[] = []
      while (i < lines.length) {
        const current = lines[i]
        if (current.trim().startsWith('```')) {
          i += 1
          break
        }
        codeLines.push(current)
        i += 1
      }
      const content = codeLines.join('\n')
      nodes.push(
        <pre className="problem-detail-code" key={`code-${key}-${fence}`}>
          <code>{content}</code>
        </pre>,
      )
      key += 1
      continue
    }

    if (/^#{1,3}\s+/u.test(trimmed)) {
      flushParagraph()
      const level = trimmed.startsWith('###')
        ? 3
        : trimmed.startsWith('##')
          ? 2
          : 1
      const textContent = trimmed.replace(/^#{1,3}\s+/u, '')
      const headingKey = `h-${key}`
      const children = renderProblemDescriptionInline(textContent)
      if (level === 1) {
        nodes.push(
          <h1 className="problem-detail-heading" key={headingKey}>
            {children}
          </h1>,
        )
      } else if (level === 2) {
        nodes.push(
          <h2 className="problem-detail-heading" key={headingKey}>
            {children}
          </h2>,
        )
      } else {
        nodes.push(
          <h3 className="problem-detail-heading" key={headingKey}>
            {children}
          </h3>,
        )
      }
      key += 1
      i += 1
      continue
    }

    if (/^\|.*\|$/u.test(trimmed)) {
      let dividerIndex = -1
      let j = i + 1
      while (j < lines.length) {
        const t = lines[j].trim()
        if (t === '') {
          j += 1
          continue
        }
        if (/^\|?[:\-|\s]+\|?$/u.test(t)) {
          dividerIndex = j
        }
        break
      }
      if (dividerIndex !== -1) {
        flushParagraph()
        const headerLine = trimmed

        const headerCells = headerLine
          .replace(/^\|/u, '')
          .replace(/\|$/u, '')
          .split('|')
          .map((cell) => cell.trim())

        const bodyLines: string[] = []
        j = dividerIndex + 1
        while (j < lines.length) {
          const t = lines[j].trim()
          if (t === '') {
            j += 1
            continue
          }
          if (!/^\|.*\|$/u.test(t)) break
          bodyLines.push(t)
          j += 1
        }

        const rows = bodyLines.map((line) =>
          line
            .replace(/^\|/u, '')
            .replace(/\|$/u, '')
            .split('|')
            .map((cell) => cell.trim()),
        )

        nodes.push(
          <table className="problem-detail-table" key={`table-${key}`}>
            <thead>
              <tr>
                {headerCells.map((cell, idx) => (
                  <th key={`th-${key}-${idx}`}>
                    {renderProblemDescriptionInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((cols, rowIdx) => (
                <tr key={`tr-${key}-${rowIdx}`}>
                  {cols.map((cell, colIdx) => (
                    <td key={`td-${key}-${rowIdx}-${colIdx}`}>
                      {renderProblemDescriptionInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>,
        )
        key += 1
        i = j
        continue
      }
    }

    if (/^-+\s+.+/u.test(trimmed)) {
      flushParagraph()
      const items: string[] = []
      while (i < lines.length) {
        const t = lines[i].trim()
        if (!/^-+\s+.+/u.test(t)) break
        items.push(t.replace(/^-+\s+/u, ''))
        i += 1
      }
      nodes.push(
        <ul className="problem-detail-list" key={`ul-${key}`}>
          {items.map((item, idx) => (
            <li key={`li-${key}-${idx}`}>
              {renderProblemDescriptionInline(item)}
            </li>
          ))}
        </ul>,
      )
      key += 1
      continue
    }

    paragraphLines.push(raw)
    i += 1
  }

  flushParagraph()

  if (nodes.length === 0) {
    nodes.push(
      <p className="problem-detail-paragraph" key="empty">
        暂无题目描述
      </p>,
    )
  }

  return nodes
}

export default function AdminProblemSection() {
  const [problems, setProblems] = useState<ProblemItem[]>([])
  const [problemLoading, setProblemLoading] = useState(false)
  const [problemError] = useState('')
  const [problemPage, setProblemPage] = useState(1)
  const [problemTotal, setProblemTotal] = useState(0)
  const [problemPageSize, setProblemPageSize] = useState(10)
  const [problemOrderField, setProblemOrderField] =
    useState<ProblemOrderBy>('id')
  const [problemOrderDesc, setProblemOrderDesc] = useState(false)
  const [problemOrderDropdownOpen, setProblemOrderDropdownOpen] =
    useState(false)
  const [problemStatusFilter, setProblemStatusFilter] =
    useState<ProblemStatusFilter>('all')
  const [problemVisibleFilter, setProblemVisibleFilter] =
    useState<ProblemVisibleFilter>('all')
  const [problemStatusFilterOpen, setProblemStatusFilterOpen] =
    useState(false)
  const [problemVisibleFilterOpen, setProblemVisibleFilterOpen] =
    useState(false)
  const [problemPageSizeDropdownOpen, setProblemPageSizeDropdownOpen] =
    useState(false)
  const [problemPageSizeDropUp, setProblemPageSizeDropUp] =
    useState(false)
  const [selectedProblemIds, setSelectedProblemIds] = useState<number[]>([])
  const [problemBatchSubmitting, setProblemBatchSubmitting] =
    useState(false)
  const [problemBatchDropdownOpen, setProblemBatchDropdownOpen] =
    useState(false)
  const [problemTitleFilter, setProblemTitleFilter] = useState('')
  const [problemTitleFilterInput, setProblemTitleFilterInput] =
    useState('')
  const [problemRefreshToken, setProblemRefreshToken] = useState(0)
  const problemHeaderSelectRef = useRef<HTMLInputElement | null>(null)
  const problemRefreshLastTimeRef = useRef<number>(0)
  const [problemDetailId, setProblemDetailId] = useState<number | null>(
    null,
  )
  const [problemDetail, setProblemDetail] =
    useState<ProblemDetail | null>(null)
  const [problemDetailTitleDraft, setProblemDetailTitleDraft] =
    useState('')
  const [problemDetailStatusDraft, setProblemDetailStatusDraft] =
    useState<number | null>(null)
  const [problemDetailVisibleDraft, setProblemDetailVisibleDraft] =
    useState<number | null>(null)
  const [problemDetailTimeLimitDraft, setProblemDetailTimeLimitDraft] =
    useState<number | ''>('')
  const [problemDetailMemoryLimitDraft, setProblemDetailMemoryLimitDraft] =
    useState<number | ''>('')
  const [problemDetailDescriptionDraft, setProblemDetailDescriptionDraft] =
    useState('')
  const [problemDetailLoading, setProblemDetailLoading] =
    useState(false)
  const [problemDetailEditing, setProblemDetailEditing] =
    useState(false)
  const [problemDetailStatusDropdownOpen, setProblemDetailStatusDropdownOpen] =
    useState(false)
  const [
    problemDetailVisibleDropdownOpen,
    setProblemDetailVisibleDropdownOpen,
  ] = useState(false)
  const problemDetailStatusCloseTimerRef = useRef<number | null>(null)
  const problemDetailVisibleCloseTimerRef = useRef<number | null>(null)
  const [problemDetailAlertOpen, setProblemDetailAlertOpen] = useState(false)
  const [problemDetailAlertTitle, setProblemDetailAlertTitle] = useState('')
  const [problemDetailAlertMessage, setProblemDetailAlertMessage] =
    useState('')
  const [problemTestcaseFile, setProblemTestcaseFile] =
    useState<File | null>(null)
  const [problemTestcaseUploading, setProblemTestcaseUploading] =
    useState(false)
  const problemTestcaseInputRef = useRef<HTMLInputElement | null>(null)
  const [problemUploadModalOpen, setProblemUploadModalOpen] =
    useState(false)
  const [problemDeleteConfirm, setProblemDeleteConfirm] =
    useState<ProblemItem | null>(null)
  const [isCreatingProblem, setIsCreatingProblem] = useState(false)
  const [problemCreateSubmitting, setProblemCreateSubmitting] =
    useState(false)

  useEffect(() => {
    void loadProblems(
      problemPage,
      problemPageSize,
      problemOrderField,
      problemOrderDesc,
      problemStatusFilter,
      problemVisibleFilter,
      problemTitleFilter,
    )
  }, [
    problemPage,
    problemOrderField,
    problemOrderDesc,
    problemStatusFilter,
    problemVisibleFilter,
    problemPageSize,
    problemTitleFilter,
    problemRefreshToken,
  ])

  async function loadProblems(
    targetPage: number,
    pageSize: number,
    orderBy: ProblemOrderBy,
    desc: boolean,
    statusFilter: ProblemStatusFilter,
    visibleFilter: ProblemVisibleFilter,
    titleFilter: string,
  ) {
    setProblemLoading(true)
    try {
      const statusValue =
        statusFilter === 'all' ? undefined : Number(statusFilter)
      const visibleValue =
        visibleFilter === 'all' ? undefined : Number(visibleFilter)
      const titleValue =
        titleFilter && titleFilter.trim().length > 0
          ? titleFilter.trim()
          : undefined
      const res = await fetchProblemList(
        targetPage,
        pageSize,
        orderBy,
        desc,
        statusValue,
        visibleValue,
        titleValue,
      )
      if (!res.ok || !res.data || !res.data.data) {
        setProblems([])
        setProblemTotal(0)
        setSelectedProblemIds([])
        return
      }
      const data = res.data.data
      setProblems(data.list)
      setProblemTotal(data.total)
      setSelectedProblemIds((prev) =>
        prev.filter((id) => data.list.some((item) => item.id === id)),
      )
    } catch {
      setProblems([])
      setProblemTotal(0)
      setSelectedProblemIds([])
    } finally {
      setProblemLoading(false)
    }
  }

  const problemMaxPage =
    problemTotal > 0 ? Math.ceil(problemTotal / problemPageSize) : 1

  const problemOrderLabel =
    problemOrderField === 'id'
      ? '按 ID'
      : problemOrderField === 'created_at'
        ? '按创建时间'
        : '按更新时间'

  const problemStatusFilterLabel =
    problemStatusFilter === 'all'
      ? '全部状态'
      : problemStatusFilter === '0'
        ? '仅未发布'
        : problemStatusFilter === '1'
          ? '仅已发布'
          : '仅已删除'

  const problemVisibleFilterLabel =
    problemVisibleFilter === 'all'
      ? '全部可见性'
      : problemVisibleFilter === '1'
        ? '仅可见'
        : '仅不可见'

  const problemPageSizeLabel = `${problemPageSize}`

  const hasSelectedProblems = selectedProblemIds.length > 0
  const isAllCurrentPageSelected =
    problems.length > 0 &&
    problems.every((p) => selectedProblemIds.includes(p.id))
  const isHeaderIndeterminate =
    hasSelectedProblems && !isAllCurrentPageSelected

  useEffect(() => {
    if (!problemHeaderSelectRef.current) return
    problemHeaderSelectRef.current.indeterminate = isHeaderIndeterminate
  }, [isHeaderIndeterminate])

  function applyProblemTitleSearch() {
    setProblemTitleFilter(problemTitleFilterInput.trim())
    setProblemPage(1)
  }

  function resetProblemFilters() {
    if (problemLoading) return
    const now = Date.now()
    if (now - problemRefreshLastTimeRef.current < 3000) {
      setProblemDetailAlertTitle('提示')
      setProblemDetailAlertMessage('操作过于频繁，请稍后再试')
      setProblemDetailAlertOpen(true)
      return
    }
    problemRefreshLastTimeRef.current = now
    setProblemPage(1)
    setProblemOrderField('id')
    setProblemOrderDesc(false)
    setProblemStatusFilter('all')
    setProblemVisibleFilter('all')
    setProblemTitleFilter('')
    setProblemTitleFilterInput('')
    setSelectedProblemIds([])
    setProblemOrderDropdownOpen(false)
    setProblemStatusFilterOpen(false)
    setProblemVisibleFilterOpen(false)
    setProblemPageSizeDropdownOpen(false)
    setProblemBatchDropdownOpen(false)
    setProblemRefreshToken((v) => v + 1)
  }

  async function batchUpdateSelectedProblems(
    patch: { status?: number; visible?: number },
  ) {
    if (!hasSelectedProblems) return
    setProblemBatchSubmitting(true)
    try {
      const results = await Promise.all(
        selectedProblemIds.map((id) =>
          updateProblem({
            problem_id: id,
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
        setProblemDetailAlertTitle('操作失败')
        setProblemDetailAlertMessage('部分题目更新失败，请稍后重试')
        setProblemDetailAlertOpen(true)
      }
      await loadProblems(
        problemPage,
        problemPageSize,
        problemOrderField,
        problemOrderDesc,
        problemStatusFilter,
        problemVisibleFilter,
        problemTitleFilter,
      )
      setSelectedProblemIds([])
    } catch {
      setProblemDetailAlertTitle('操作失败')
      setProblemDetailAlertMessage('批量操作失败，请稍后重试')
      setProblemDetailAlertOpen(true)
    } finally {
      setProblemBatchSubmitting(false)
    }
  }

  async function handleDeleteProblem(problem: ProblemItem) {
    if (problem.status === 2) return
    setProblemDeleteConfirm(problem)
  }

  async function handleConfirmDeleteProblem() {
    if (!problemDeleteConfirm) return
    const target = problemDeleteConfirm
    try {
      const res = await updateProblem({
        problem_id: target.id,
        status: 2,
      })
      if (!res.ok || !res.data || res.data.code !== 200) {
        const msg = res.data?.message ?? '删除题目失败'
        setProblemDetailAlertTitle('操作失败')
        setProblemDetailAlertMessage(msg)
        setProblemDetailAlertOpen(true)
        return
      }
      await loadProblems(
        problemPage,
        problemPageSize,
        problemOrderField,
        problemOrderDesc,
        problemStatusFilter,
        problemVisibleFilter,
        problemTitleFilter,
      )
      setSelectedProblemIds((prev) =>
        prev.filter((id) => id !== target.id),
      )
    } catch {
      setProblemDetailAlertTitle('操作失败')
      setProblemDetailAlertMessage('删除题目失败，请稍后重试')
      setProblemDetailAlertOpen(true)
    } finally {
      setProblemDeleteConfirm(null)
    }
  }

  async function openProblemDetail(problem: ProblemItem) {
    setProblemDetailId(problem.id)
    setProblemDetailEditing(false)
    setProblemDetailStatusDropdownOpen(false)
    setProblemDetailVisibleDropdownOpen(false)
    setProblemDetail(null)
    setProblemDetailTitleDraft('')
    setProblemDetailStatusDraft(null)
    setProblemDetailVisibleDraft(null)
    setProblemDetailTimeLimitDraft('')
    setProblemDetailMemoryLimitDraft('')
    setProblemDetailDescriptionDraft('')
    setProblemDetailLoading(true)
    try {
      const res = await fetchProblemDetail(problem.id)
      if (!res.ok || !res.data) {
        const msg = res.data?.message ?? '获取题目详情失败'
        setProblemDetailAlertTitle('操作失败')
        setProblemDetailAlertMessage(msg)
        setProblemDetailAlertOpen(true)
        return
      }
      if (typeof res.data.code !== 'number' || res.data.code !== 200) {
        const msg = res.data.message || '获取题目详情失败'
        setProblemDetailAlertTitle('操作失败')
        setProblemDetailAlertMessage(msg)
        setProblemDetailAlertOpen(true)
        return
      }
      const detail = res.data.data
      if (!detail) {
        const msg = '获取题目详情失败'
        setProblemDetailAlertTitle('操作失败')
        setProblemDetailAlertMessage(msg)
        setProblemDetailAlertOpen(true)
        return
      }
      const normalized: ProblemDetail = {
        id: detail.id,
        title: detail.title ?? '',
        description: detail.description ?? '',
        status: detail.status ?? 0,
        time_limit: detail.time_limit ?? 0,
        memory_limit: detail.memory_limit ?? 0,
        visible: detail.visible ?? 0,
        creator_id: detail.creator_id ?? 0,
        creator_realname: detail.creator_realname ?? '',
        updater_id: detail.updater_id ?? 0,
        updater_realname: detail.updater_realname ?? '',
        created_at: detail.created_at ?? '',
        updated_at: detail.updated_at ?? '',
      }
      setProblemDetail(normalized)
      setProblemDetailTitleDraft(normalized.title ?? '')
      setProblemDetailStatusDraft(normalized.status)
      setProblemDetailVisibleDraft(normalized.visible)
      setProblemDetailTimeLimitDraft(normalized.time_limit)
      setProblemDetailMemoryLimitDraft(normalized.memory_limit)
      setProblemDetailDescriptionDraft(normalized.description ?? '')
    } catch {
      const msg = '获取题目详情失败'
      setProblemDetailAlertTitle('操作失败')
      setProblemDetailAlertMessage(msg)
      setProblemDetailAlertOpen(true)
    } finally {
      setProblemDetailLoading(false)
    }
  }

  function closeProblemDetail() {
    setProblemDetailId(null)
    setProblemDetail(null)
    setProblemDetailEditing(false)
    setProblemDetailStatusDropdownOpen(false)
    setProblemDetailVisibleDropdownOpen(false)
    void loadProblems(
      problemPage,
      problemPageSize,
      problemOrderField,
      problemOrderDesc,
      problemStatusFilter,
      problemVisibleFilter,
      problemTitleFilter,
    )
  }

  const problemDetailHasChanges =
    problemDetailEditing &&
    problemDetail !== null &&
    (problemDetailTitleDraft !== (problemDetail.title ?? '') ||
      (problemDetailStatusDraft !== null &&
        problemDetailStatusDraft !== problemDetail.status) ||
      (problemDetailVisibleDraft !== null &&
        problemDetailVisibleDraft !== problemDetail.visible) ||
      (problemDetailTimeLimitDraft !== '' &&
        problemDetailTimeLimitDraft !== problemDetail.time_limit) ||
      (problemDetailMemoryLimitDraft !== '' &&
        problemDetailMemoryLimitDraft !== problemDetail.memory_limit) ||
      problemDetailDescriptionDraft !==
      (problemDetail.description ?? ''))

  function clearProblemDetailStatusCloseTimer() {
    if (problemDetailStatusCloseTimerRef.current !== null) {
      window.clearTimeout(problemDetailStatusCloseTimerRef.current)
      problemDetailStatusCloseTimerRef.current = null
    }
  }

  function clearProblemDetailVisibleCloseTimer() {
    if (problemDetailVisibleCloseTimerRef.current !== null) {
      window.clearTimeout(problemDetailVisibleCloseTimerRef.current)
      problemDetailVisibleCloseTimerRef.current = null
    }
  }

  function clampProblemDetailTimeLimit() {
    if (problemDetailTimeLimitDraft === '') return
    let v = problemDetailTimeLimitDraft
    if (v < 50) v = 50
    if (v > 30000) v = 30000
    setProblemDetailTimeLimitDraft(v)
  }

  function clampProblemDetailMemoryLimit() {
    if (problemDetailMemoryLimitDraft === '') return
    let v = problemDetailMemoryLimitDraft
    if (v < 128) v = 128
    if (v > 1024) v = 1024
    setProblemDetailMemoryLimitDraft(v)
  }

  function startCreateProblem() {
    setProblemDetailId(null)
    setProblemDetail(null)
    setProblemDetailEditing(false)
    setProblemDetailStatusDropdownOpen(false)
    setProblemDetailVisibleDropdownOpen(false)
    setProblemDetailTitleDraft('')
    setProblemDetailStatusDraft(null)
    setProblemDetailVisibleDraft(1)
    setProblemDetailTimeLimitDraft(1000)
    setProblemDetailMemoryLimitDraft(256)
    setProblemDetailDescriptionDraft('')
    setProblemTestcaseFile(null)
    if (problemTestcaseInputRef.current) {
      problemTestcaseInputRef.current.value = ''
    }
    setIsCreatingProblem(true)
  }

  function cancelCreateProblem() {
    if (problemCreateSubmitting) return
    setIsCreatingProblem(false)
    setProblemDetailTitleDraft('')
    setProblemDetailStatusDraft(null)
    setProblemDetailVisibleDraft(null)
    setProblemDetailTimeLimitDraft('')
    setProblemDetailMemoryLimitDraft('')
    setProblemDetailDescriptionDraft('')
    setProblemTestcaseFile(null)
    if (problemTestcaseInputRef.current) {
      problemTestcaseInputRef.current.value = ''
    }
  }

  const canSubmitCreateProblem =
    !problemCreateSubmitting &&
    problemDetailTitleDraft.trim().length > 0 &&
    problemDetailDescriptionDraft.trim().length > 0 &&
    typeof problemDetailTimeLimitDraft === 'number' &&
    typeof problemDetailMemoryLimitDraft === 'number'

  function handleStatusMouseLeave() {
    clearProblemDetailStatusCloseTimer()
    problemDetailStatusCloseTimerRef.current = window.setTimeout(() => {
      setProblemDetailStatusDropdownOpen(false)
    }, 100)
  }

  function handleVisibleMouseLeave() {
    clearProblemDetailVisibleCloseTimer()
    problemDetailVisibleCloseTimerRef.current = window.setTimeout(() => {
      setProblemDetailVisibleDropdownOpen(false)
    }, 100)
  }

  function handleChangeStatusFilter(value: ProblemStatusFilter) {
    setProblemStatusFilter(value)
    setProblemPage(1)
    setProblemStatusFilterOpen(false)
  }

  function handleChangeVisibleFilter(value: ProblemVisibleFilter) {
    setProblemVisibleFilter(value)
    setProblemPage(1)
    setProblemVisibleFilterOpen(false)
  }

  function handleChangePageSizeDropdownOpen(
    open: boolean,
    event?: MouseEvent<HTMLButtonElement>,
  ) {
    if (open && !problemPageSizeDropdownOpen && event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const estimatedMenuHeight = 180
      setProblemPageSizeDropUp(spaceBelow < estimatedMenuHeight)
    }
    setProblemPageSizeDropdownOpen(open)
  }

  async function handleConfirmProblemDetailChanges() {
    if (!problemDetail || !problemDetailHasChanges) return

    const body: {
      problem_id: number
      title?: string
      description?: string
      status?: number
      time_limit?: number
      memory_limit?: number
      visible?: number
    } = {
      problem_id: problemDetail.id,
    }

    if (problemDetailTitleDraft !== (problemDetail.title ?? '')) {
      body.title = problemDetailTitleDraft
    }

    if (
      problemDetailDescriptionDraft !==
      (problemDetail.description ?? '')
    ) {
      body.description = problemDetailDescriptionDraft
    }

    if (
      problemDetailStatusDraft !== null &&
      problemDetailStatusDraft !== problemDetail.status
    ) {
      body.status = problemDetailStatusDraft
    }

    if (
      problemDetailVisibleDraft !== null &&
      problemDetailVisibleDraft !== problemDetail.visible
    ) {
      body.visible = problemDetailVisibleDraft
    }

    if (
      problemDetailTimeLimitDraft !== '' &&
      problemDetailTimeLimitDraft !== problemDetail.time_limit
    ) {
      body.time_limit = problemDetailTimeLimitDraft
    }

    if (
      problemDetailMemoryLimitDraft !== '' &&
      problemDetailMemoryLimitDraft !== problemDetail.memory_limit
    ) {
      body.memory_limit = problemDetailMemoryLimitDraft
    }

    if (
      typeof body.title === 'undefined' &&
      typeof body.description === 'undefined' &&
      typeof body.status === 'undefined' &&
      typeof body.time_limit === 'undefined' &&
      typeof body.memory_limit === 'undefined' &&
      typeof body.visible === 'undefined'
    ) {
      return
    }

    try {
      const res = await updateProblem(body)
      if (!res.ok || !res.data || res.data.code !== 200) {
        const msg = res.data?.message ?? '更新题目失败'
        setProblemDetailAlertTitle('操作失败')
        setProblemDetailAlertMessage(msg)
        setProblemDetailAlertOpen(true)
        return
      }

      setProblemDetailLoading(true)
      try {
        const detailRes = await fetchProblemDetail(problemDetail.id)
        if (!detailRes.ok || !detailRes.data) {
          const msg = '获取题目详情失败'
          setProblemDetailAlertTitle('操作失败')
          setProblemDetailAlertMessage(msg)
          setProblemDetailAlertOpen(true)
          return
        }
        if (
          typeof detailRes.data.code !== 'number' ||
          detailRes.data.code !== 200
        ) {
          const msg = detailRes.data.message || '获取题目详情失败'
          setProblemDetailAlertTitle('操作失败')
          setProblemDetailAlertMessage(msg)
          setProblemDetailAlertOpen(true)
          return
        }
        const detail = detailRes.data.data
        if (!detail) {
          const msg = '获取题目详情失败'
          setProblemDetailAlertTitle('操作失败')
          setProblemDetailAlertMessage(msg)
          setProblemDetailAlertOpen(true)
          return
        }
        const merged: ProblemDetail = {
          id: problemDetail.id,
          title: detail.title ?? problemDetail.title,
          description: detail.description ?? problemDetail.description,
          status: detail.status ?? problemDetail.status,
          time_limit: detail.time_limit ?? problemDetail.time_limit,
          memory_limit: detail.memory_limit ?? problemDetail.memory_limit,
          visible: detail.visible ?? problemDetail.visible,
          creator_id: detail.creator_id ?? problemDetail.creator_id,
          creator_realname:
            detail.creator_realname ?? problemDetail.creator_realname,
          updater_id: detail.updater_id ?? problemDetail.updater_id,
          updater_realname:
            detail.updater_realname ?? problemDetail.updater_realname,
          created_at: detail.created_at ?? problemDetail.created_at,
          updated_at: detail.updated_at ?? problemDetail.updated_at,
        }

        setProblemDetail(merged)
        setProblemDetailTitleDraft(merged.title ?? '')
        setProblemDetailStatusDraft(merged.status)
        setProblemDetailVisibleDraft(merged.visible)
        setProblemDetailTimeLimitDraft(merged.time_limit)
        setProblemDetailMemoryLimitDraft(merged.memory_limit)
        setProblemDetailDescriptionDraft(merged.description ?? '')
        setProblemDetailEditing(false)
        setProblemDetailStatusDropdownOpen(false)
        setProblemDetailVisibleDropdownOpen(false)
      } finally {
        setProblemDetailLoading(false)
      }
    } catch {
      const msg = '网络错误，请稍后重试'
      setProblemDetailAlertTitle('操作失败')
      setProblemDetailAlertMessage(msg)
      setProblemDetailAlertOpen(true)
    }
  }

  async function handleUploadProblemTestcase() {
    if (!problemDetail) return
    if (!problemTestcaseFile) {
      setProblemDetailAlertTitle('提示')
      setProblemDetailAlertMessage('请先选择要上传的 ZIP 测试用例文件')
      setProblemDetailAlertOpen(true)
      return
    }
    setProblemTestcaseUploading(true)
    try {
      const res = await uploadProblemTestcase(
        problemDetail.id,
        problemTestcaseFile,
      )
      if (!res.ok || !res.data || res.data.code !== 200) {
        const msg = res.data?.message ?? '上传测试用例失败'
        setProblemDetailAlertTitle('操作失败')
        setProblemDetailAlertMessage(msg)
        setProblemDetailAlertOpen(true)
        return
      }
      setProblemDetailAlertTitle('操作成功')
      setProblemDetailAlertMessage('测试用例上传成功')
      setProblemDetailAlertOpen(true)
      setProblemTestcaseFile(null)
      if (problemTestcaseInputRef.current) {
        problemTestcaseInputRef.current.value = ''
      }
      setProblemUploadModalOpen(false)
    } catch {
      setProblemDetailAlertTitle('操作失败')
      setProblemDetailAlertMessage('上传测试用例失败，请稍后重试')
      setProblemDetailAlertOpen(true)
    } finally {
      setProblemTestcaseUploading(false)
    }
  }

  async function handleConfirmCreateProblem() {
    if (problemCreateSubmitting) return
    const title = problemDetailTitleDraft.trim()
    const description = problemDetailDescriptionDraft.trim()
    if (!title || !description) {
      setProblemDetailAlertTitle('提示')
      setProblemDetailAlertMessage('请填写题目标题和题目描述')
      setProblemDetailAlertOpen(true)
      return
    }
    if (
      typeof problemDetailTimeLimitDraft !== 'number' ||
      typeof problemDetailMemoryLimitDraft !== 'number'
    ) {
      setProblemDetailAlertTitle('提示')
      setProblemDetailAlertMessage('请填写完整的时间限制和内存限制')
      setProblemDetailAlertOpen(true)
      return
    }
    const timeLimit = problemDetailTimeLimitDraft
    const memoryLimit = problemDetailMemoryLimitDraft
    const visible = problemDetailVisibleDraft ?? 1
    setProblemCreateSubmitting(true)
    try {
      const res = await createProblem({
        title,
        description,
        time_limit: timeLimit,
        memory_limit: memoryLimit,
        visible,
      })
      if (!res.ok || !res.data || res.data.code !== 200) {
        const msg = res.data?.message ?? '创建题目失败'
        setProblemDetailAlertTitle('操作失败')
        setProblemDetailAlertMessage(msg)
        setProblemDetailAlertOpen(true)
        return
      }
      const detail = res.data.data
      if (detail && typeof detail.id === 'number') {
        const normalized: ProblemDetail = {
          id: detail.id,
          title: detail.title ?? title,
          description: detail.description ?? description,
          status: detail.status ?? 0,
          time_limit: detail.time_limit ?? timeLimit,
          memory_limit: detail.memory_limit ?? memoryLimit,
          visible: detail.visible ?? visible,
          creator_id: detail.creator_id ?? 0,
          creator_realname: detail.creator_realname ?? '',
          updater_id: detail.updater_id ?? 0,
          updater_realname: detail.updater_realname ?? '',
          created_at: detail.created_at ?? '',
          updated_at: detail.updated_at ?? '',
        }
        setProblemDetail(normalized)
        setProblemDetailId(normalized.id)
        setProblemDetailTitleDraft(normalized.title ?? '')
        setProblemDetailStatusDraft(normalized.status)
        setProblemDetailVisibleDraft(normalized.visible)
        setProblemDetailTimeLimitDraft(normalized.time_limit)
        setProblemDetailMemoryLimitDraft(normalized.memory_limit)
        setProblemDetailDescriptionDraft(normalized.description ?? '')
        setIsCreatingProblem(false)
        setProblemDetailEditing(false)
      } else {
        setProblemDetailAlertTitle('操作成功')
        setProblemDetailAlertMessage('题目创建成功')
        setProblemDetailAlertOpen(true)
        setIsCreatingProblem(false)
        setProblemDetailEditing(false)
        setProblemDetailId(null)
        setProblemDetail(null)
        await loadProblems(
          problemPage,
          problemPageSize,
          problemOrderField,
          problemOrderDesc,
          problemStatusFilter,
          problemVisibleFilter,
          problemTitleFilter,
        )
      }
    } catch {
      setProblemDetailAlertTitle('操作失败')
      setProblemDetailAlertMessage('创建题目失败，请稍后重试')
      setProblemDetailAlertOpen(true)
    } finally {
      setProblemCreateSubmitting(false)
    }
  }

  return (
    <>
      {problemDetailId !== null ? (
        <AdminProblemDetail
          problemDetail={problemDetail}
          problemDetailLoading={problemDetailLoading}
          problemDetailEditing={problemDetailEditing}
          problemDetailTitleDraft={problemDetailTitleDraft}
          problemDetailStatusDraft={problemDetailStatusDraft}
          problemDetailVisibleDraft={problemDetailVisibleDraft}
          problemDetailTimeLimitDraft={problemDetailTimeLimitDraft}
          problemDetailMemoryLimitDraft={problemDetailMemoryLimitDraft}
          problemDetailDescriptionDraft={problemDetailDescriptionDraft}
          problemDetailHasChanges={problemDetailHasChanges}
          problemDetailStatusDropdownOpen={problemDetailStatusDropdownOpen}
          problemDetailVisibleDropdownOpen={problemDetailVisibleDropdownOpen}
          onBackToList={closeProblemDetail}
          onOpenUploadModal={() => {
            setProblemUploadModalOpen(true)
          }}
          onStartEdit={() => {
            setProblemDetailTitleDraft(problemDetail?.title ?? '')
            setProblemDetailEditing(true)
          }}
          onCancelEdit={() => {
            setProblemDetailEditing(false)
            setProblemDetailStatusDropdownOpen(false)
            setProblemDetailVisibleDropdownOpen(false)
          }}
          onConfirmEdit={handleConfirmProblemDetailChanges}
          onChangeTitleDraft={setProblemDetailTitleDraft}
          onChangeStatusDraft={setProblemDetailStatusDraft}
          onChangeVisibleDraft={setProblemDetailVisibleDraft}
          onChangeTimeLimitDraft={setProblemDetailTimeLimitDraft}
          onChangeMemoryLimitDraft={setProblemDetailMemoryLimitDraft}
          onChangeDescriptionDraft={setProblemDetailDescriptionDraft}
          onToggleStatusDropdown={() =>
            setProblemDetailStatusDropdownOpen((open) => !open)
          }
          onToggleVisibleDropdown={() =>
            setProblemDetailVisibleDropdownOpen((open) => !open)
          }
          onStatusMouseEnter={clearProblemDetailStatusCloseTimer}
          onStatusMouseLeave={handleStatusMouseLeave}
          onVisibleMouseEnter={clearProblemDetailVisibleCloseTimer}
          onVisibleMouseLeave={handleVisibleMouseLeave}
          onClampTimeLimit={clampProblemDetailTimeLimit}
          onClampMemoryLimit={clampProblemDetailMemoryLimit}
          renderDescription={renderProblemDescription}
        />
      ) : isCreatingProblem ? (
        <AdminProblemCreate
          problemDetailTitleDraft={problemDetailTitleDraft}
          problemDetailVisibleDraft={problemDetailVisibleDraft}
          problemDetailTimeLimitDraft={problemDetailTimeLimitDraft}
          problemDetailMemoryLimitDraft={problemDetailMemoryLimitDraft}
          problemDetailDescriptionDraft={problemDetailDescriptionDraft}
          problemDetailVisibleDropdownOpen={problemDetailVisibleDropdownOpen}
          problemCreateSubmitting={problemCreateSubmitting}
          canSubmitCreateProblem={canSubmitCreateProblem}
          onCancelCreate={cancelCreateProblem}
          onChangeTitleDraft={setProblemDetailTitleDraft}
          onToggleVisibleDropdown={() =>
            setProblemDetailVisibleDropdownOpen((open) => !open)
          }
          onChangeVisibleDraft={setProblemDetailVisibleDraft}
          onChangeTimeLimitDraft={setProblemDetailTimeLimitDraft}
          onClampTimeLimit={clampProblemDetailTimeLimit}
          onChangeMemoryLimitDraft={setProblemDetailMemoryLimitDraft}
          onClampMemoryLimit={clampProblemDetailMemoryLimit}
          onChangeDescriptionDraft={setProblemDetailDescriptionDraft}
          onConfirmCreate={handleConfirmCreateProblem}
        />
      ) : (
        <AdminProblemList
          problems={problems}
          problemLoading={problemLoading}
          problemError={problemError}
          problemPage={problemPage}
          problemMaxPage={problemMaxPage}
          problemPageSize={problemPageSize}
          problemPageSizeLabel={problemPageSizeLabel}
          problemPageSizeDropdownOpen={problemPageSizeDropdownOpen}
          problemPageSizeDropUp={problemPageSizeDropUp}
          problemOrderField={problemOrderField}
          problemOrderDesc={problemOrderDesc}
          problemOrderLabel={problemOrderLabel}
          problemOrderDropdownOpen={problemOrderDropdownOpen}
          problemStatusFilter={problemStatusFilter}
          problemStatusFilterLabel={problemStatusFilterLabel}
          problemStatusFilterOpen={problemStatusFilterOpen}
          problemVisibleFilter={problemVisibleFilter}
          problemVisibleFilterLabel={problemVisibleFilterLabel}
          problemVisibleFilterOpen={problemVisibleFilterOpen}
          hasSelectedProblems={hasSelectedProblems}
          isAllCurrentPageSelected={isAllCurrentPageSelected}
          selectedProblemIds={selectedProblemIds}
          onToggleBatchDropdown={() =>
            setProblemBatchDropdownOpen((open) => !open)
          }
          problemBatchDropdownOpen={problemBatchDropdownOpen}
          problemBatchSubmitting={problemBatchSubmitting}
          onBatchPublish={async () => {
            setProblemBatchDropdownOpen(false)
            await batchUpdateSelectedProblems({ status: 1 })
          }}
          onBatchDelete={async () => {
            setProblemBatchDropdownOpen(false)
            await batchUpdateSelectedProblems({ status: 2 })
          }}
          onBatchUnpublish={async () => {
            setProblemBatchDropdownOpen(false)
            await batchUpdateSelectedProblems({ status: 0 })
          }}
          onBatchInvisible={async () => {
            setProblemBatchDropdownOpen(false)
            await batchUpdateSelectedProblems({ visible: 0 })
          }}
          onBatchVisible={async () => {
            setProblemBatchDropdownOpen(false)
            await batchUpdateSelectedProblems({ visible: 1 })
          }}
          problemTitleFilterInput={problemTitleFilterInput}
          onChangeTitleFilterInput={setProblemTitleFilterInput}
          onApplyTitleSearch={applyProblemTitleSearch}
          onResetFilters={resetProblemFilters}
          onToggleOrderDropdown={() =>
            setProblemOrderDropdownOpen((open) => !open)
          }
          onChangeOrderField={(field) => {
            setProblemOrderField(field)
            setProblemOrderDropdownOpen(false)
          }}
          onChangeOrderDesc={setProblemOrderDesc}
          onToggleStatusFilterOpen={() =>
            setProblemStatusFilterOpen((open) => !open)
          }
          onChangeStatusFilter={handleChangeStatusFilter}
          onToggleVisibleFilterOpen={() =>
            setProblemVisibleFilterOpen((open) => !open)
          }
          onChangeVisibleFilter={handleChangeVisibleFilter}
          onToggleSelectAll={(checked) => {
            if (checked) {
              setSelectedProblemIds(problems.map((p) => p.id))
            } else {
              setSelectedProblemIds([])
            }
          }}
          onToggleSelectOne={(id, checked) => {
            if (checked) {
              setSelectedProblemIds((prev) =>
                prev.includes(id) ? prev : [...prev, id],
              )
            } else {
              setSelectedProblemIds((prev) =>
                prev.filter((pid) => pid !== id),
              )
            }
          }}
          onOpenProblemDetail={(problem) => {
            void openProblemDetail(problem)
          }}
          onDeleteProblem={(problem) => {
            void handleDeleteProblem(problem)
          }}
          onStartCreateProblem={startCreateProblem}
          onChangePageSizeDropdownOpen={handleChangePageSizeDropdownOpen}
          onChangePageSize={(size) => {
            setProblemPageSize(size)
            setProblemPage(1)
            setProblemPageSizeDropdownOpen(false)
          }}
          onChangePage={(page) => {
            setProblemPage(page)
          }}
          problemLoadingForControls={problemLoading}
          headerCheckboxRef={problemHeaderSelectRef}
        />
      )}
      {problemUploadModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-title">上传测试用例</div>
            <div className="admin-modal-message">
              <input
                ref={problemTestcaseInputRef}
                type="file"
                className="problem-detail-upload-input"
                accept=".zip"
                onChange={(e) => {
                  const file =
                    e.target.files && e.target.files[0]
                      ? e.target.files[0]
                      : null
                  setProblemTestcaseFile(file)
                }}
                disabled={problemTestcaseUploading}
              />
              <div className="problem-detail-upload-hint">
                仅支持 .zip 文件，内容只能为 0.in / 0.out 等成对文件
              </div>
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="problem-detail-edit-btn"
                onClick={() => {
                  setProblemUploadModalOpen(false)
                  setProblemTestcaseFile(null)
                  if (problemTestcaseInputRef.current) {
                    problemTestcaseInputRef.current.value = ''
                  }
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="admin-modal-primary-btn"
                onClick={handleUploadProblemTestcase}
                disabled={problemTestcaseUploading || !problemTestcaseFile}
              >
                {problemTestcaseUploading ? '上传中…' : '确认上传'}
              </button>
            </div>
          </div>
        </div>
      )}
      {problemDeleteConfirm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-title">确认删除</div>
            <div className="admin-modal-message">
              确认要删除题目（ID: {problemDeleteConfirm.id}）吗？
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="problem-detail-edit-btn"
                onClick={() => setProblemDeleteConfirm(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="admin-modal-primary-btn"
                onClick={handleConfirmDeleteProblem}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
      {problemDetailAlertOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-title">
              {problemDetailAlertTitle || '提示'}
            </div>
            <div className="admin-modal-message">
              {problemDetailAlertMessage}
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-primary-btn"
                onClick={() => setProblemDetailAlertOpen(false)}
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
