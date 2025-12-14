import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  fetchProblemDetail,
  fetchProblemList,
  type ProblemDetail,
  type ProblemItem,
  type ProblemOrderBy,
  updateProblem,
  uploadProblemTestcase,
} from '../api/problem'
import { formatDateTimeText } from '../utils/datetime'

type ProblemStatusFilter = 'all' | '0' | '1' | '2'
type ProblemVisibleFilter = 'all' | '0' | '1'

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
  const [problemDetailAlertOpen, setProblemDetailAlertOpen] =
    useState(false)
  const [problemDetailAlertTitle, setProblemDetailAlertTitle] =
    useState('')
  const [problemDetailAlertMessage, setProblemDetailAlertMessage] =
    useState('')
  const [problemTestcaseFile, setProblemTestcaseFile] =
    useState<File | null>(null)
  const [problemTestcaseUploading, setProblemTestcaseUploading] =
    useState(false)
  const problemTestcaseInputRef = useRef<HTMLInputElement | null>(null)
  const [problemUploadModalOpen, setProblemUploadModalOpen] =
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
        window.alert('部分题目更新失败，请稍后重试')
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
      window.alert('批量操作失败，请稍后重试')
    } finally {
      setProblemBatchSubmitting(false)
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
        elements.push(
          <strong key={key}>{token.slice(2, -2)}</strong>,
        )
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
        content.push(
          ...renderProblemDescriptionInline(line),
        )
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
            <h1
              className="problem-detail-heading"
              key={headingKey}
            >
              {children}
            </h1>,
          )
        } else if (level === 2) {
          nodes.push(
            <h2
              className="problem-detail-heading"
              key={headingKey}
            >
              {children}
            </h2>,
          )
        } else {
          nodes.push(
            <h3
              className="problem-detail-heading"
              key={headingKey}
            >
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
            <table
              className="problem-detail-table"
              key={`table-${key}`}
            >
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

  return (
    <>
      {problemDetailId !== null ? (
        <div className="problem-detail">
          <div className="problem-detail-header">
            <button
              type="button"
              className="problem-detail-back-btn"
              onClick={closeProblemDetail}
            >
              ← 返回题目列表
            </button>
            <div className="problem-detail-header-main">
              <div className="problem-detail-title">
                {problemDetail?.title ?? '题目详情'}
              </div>
              {problemDetail && (
                <div className="problem-detail-meta">
                  <span className="problem-detail-meta-item">
                    ID {problemDetail.id}
                  </span>
                  <span className="problem-detail-dot" />
                  <span className="problem-detail-meta-item">
                    创建{' '}
                    {(problemDetail.creator_realname || '未知') +
                      ' · ' +
                      formatDateTimeText(problemDetail.created_at)}
                  </span>
                  <span className="problem-detail-dot" />
                  <span className="problem-detail-meta-item">
                    最后更新{' '}
                    {(problemDetail.updater_realname || '未知') +
                      ' · ' +
                      formatDateTimeText(problemDetail.updated_at)}
                  </span>
                </div>
              )}
            </div>
          </div>
          {problemDetailLoading && (
            <div className="problem-detail-body">正在加载题目详情…</div>
          )}
          {!problemDetailLoading && problemDetail && (
            <div className="problem-detail-body">
              <div className="problem-detail-section">
                <div className="problem-detail-section-title">基本信息</div>
                <div className="problem-detail-main-row">
                  <div className="problem-detail-grid">
                    <div className="problem-detail-item-label">标题</div>
                    <div className="problem-detail-item-value">
                      {problemDetailEditing ? (
                        <div className="problem-detail-title-input-wrapper">
                          <input
                            type="text"
                            className="problem-detail-input problem-detail-input-title"
                            maxLength={255}
                            value={problemDetailTitleDraft}
                            onChange={(e) =>
                              setProblemDetailTitleDraft(e.target.value)
                            }
                          />
                          <span className="problem-detail-title-counter">
                            {problemDetailTitleDraft.length} / 255
                          </span>
                        </div>
                      ) : (
                        problemDetail.title
                      )}
                    </div>
                    <div className="problem-detail-item-label">状态</div>
                    <div className="problem-detail-item-value">
                      {problemDetailEditing ? (
                        <div
                          className="problem-sort-select-wrapper"
                          onMouseEnter={clearProblemDetailStatusCloseTimer}
                          onMouseLeave={() => {
                            clearProblemDetailStatusCloseTimer()
                            problemDetailStatusCloseTimerRef.current =
                              window.setTimeout(() => {
                                setProblemDetailStatusDropdownOpen(false)
                              }, 100)
                          }}
                        >
                          <button
                            type="button"
                            className={
                              'problem-sort-select problem-detail-select-trigger' +
                              (problemDetailStatusDropdownOpen
                                ? ' problem-sort-select-open'
                                : '')
                            }
                            onClick={() =>
                              setProblemDetailStatusDropdownOpen(
                                (open) => !open,
                              )
                            }
                          >
                            {(problemDetailStatusDraft ??
                              problemDetail.status) === 0
                              ? '未发布'
                              : (problemDetailStatusDraft ??
                                  problemDetail.status) === 1
                                ? '已发布'
                                : '已删除'}
                          </button>
                          {problemDetailStatusDropdownOpen && (
                            <div className="problem-sort-menu problem-detail-select-menu">
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => {
                                  setProblemDetailStatusDraft(0)
                                  setProblemDetailStatusDropdownOpen(false)
                                }}
                              >
                                未发布
                              </button>
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => {
                                  setProblemDetailStatusDraft(1)
                                  setProblemDetailStatusDropdownOpen(false)
                                }}
                              >
                                已发布
                              </button>
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => {
                                  setProblemDetailStatusDraft(2)
                                  setProblemDetailStatusDropdownOpen(false)
                                }}
                              >
                                已删除
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className={
                            'problem-status-pill ' +
                            (problemDetail.status === 0
                              ? 'problem-status-pill-pending'
                              : problemDetail.status === 1
                                ? 'problem-status-pill-active'
                                : 'problem-status-pill-deleted')
                          }
                        >
                          {problemDetail.status === 0
                            ? '未发布'
                            : problemDetail.status === 1
                              ? '已发布'
                              : '已删除'}
                        </span>
                      )}
                    </div>
                    <div className="problem-detail-item-label">
                      非赛时可见性
                    </div>
                    <div className="problem-detail-item-value">
                      {problemDetailEditing ? (
                        <div
                          className="problem-sort-select-wrapper"
                          onMouseEnter={clearProblemDetailVisibleCloseTimer}
                          onMouseLeave={() => {
                            clearProblemDetailVisibleCloseTimer()
                            problemDetailVisibleCloseTimerRef.current =
                              window.setTimeout(() => {
                                setProblemDetailVisibleDropdownOpen(false)
                              }, 100)
                          }}
                        >
                          <button
                            type="button"
                            className={
                              'problem-sort-select problem-detail-select-trigger' +
                              (problemDetailVisibleDropdownOpen
                                ? ' problem-sort-select-open'
                                : '')
                            }
                            onClick={() =>
                              setProblemDetailVisibleDropdownOpen(
                                (open) => !open,
                              )
                            }
                          >
                            {(problemDetailVisibleDraft ??
                              problemDetail.visible) === 1
                              ? '可见'
                              : '不可见'}
                          </button>
                          {problemDetailVisibleDropdownOpen && (
                            <div className="problem-sort-menu problem-detail-select-menu">
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => {
                                  setProblemDetailVisibleDraft(1)
                                  setProblemDetailVisibleDropdownOpen(false)
                                }}
                              >
                                可见
                              </button>
                              <button
                                type="button"
                                className="problem-sort-menu-item"
                                onClick={() => {
                                  setProblemDetailVisibleDraft(0)
                                  setProblemDetailVisibleDropdownOpen(false)
                                }}
                              >
                                不可见
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span
                          className={
                            'problem-visible-pill ' +
                            (problemDetail.visible === 1
                              ? 'problem-visible-pill-on'
                              : 'problem-visible-pill-off')
                          }
                        >
                          {problemDetail.visible === 1 ? '可见' : '不可见'}
                        </span>
                      )}
                    </div>
                    <div className="problem-detail-item-label">时间限制</div>
                    <div className="problem-detail-item-value">
                      {problemDetailEditing ? (
                        <div className="problem-detail-limit-input-wrapper">
                          <input
                            type="number"
                            className="problem-detail-input problem-detail-input-inline problem-detail-input-with-unit"
                            min={50}
                            max={30000}
                            value={problemDetailTimeLimitDraft}
                            onChange={(e) => {
                              const v = e.target.value
                              setProblemDetailTimeLimitDraft(
                                v === '' ? '' : Number(v),
                              )
                            }}
                            onBlur={clampProblemDetailTimeLimit}
                          />
                          <span className="problem-detail-limit-unit">
                            ms
                          </span>
                        </div>
                      ) : (
                        `${problemDetail.time_limit} ms`
                      )}
                    </div>
                    <div className="problem-detail-item-label">内存限制</div>
                    <div className="problem-detail-item-value">
                      {problemDetailEditing ? (
                        <div className="problem-detail-limit-input-wrapper">
                          <input
                            type="number"
                            className="problem-detail-input problem-detail-input-inline problem-detail-input-with-unit"
                            min={128}
                            max={1024}
                            value={problemDetailMemoryLimitDraft}
                            onChange={(e) => {
                              const v = e.target.value
                              setProblemDetailMemoryLimitDraft(
                                v === '' ? '' : Number(v),
                              )
                            }}
                            onBlur={clampProblemDetailMemoryLimit}
                          />
                          <span className="problem-detail-limit-unit">
                            MB
                          </span>
                        </div>
                      ) : (
                        `${problemDetail.memory_limit} MB`
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="problem-detail-section">
                <div className="problem-detail-section-title">题目描述</div>
                <div className="problem-detail-description">
                  {problemDetailEditing ? (
                    <textarea
                      className="problem-detail-textarea"
                      value={problemDetailDescriptionDraft}
                      onChange={(e) =>
                        setProblemDetailDescriptionDraft(e.target.value)
                      }
                    />
                  ) : (
                    renderProblemDescription(problemDetail.description)
                  )}
                </div>
                <div className="problem-detail-actions">
                  {!problemDetailEditing && (
                    <>
                      <button
                        type="button"
                        className="problem-detail-edit-btn"
                        onClick={() => {
                          setProblemUploadModalOpen(true)
                        }}
                      >
                        上传测试用例
                      </button>
                      <button
                        type="button"
                        className="problem-detail-edit-btn"
                        onClick={() => {
                          setProblemDetailTitleDraft(
                            problemDetail.title ?? '',
                          )
                          setProblemDetailEditing(true)
                        }}
                      >
                        修改
                      </button>
                    </>
                  )}
                  {problemDetailEditing && (
                    <>
                      <button
                        type="button"
                        className="problem-detail-cancel-btn"
                        onClick={() => {
                          setProblemDetailEditing(false)
                          setProblemDetailStatusDropdownOpen(false)
                          setProblemDetailVisibleDropdownOpen(false)
                        }}
                      >
                        取消修改
                      </button>
                      <button
                        type="button"
                        className="problem-detail-confirm-btn"
                        disabled={!problemDetailHasChanges}
                        onClick={handleConfirmProblemDetailChanges}
                      >
                        确认修改
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="problem-list">
          {problemError && (
            <div className="competition-error">{problemError}</div>
          )}
          {!problemError && (
            <>
              {problemLoading && (
                <div className="competition-empty">正在加载题目列表…</div>
              )}
              <div className="problem-list-toolbar">
                <div className="problem-batch-group">
                  <span className="problem-batch-label">批量操作</span>
                  <div className="problem-batch-select-wrapper">
                    <button
                      type="button"
                      className={
                        'problem-batch-select' +
                        (problemBatchDropdownOpen
                          ? ' problem-batch-select-open'
                          : '')
                      }
                      disabled={
                        !hasSelectedProblems || problemBatchSubmitting
                      }
                      onClick={() =>
                        setProblemBatchDropdownOpen((open) => !open)
                      }
                    >
                      选择操作
                    </button>
                    {problemBatchDropdownOpen && (
                      <div className="problem-batch-menu">
                        <button
                          type="button"
                          className="problem-batch-menu-item"
                          onClick={async () => {
                            setProblemBatchDropdownOpen(false)
                            await batchUpdateSelectedProblems({
                              status: 1,
                            })
                          }}
                        >
                          批量发布
                        </button>
                        <button
                          type="button"
                          className="problem-batch-menu-item"
                          onClick={async () => {
                            setProblemBatchDropdownOpen(false)
                            await batchUpdateSelectedProblems({
                              status: 2,
                            })
                          }}
                        >
                          批量删除
                        </button>
                        <button
                          type="button"
                          className="problem-batch-menu-item"
                          onClick={async () => {
                            setProblemBatchDropdownOpen(false)
                            await batchUpdateSelectedProblems({
                              status: 0,
                            })
                          }}
                        >
                          批量设为未发布
                        </button>
                        <button
                          type="button"
                          className="problem-batch-menu-item"
                          onClick={async () => {
                            setProblemBatchDropdownOpen(false)
                            await batchUpdateSelectedProblems({
                              visible: 0,
                            })
                          }}
                        >
                          批量设为不可见
                        </button>
                        <button
                          type="button"
                          className="problem-batch-menu-item"
                          onClick={async () => {
                            setProblemBatchDropdownOpen(false)
                            await batchUpdateSelectedProblems({
                              visible: 1,
                            })
                          }}
                        >
                          批量设为可见
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="problem-toolbar-right">
                  <div className="problem-search-group">
                    <button
                      type="button"
                      className="competition-refresh-btn"
                      onClick={resetProblemFilters}
                      disabled={problemLoading}
                      aria-label="重置筛选并刷新题目列表"
                      title="重置筛选并刷新"
                    >
                      ↻
                    </button>
                    <div className="problem-search-input-wrapper">
                      <button
                        type="button"
                        className="problem-search-icon-btn"
                        onClick={applyProblemTitleSearch}
                        disabled={problemLoading}
                        aria-label="搜索"
                        title="搜索"
                      >
                        🔍
                      </button>
                      <input
                        type="text"
                        className="problem-search-input"
                        placeholder="搜索题目标题"
                        value={problemTitleFilterInput}
                        onChange={(e) =>
                          setProblemTitleFilterInput(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            applyProblemTitleSearch()
                          }
                        }}
                        disabled={problemLoading}
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
                          (problemOrderDropdownOpen
                            ? ' problem-sort-select-open'
                            : '')
                        }
                        onClick={() =>
                          setProblemOrderDropdownOpen((open) => !open)
                        }
                        disabled={problemLoading}
                      >
                        {problemOrderLabel}
                      </button>
                      {problemOrderDropdownOpen && (
                        <div className="problem-sort-menu">
                          <button
                            type="button"
                            className={
                              'problem-sort-menu-item' +
                              (problemOrderField === 'id'
                                ? ' problem-sort-menu-item-active'
                                : '')
                            }
                            onClick={() => {
                              setProblemOrderField('id')
                              setProblemOrderDropdownOpen(false)
                            }}
                          >
                            按 ID
                          </button>
                          <button
                            type="button"
                            className={
                              'problem-sort-menu-item' +
                              (problemOrderField === 'created_at'
                                ? ' problem-sort-menu-item-active'
                                : '')
                            }
                            onClick={() => {
                              setProblemOrderField('created_at')
                              setProblemOrderDropdownOpen(false)
                            }}
                          >
                            按创建时间
                          </button>
                          <button
                            type="button"
                            className={
                              'problem-sort-menu-item' +
                              (problemOrderField === 'updated_at'
                                ? ' problem-sort-menu-item-active'
                                : '')
                            }
                            onClick={() => {
                              setProblemOrderField('updated_at')
                              setProblemOrderDropdownOpen(false)
                            }}
                          >
                            按更新时间
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className={
                        'problem-sort-order-btn' +
                        (!problemOrderDesc
                          ? ' problem-sort-order-btn-active'
                          : '')
                      }
                      onClick={() => setProblemOrderDesc(false)}
                      disabled={problemLoading}
                    >
                      升序
                    </button>
                    <button
                      type="button"
                      className={
                        'problem-sort-order-btn' +
                        (problemOrderDesc
                          ? ' problem-sort-order-btn-active'
                          : '')
                      }
                      onClick={() => setProblemOrderDesc(true)}
                      disabled={problemLoading}
                    >
                      降序
                    </button>
                  </div>
                </div>
              </div>
              <div className="problem-list-table">
                <div className="problem-list-row problem-list-row-header">
                  <div className="problem-col-select">
                    <input
                      type="checkbox"
                      ref={problemHeaderSelectRef}
                      className="problem-select-checkbox"
                      checked={isAllCurrentPageSelected}
                      disabled={
                        problemLoading || problems.length === 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProblemIds(problems.map((p) => p.id))
                        } else {
                          setSelectedProblemIds([])
                        }
                      }}
                    />
                  </div>
                  <div className="problem-col-id">ID</div>
                  <div className="problem-col-title">标题</div>
                  <div className="problem-col-status-header">
                    <div className="problem-filter-header">
                      <span>状态</span>
                      <div className="problem-filter-wrapper">
                        <button
                          type="button"
                          className={
                            'problem-filter-icon-btn' +
                            (problemStatusFilter !== 'all'
                              ? ' problem-filter-icon-btn-active'
                              : '') +
                            (problemStatusFilterOpen
                              ? ' problem-filter-icon-btn-open'
                              : '')
                          }
                          onClick={() =>
                            setProblemStatusFilterOpen((open) => !open)
                          }
                          disabled={problemLoading}
                          aria-label={problemStatusFilterLabel}
                        />
                        {problemStatusFilterOpen && (
                          <div className="problem-filter-menu">
                            <button
                              type="button"
                              className={
                                'problem-filter-menu-item' +
                                (problemStatusFilter === 'all'
                                  ? ' problem-filter-menu-item-active'
                                  : '')
                              }
                              onClick={() => {
                                setProblemStatusFilter('all')
                                setProblemPage(1)
                                setProblemStatusFilterOpen(false)
                              }}
                            >
                              全部
                            </button>
                            <button
                              type="button"
                              className={
                                'problem-filter-menu-item' +
                                (problemStatusFilter === '0'
                                  ? ' problem-filter-menu-item-active'
                                  : '')
                              }
                              onClick={() => {
                                setProblemStatusFilter('0')
                                setProblemPage(1)
                                setProblemStatusFilterOpen(false)
                              }}
                            >
                              未发布
                            </button>
                            <button
                              type="button"
                              className={
                                'problem-filter-menu-item' +
                                (problemStatusFilter === '1'
                                  ? ' problem-filter-menu-item-active'
                                  : '')
                              }
                              onClick={() => {
                                setProblemStatusFilter('1')
                                setProblemPage(1)
                                setProblemStatusFilterOpen(false)
                              }}
                            >
                              已发布
                            </button>
                            <button
                              type="button"
                              className={
                                'problem-filter-menu-item' +
                                (problemStatusFilter === '2'
                                  ? ' problem-filter-menu-item-active'
                                  : '')
                              }
                              onClick={() => {
                                setProblemStatusFilter('2')
                                setProblemPage(1)
                                setProblemStatusFilterOpen(false)
                              }}
                            >
                              已删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="problem-col-visible-header">
                    <div className="problem-filter-header">
                      <span>非赛时可见性</span>
                      <div className="problem-filter-wrapper">
                        <button
                          type="button"
                          className={
                            'problem-filter-icon-btn' +
                            (problemVisibleFilter !== 'all'
                              ? ' problem-filter-icon-btn-active'
                              : '') +
                            (problemVisibleFilterOpen
                              ? ' problem-filter-icon-btn-open'
                              : '')
                          }
                          onClick={() =>
                            setProblemVisibleFilterOpen((open) => !open)
                          }
                          disabled={problemLoading}
                          aria-label={problemVisibleFilterLabel}
                        />
                        {problemVisibleFilterOpen && (
                          <div className="problem-filter-menu">
                            <button
                              type="button"
                              className={
                                'problem-filter-menu-item' +
                                (problemVisibleFilter === 'all'
                                  ? ' problem-filter-menu-item-active'
                                  : '')
                              }
                              onClick={() => {
                                setProblemVisibleFilter('all')
                                setProblemPage(1)
                                setProblemVisibleFilterOpen(false)
                              }}
                            >
                              全部
                            </button>
                            <button
                              type="button"
                              className={
                                'problem-filter-menu-item' +
                                (problemVisibleFilter === '1'
                                  ? ' problem-filter-menu-item-active'
                                  : '')
                              }
                              onClick={() => {
                                setProblemVisibleFilter('1')
                                setProblemPage(1)
                                setProblemVisibleFilterOpen(false)
                              }}
                            >
                              可见
                            </button>
                            <button
                              type="button"
                              className={
                                'problem-filter-menu-item' +
                                (problemVisibleFilter === '0'
                                  ? ' problem-filter-menu-item-active'
                                  : '')
                              }
                              onClick={() => {
                                setProblemVisibleFilter('0')
                                setProblemPage(1)
                                setProblemVisibleFilterOpen(false)
                              }}
                            >
                              不可见
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="problem-col-limits">限制</div>
                  <div className="problem-col-time">创建时间</div>
                  <div className="problem-col-time">更新时间</div>
                  <div className="problem-col-actions">操作</div>
                </div>
                <div className="problem-list-body">
                  {!problemLoading && problems.length === 0 && (
                    <div className="problem-list-row problem-list-row-empty">
                      <div className="problem-col-select" />
                      <div className="problem-col-id" />
                      <div className="problem-col-title">暂无题目</div>
                      <div className="problem-col-status" />
                      <div className="problem-col-visible" />
                      <div className="problem-col-limits" />
                      <div className="problem-col-time" />
                      <div className="problem-col-time" />
                      <div className="problem-col-actions" />
                    </div>
                  )}
                  {!problemLoading &&
                    problems.length > 0 &&
                    problems.map((p) => (
                      <div
                        key={p.id}
                        className="problem-list-row"
                        onClick={() => {
                          void openProblemDetail(p)
                        }}
                      >
                        <div className="problem-col-select">
                          <input
                            type="checkbox"
                            className="problem-select-checkbox"
                            checked={selectedProblemIds.includes(p.id)}
                            disabled={problemLoading}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProblemIds((prev) =>
                                  prev.includes(p.id)
                                    ? prev
                                    : [...prev, p.id],
                                )
                              } else {
                                setSelectedProblemIds((prev) =>
                                  prev.filter((id) => id !== p.id),
                                )
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          />
                        </div>
                        <div className="problem-col-id">{p.id}</div>
                        <div className="problem-col-title">{p.title}</div>
                        <div className="problem-col-status">
                          <span
                            className={
                              'problem-status-pill ' +
                              (p.status === 0
                                ? 'problem-status-pill-pending'
                                : p.status === 1
                                  ? 'problem-status-pill-active'
                                  : 'problem-status-pill-deleted')
                            }
                          >
                            {p.status === 0
                              ? '未发布'
                              : p.status === 1
                                ? '已发布'
                                : '已删除'}
                          </span>
                        </div>
                        <div className="problem-col-visible">
                          <span
                            className={
                              'problem-visible-pill ' +
                              (p.visible === 1
                                ? 'problem-visible-pill-on'
                                : 'problem-visible-pill-off')
                            }
                          >
                            {p.visible === 1 ? '可见' : '不可见'}
                          </span>
                        </div>
                        <div className="problem-col-limits">
                          {p.time_limit} ms / {p.memory_limit} MB
                        </div>
                        <div className="problem-col-time">
                          {formatDateTimeText(p.created_at)}
                        </div>
                        <div className="problem-col-time">
                          {formatDateTimeText(p.updated_at)}
                        </div>
                        <div className="problem-col-actions">
                          <button
                            type="button"
                            className="problem-action-btn"
                            aria-label="查看详情"
                            title="查看详情"
                            onClick={(e) => {
                              e.stopPropagation()
                              void openProblemDetail(p)
                            }}
                          >
                            👁
                          </button>
                          <button
                            type="button"
                            className="problem-action-btn problem-action-danger"
                            aria-label="删除题目"
                            title="删除题目"
                            disabled={p.status === 2}
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
                  aria-label="新增题目"
                  title="新增题目"
                  disabled={problemLoading}
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
                        (problemPageSizeDropdownOpen
                          ? ' problem-sort-select-open'
                          : '')
                      }
                      onClick={(e) => {
                        if (!problemPageSizeDropdownOpen) {
                          const rect =
                            e.currentTarget.getBoundingClientRect()
                          const spaceBelow =
                            window.innerHeight - rect.bottom
                          const estimatedMenuHeight = 180
                          setProblemPageSizeDropUp(
                            spaceBelow < estimatedMenuHeight,
                          )
                        }
                        setProblemPageSizeDropdownOpen((open) => !open)
                      }}
                      disabled={problemLoading}
                    >
                      {problemPageSizeLabel}
                    </button>
                    {problemPageSizeDropdownOpen && (
                      <div
                        className={
                          'problem-sort-menu' +
                          (problemPageSizeDropUp
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
                              (problemPageSize === size
                                ? ' problem-sort-menu-item-active'
                                : '')
                            }
                            onClick={() => {
                              setProblemPageSize(size)
                              setProblemPage(1)
                              setProblemPageSizeDropdownOpen(false)
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
                    setProblemPage((p) => Math.max(1, p - 1))
                  }
                  disabled={problemPage <= 1 || problemLoading}
                >
                  上一页
                </button>
                <span className="competition-page-info">
                  第 {problemPage} / {problemMaxPage} 页
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setProblemPage((p) =>
                      Math.min(problemMaxPage, p + 1),
                    )
                  }
                  disabled={
                    problemPage >= problemMaxPage || problemLoading
                  }
                >
                  下一页
                </button>
              </div>
            </>
          )}
        </div>
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
