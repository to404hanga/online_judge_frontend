import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-go'
import TopNav from '../components/TopNav'
import AdminCompetitionAlertModal from '../components/AdminCompetitionAlertModal'
import CompetitionList from '../components/CompetitionList'
import { fetchUserInfo, type UserInfo } from '../api/user'
import {
  type CompetitionItem,
  type CompetitionRankingListData,
  checkUserCompetitionProblemAccepted,
  connectCompetitionTimeEventStream,
  fetchCompetitionRankingList,
  fetchUserCompetitionProblemDetail,
  fetchUserCompetitionProblemList,
  getLatestSubmission,
  type LatestSubmissionData,
  submitCompetitionProblem,
  type UserCompetitionProblemDetail,
  type UserCompetitionProblemItem,
  startCompetition,
} from '../api/competition'
import { formatDateTimeText, formatDateTimeTextWithMs } from '../utils/datetime'

type Props = {
  onLogout: () => void
}

let clangFormatInitPromise: Promise<void> | null = null
let clangFormatFn:
  | ((source: string, filename?: string, style?: string) => string)
  | null = null

let gofmtInitPromise: Promise<void> | null = null
let gofmtFn: ((source: string) => string) | null = null

let ruffInitPromise: Promise<void> | null = null
let ruffWorkspace: { format: (contents: string) => string } | null = null

let prettierInitPromise: Promise<{
  format: (source: string, options: Record<string, unknown>) => Promise<string>
  javaPlugin: unknown
}> | null = null

function escapeHtml(value: string) {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;')
}

function resolvePrismLanguageId(language: string) {
  return language === 'cpp'
    ? 'cpp'
    : language === 'c'
      ? 'c'
      : language === 'java'
        ? 'java'
        : language === 'python'
          ? 'python'
          : language === 'go'
            ? 'go'
            : ''
}

function resolveSubmitLanguageId(
  language: 'cpp' | 'c' | 'java' | 'python' | 'go',
) {
  return language === 'c'
    ? 0
    : language === 'cpp'
      ? 1
      : language === 'python'
        ? 2
        : language === 'java'
          ? 3
          : 4
}

function formatSubmissionLanguage(language: number) {
  return language === 0
    ? 'C'
    : language === 1
      ? 'C++'
      : language === 2
        ? 'Python'
        : language === 3
          ? 'Java'
          : 'Go'
}

function formatSubmissionStatus(status: number) {
  return status === 0 ? '待判题' : status === 1 ? '判题中' : '已判题'
}

function formatSubmissionResult(result: number) {
  return result === 0
    ? '未判题'
    : result === 1
      ? 'Accepted'
      : result === 2
        ? 'Wrong Answer'
        : result === 3
          ? 'Compile Error'
          : result === 4
            ? 'Runtime Error'
            : result === 5
              ? 'Time Limit Exceeded'
              : result === 6
                ? 'Memory Limit Exceeded'
                : 'Output Limit Exceeded'
}

function normalizeRemainingToMs(value: number) {
  if (!Number.isFinite(value) || value < 0) return null
  if (value > 24 * 60 * 60 * 1000) return Math.round(value)
  return Math.round(value * 1000)
}

function parseRemainingMs(payload: string) {
  const text = payload.trim()
  if (!text) return null

  let jsonRemaining: number | null = null
  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed && typeof parsed === 'object') {
      const v = (parsed as Record<string, unknown>).remaining
      if (typeof v === 'number') jsonRemaining = normalizeRemainingToMs(v)
      if (typeof v === 'string') {
        const num = Number(v)
        if (Number.isFinite(num)) jsonRemaining = normalizeRemainingToMs(num)
      }
    }
  } catch {
    jsonRemaining = null
  }
  if (jsonRemaining !== null) return jsonRemaining

  const partsMatch = text.match(
    /remaining\s*[:=]\s*(\d+)\s*:\s*(\d{1,2})\s*:\s*(\d{1,2})\s*:\s*(\d{1,2})/iu,
  )
  if (partsMatch) {
    const days = Number(partsMatch[1])
    const hours = Number(partsMatch[2])
    const minutes = Number(partsMatch[3])
    const seconds = Number(partsMatch[4])
    if (
      Number.isFinite(days) &&
      Number.isFinite(hours) &&
      Number.isFinite(minutes) &&
      Number.isFinite(seconds) &&
      days >= 0 &&
      hours >= 0 &&
      minutes >= 0 &&
      seconds >= 0
    ) {
      return (days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000
    }
  }

  const match = text.match(/remaining\s*[:=]\s*(-?\d+(?:\.\d+)?)/iu)
  if (!match) return null
  const num = Number(match[1])
  if (!Number.isFinite(num)) return null
  return normalizeRemainingToMs(num)
}

function formatRemainingText(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  if (totalSeconds <= 0) return '0秒'
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  if (days > 0) {
    return `${days}天${hh}小时${mm}分${ss}秒`
  }
  return `${hh}小时${mm}分${ss}秒`
}

function renderTokenStreamWithSelection(
  stream: Prism.TokenStream,
  selectionStart: number,
  selectionEnd: number,
) {
  const rangeStart = Math.max(0, Math.min(selectionStart, selectionEnd))
  const rangeEnd = Math.max(0, Math.max(selectionStart, selectionEnd))

  function renderTextSegment(text: string, offset: number) {
    if (rangeStart === rangeEnd) {
      return escapeHtml(text)
    }
    const start = Math.max(0, rangeStart - offset)
    const end = Math.min(text.length, rangeEnd - offset)
    if (end <= 0 || start >= text.length || start >= end) {
      return escapeHtml(text)
    }
    const before = text.slice(0, start)
    const selected = text.slice(start, end)
    const after = text.slice(end)
    return (
      escapeHtml(before) +
      `<span class="oj-editor-selection">${escapeHtml(selected)}</span>` +
      escapeHtml(after)
    )
  }

  let cursor = 0

  function renderTokenStream(tokenStream: Prism.TokenStream): string {
    if (typeof tokenStream === 'string') {
      const html = renderTextSegment(tokenStream, cursor)
      cursor += tokenStream.length
      return html
    }
    if (Array.isArray(tokenStream)) {
      return tokenStream.map((item) => renderTokenStream(item)).join('')
    }

    const token = tokenStream
    const classes: string[] = ['token', token.type]
    if (token.alias) {
      const alias = Array.isArray(token.alias) ? token.alias : [token.alias]
      classes.push(...alias)
    }
    const inner = renderTokenStream(token.content)
    return `<span class="${classes.join(' ')}">${inner}</span>`
  }

  return renderTokenStream(stream)
}

async function formatCodeByLanguage(language: string, code: string) {
  if (language === 'cpp' || language === 'c') {
    if (!clangFormatInitPromise) {
      clangFormatInitPromise = import('@wasm-fmt/clang-format').then((mod) => {
        clangFormatFn = mod.format
        return mod.default()
      })
    }
    await clangFormatInitPromise
    if (!clangFormatFn) {
      throw new Error('clang-format 初始化失败')
    }
    const style = JSON.stringify({
      BasedOnStyle: 'Google',
      IndentWidth: 4,
      TabWidth: 4,
      UseTab: 'Never',
    })
    const filename = language === 'c' ? 'main.c' : 'main.cpp'
    return clangFormatFn(code, filename, style)
  }

  if (language === 'go') {
    if (!gofmtInitPromise) {
      gofmtInitPromise = import('@wasm-fmt/gofmt/vite').then((mod) => {
        gofmtFn = mod.format
        return mod.default()
      })
    }
    await gofmtInitPromise
    if (!gofmtFn) {
      throw new Error('gofmt 初始化失败')
    }
    return gofmtFn(code)
  }

  if (language === 'python') {
    if (!ruffInitPromise) {
      ruffInitPromise = import('@astral-sh/ruff-wasm-web').then((mod) => {
        return mod.default().then(() => {
          const workspace = new mod.Workspace(
            {
              'indent-width': 4,
              'line-length': 88,
              format: {
                'indent-style': 'space',
                'quote-style': 'double',
              },
            },
            mod.PositionEncoding.Utf16,
          )
          ruffWorkspace = workspace
        })
      })
    }
    await ruffInitPromise
    if (!ruffWorkspace) {
      throw new Error('ruff 初始化失败')
    }
    return ruffWorkspace.format(code)
  }

  if (language === 'java') {
    if (!prettierInitPromise) {
      prettierInitPromise = Promise.all([
        import('prettier/standalone'),
        import('prettier-plugin-java'),
      ]).then(([prettier, javaPlugin]) => {
        const plugin = (javaPlugin as { default?: unknown }).default ?? javaPlugin
        return {
          format: prettier.format,
          javaPlugin: plugin,
        }
      })
    }
    const { format, javaPlugin } = await prettierInitPromise
    return format(code, {
      parser: 'java',
      plugins: [javaPlugin],
      tabWidth: 4,
      printWidth: 100,
    })
  }

  return code
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
      const urlPart = token.slice(token.indexOf('](') + 2, token.length - 1)
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

export default function DashboardPage({ onLogout }: Props) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'list' | 'detail' | 'running' | 'ranking'>('list')
  const [selectedCompetition, setSelectedCompetition] =
    useState<CompetitionItem | null>(null)
  const [startLoading, setStartLoading] = useState(false)
  const [startError, setStartError] = useState('')
  const [competitionJwtToken, setCompetitionJwtToken] = useState('')
  const [timeEventStatus, setTimeEventStatus] = useState('')
  const [remainingBaseMs, setRemainingBaseMs] = useState<number | null>(null)
  const [remainingSyncAt, setRemainingSyncAt] = useState<number | null>(null)
  const [competitionEndedModalOpen, setCompetitionEndedModalOpen] = useState(false)
  const [competitionEndedMessage, setCompetitionEndedMessage] = useState('')
  const competitionEndedNotifiedRef = useRef(false)
  const [competitionProblems, setCompetitionProblems] = useState<
    UserCompetitionProblemItem[]
  >([])
  const [activeCompetitionProblemId, setActiveCompetitionProblemId] = useState<
    number | null
  >(null)
  const [competitionProblemsLoading, setCompetitionProblemsLoading] =
    useState(false)
  const [competitionProblemsError, setCompetitionProblemsError] = useState('')
  const [competitionProblemDetail, setCompetitionProblemDetail] =
    useState<UserCompetitionProblemDetail | null>(null)
  const [competitionProblemDetailLoading, setCompetitionProblemDetailLoading] =
    useState(false)
  const [competitionProblemDetailError, setCompetitionProblemDetailError] =
    useState('')
  const competitionProblemDetailRequestRef = useRef(0)
  const [codeDraft, setCodeDraft] = useState('')
  const [codeLanguage, setCodeLanguage] = useState<
    'cpp' | 'c' | 'java' | 'python' | 'go'
  >('cpp')
  const [codeFontSize, setCodeFontSize] = useState(14)
  const codeEditorRef = useRef<HTMLTextAreaElement | null>(null)
  const codeGutterRef = useRef<HTMLDivElement | null>(null)
  const codeHighlightRef = useRef<HTMLPreElement | null>(null)
  const [codeLanguageDropdownOpen, setCodeLanguageDropdownOpen] = useState(false)
  const [codeFontDropdownOpen, setCodeFontDropdownOpen] = useState(false)
  const codeLanguageDropdownRef = useRef<HTMLDivElement | null>(null)
  const codeFontDropdownRef = useRef<HTMLDivElement | null>(null)
  const [now, setNow] = useState(Date.now())
  const [formatting, setFormatting] = useState(false)
  const [formatError, setFormatError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitStatus, setSubmitStatus] = useState('')
  const [submitQueueModalOpen, setSubmitQueueModalOpen] = useState(false)
  const [latestSubmissionOpen, setLatestSubmissionOpen] = useState(false)
  const [latestSubmissionLoading, setLatestSubmissionLoading] = useState(false)
  const [latestSubmissionError, setLatestSubmissionError] = useState('')
  const [latestSubmission, setLatestSubmission] = useState<LatestSubmissionData | null>(
    null,
  )
  const [problemAcceptedMap, setProblemAcceptedMap] = useState<
    Record<number, boolean>
  >({})
  const acceptedStatusRequestRef = useRef(0)
  const [rankingData, setRankingData] = useState<CompetitionRankingListData | null>(null)
  const [rankingLoading, setRankingLoading] = useState(false)
  const [rankingError, setRankingError] = useState('')
  const [rankingPage, setRankingPage] = useState(1)
  const [rankingReloadKey, setRankingReloadKey] = useState(0)
  const rankingRequestRef = useRef(0)
  const latestSubmissionRequestRef = useRef(0)
  const [highlightHtml, setHighlightHtml] = useState('')
  const highlightTimerRef = useRef<number | null>(null)
  const highlightRafRef = useRef<number | null>(null)
  const pendingHighlightRef = useRef<{
    language: string
    code: string
    selection: { start: number; end: number }
  } | null>(null)
  const selectionRafRef = useRef<number | null>(null)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const selectionRef = useRef(selection)
  const codeDraftRef = useRef(codeDraft)
  const codeLanguageRef = useRef(codeLanguage)
  const highlightTokenStreamRef = useRef<{
    language: string
    code: string
    tokenStream: Prism.TokenStream
  } | null>(null)

  const getProblemCodeCacheKey = useCallback((competitionId: number, problemId: number) => {
    return `oj:problem-code:v1:${competitionId}:${problemId}`
  }, [])

  const loadProblemCodeCache = useCallback(
    (competitionId: number, problemId: number) => {
      try {
        return localStorage.getItem(getProblemCodeCacheKey(competitionId, problemId))
      } catch {
        return null
      }
    },
    [getProblemCodeCacheKey],
  )

  const saveProblemCodeCache = useCallback(
    (competitionId: number, problemId: number, code: string) => {
      try {
        localStorage.setItem(getProblemCodeCacheKey(competitionId, problemId), code)
      } catch {
        return
      }
    },
    [getProblemCodeCacheKey],
  )

  const syncHighlightScroll = useCallback(() => {
    const textarea = codeEditorRef.current
    const highlight = codeHighlightRef.current
    if (!textarea || !highlight) return
    highlight.scrollLeft = textarea.scrollLeft
    highlight.scrollTop = textarea.scrollTop
  }, [])

  const scheduleHighlightUpdate = useCallback((
    nextCode: string,
    nextSelection: { start: number; end: number },
    nextLanguage = codeLanguageRef.current,
  ) => {
    if (view !== 'running') return
    pendingHighlightRef.current = {
      language: nextLanguage,
      code: nextCode,
      selection: nextSelection,
    }
    if (highlightRafRef.current !== null) return
    highlightRafRef.current = requestAnimationFrame(() => {
      highlightRafRef.current = null
      const pending = pendingHighlightRef.current
      if (!pending) return
      try {
        const prismLanguageId = resolvePrismLanguageId(pending.language)
        const grammar =
          prismLanguageId && Prism.languages[prismLanguageId]
            ? Prism.languages[prismLanguageId]
            : null
        const tokenStream = grammar
          ? Prism.tokenize(pending.code, grammar)
          : pending.code
        highlightTokenStreamRef.current = {
          language: pending.language,
          code: pending.code,
          tokenStream,
        }
        setHighlightHtml(
          renderTokenStreamWithSelection(
            tokenStream,
            pending.selection.start,
            pending.selection.end,
          ),
        )
        requestAnimationFrame(() => {
          syncHighlightScroll()
        })
      } catch {
        highlightTokenStreamRef.current = {
          language: pending.language,
          code: pending.code,
          tokenStream: pending.code,
        }
        setHighlightHtml(
          renderTokenStreamWithSelection(
            pending.code,
            pending.selection.start,
            pending.selection.end,
          ),
        )
      }
    })
  }, [syncHighlightScroll, view])

  useEffect(() => {
    void loadUser()
  }, [])

  useEffect(() => {
    selectionRef.current = selection
  }, [selection])

  useEffect(() => {
    codeDraftRef.current = codeDraft
  }, [codeDraft])

  useEffect(() => {
    codeLanguageRef.current = codeLanguage
  }, [codeLanguage])

  const handleSelectProblem = useCallback(
    (problemId: number) => {
      if (
        view === 'running' &&
        selectedCompetition &&
        activeCompetitionProblemId !== null
      ) {
        saveProblemCodeCache(
          selectedCompetition.id,
          activeCompetitionProblemId,
          codeDraftRef.current,
        )
      }
      setActiveCompetitionProblemId(problemId)
    },
    [view, selectedCompetition, activeCompetitionProblemId, saveProblemCodeCache],
  )

  useEffect(() => {
    if (view !== 'running') return
    if (!selectedCompetition) return
    if (activeCompetitionProblemId === null) return

    setSubmitting(false)
    setSubmitError('')
    setSubmitStatus('')
    setLatestSubmissionOpen(false)
    setLatestSubmissionLoading(false)
    setLatestSubmissionError('')
    setLatestSubmission(null)

    const cached = loadProblemCodeCache(
      selectedCompetition.id,
      activeCompetitionProblemId,
    )
    const next = cached ?? ''
    const nextSelection = { start: 0, end: 0 }
    selectionRef.current = nextSelection
    setSelection(nextSelection)
    codeDraftRef.current = next
    setCodeDraft(next)
    scheduleHighlightUpdate(next, nextSelection, codeLanguageRef.current)
    requestAnimationFrame(() => {
      const el = codeEditorRef.current
      if (el) {
        el.scrollTop = 0
        el.scrollLeft = 0
        el.selectionStart = 0
        el.selectionEnd = 0
      }
      if (codeGutterRef.current) {
        codeGutterRef.current.scrollTop = 0
      }
      if (codeHighlightRef.current) {
        codeHighlightRef.current.scrollTop = 0
        codeHighlightRef.current.scrollLeft = 0
      }
    })
  }, [
    view,
    selectedCompetition,
    activeCompetitionProblemId,
    loadProblemCodeCache,
    scheduleHighlightUpdate,
  ])

  useEffect(() => {
    if (view !== 'running') return
    if (!selectedCompetition) return
    if (activeCompetitionProblemId === null) return
    saveProblemCodeCache(selectedCompetition.id, activeCompetitionProblemId, codeDraft)
  }, [view, selectedCompetition, activeCompetitionProblemId, codeDraft, saveProblemCodeCache])

  useEffect(() => {
    if (view !== 'running') {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current)
        highlightTimerRef.current = null
      }
      highlightTokenStreamRef.current = null
      setHighlightHtml('')
      setSubmitting(false)
      setSubmitError('')
      setSubmitStatus('')
      setLatestSubmissionOpen(false)
      setLatestSubmissionLoading(false)
      setLatestSubmissionError('')
      setLatestSubmission(null)
      return
    }

    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }

    const isFirstPaint =
      !highlightTokenStreamRef.current ||
      highlightTokenStreamRef.current.language !== codeLanguage ||
      highlightTokenStreamRef.current.code !== codeDraft

    const delay = isFirstPaint ? 0 : 50

    const timer = window.setTimeout(() => {
      try {
        const currentSelection = selectionRef.current
        const prismLanguageId = resolvePrismLanguageId(codeLanguage)
        const grammar =
          prismLanguageId && Prism.languages[prismLanguageId]
            ? Prism.languages[prismLanguageId]
            : null
        const tokenStream = grammar ? Prism.tokenize(codeDraft, grammar) : codeDraft
        highlightTokenStreamRef.current = {
          language: codeLanguage,
          code: codeDraft,
          tokenStream,
        }
        setHighlightHtml(
          renderTokenStreamWithSelection(
            tokenStream,
            currentSelection.start,
            currentSelection.end,
          ),
        )
        requestAnimationFrame(() => {
          syncHighlightScroll()
        })
      } catch {
        setHighlightHtml(escapeHtml(codeDraft))
      }
    }, delay)
    highlightTimerRef.current = timer
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current)
        highlightTimerRef.current = null
      }
    }
  }, [view, codeLanguage, codeDraft, syncHighlightScroll])

  useEffect(() => {
    if (view !== 'running') return
    const currentCodeLanguage = codeLanguageRef.current
    const currentCodeDraft = codeDraftRef.current
    const cached = highlightTokenStreamRef.current
    const shouldReuse =
      cached &&
      cached.language === currentCodeLanguage &&
      cached.code === currentCodeDraft

    try {
      if (shouldReuse) {
        setHighlightHtml(
          renderTokenStreamWithSelection(
            cached.tokenStream,
            selection.start,
            selection.end,
          ),
        )
        return
      }

      const prismLanguageId = resolvePrismLanguageId(currentCodeLanguage)
      const grammar =
        prismLanguageId && Prism.languages[prismLanguageId]
          ? Prism.languages[prismLanguageId]
          : null
      const tokenStream = grammar
        ? Prism.tokenize(currentCodeDraft, grammar)
        : currentCodeDraft
      highlightTokenStreamRef.current = {
        language: currentCodeLanguage,
        code: currentCodeDraft,
        tokenStream,
      }
      setHighlightHtml(
        renderTokenStreamWithSelection(tokenStream, selection.start, selection.end),
      )
    } catch {
      setHighlightHtml(escapeHtml(currentCodeDraft))
    }
  }, [view, selection])

  const handleEditorSelectionChange = useCallback(() => {
    const el = codeEditorRef.current
    if (!el) return
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    if (selectionRafRef.current !== null) {
      cancelAnimationFrame(selectionRafRef.current)
    }
    selectionRafRef.current = requestAnimationFrame(() => {
      const nextSelection = { start, end }
      selectionRef.current = nextSelection
      setSelection(nextSelection)
      scheduleHighlightUpdate(codeDraftRef.current, nextSelection, codeLanguageRef.current)
      selectionRafRef.current = null
    })
  }, [scheduleHighlightUpdate])

  useEffect(() => {
    if (view !== 'running') return

    function handleDocumentSelectionChange() {
      if (document.activeElement !== codeEditorRef.current) return
      handleEditorSelectionChange()
    }

    document.addEventListener('selectionchange', handleDocumentSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleDocumentSelectionChange)
    }
  }, [view, handleEditorSelectionChange])

  useEffect(() => {
    if (!codeLanguageDropdownOpen && !codeFontDropdownOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (!target) return
      const withinLanguage =
        codeLanguageDropdownRef.current?.contains(target) ?? false
      const withinFont = codeFontDropdownRef.current?.contains(target) ?? false
      if (withinLanguage || withinFont) return
      setCodeLanguageDropdownOpen(false)
      setCodeFontDropdownOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [codeLanguageDropdownOpen, codeFontDropdownOpen])

  useEffect(() => {
    function updateNow() {
      setNow(Date.now())
    }

    updateNow()

    const secondTimer = window.setInterval(updateNow, 1000)
    const minuteTimer = window.setInterval(updateNow, 60 * 1000)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        updateNow()
      }
    }

    function handleFocus() {
      updateNow()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(secondTimer)
      window.clearInterval(minuteTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  async function loadUser() {
    setLoading(true)
    setError('')
    try {
      const res = await fetchUserInfo()
      if (!res.ok || !res.data) {
        setError('获取用户信息失败，请重新登录')
        return
      }
      setUser(res.data)
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  function handleGoHome() {
    if (!user) return
    setView('list')
    setSelectedCompetition(null)
    setStartError('')
    setStartLoading(false)
    setCompetitionJwtToken('')
    setTimeEventStatus('')
    setRemainingBaseMs(null)
    setRemainingSyncAt(null)
    competitionEndedNotifiedRef.current = false
    setCompetitionEndedModalOpen(false)
    setCompetitionEndedMessage('')
    setCompetitionProblems([])
    setCompetitionProblemsError('')
    setCompetitionProblemsLoading(false)
    setActiveCompetitionProblemId(null)
    setCompetitionProblemDetail(null)
    setCompetitionProblemDetailError('')
    setCompetitionProblemDetailLoading(false)
    setCodeDraft('')
    setProblemAcceptedMap({})
    setRankingData(null)
    setRankingError('')
    setRankingLoading(false)
    setRankingPage(1)
    setRankingReloadKey(0)
  }

  function formatDuration(ms: number) {
    if (ms <= 0) return '0秒'
    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')
    if (days > 0) {
      return `${days}天 ${hh}:${mm}:${ss}`
    }
    return `${hh}:${mm}:${ss}`
  }

  function handleSelectCompetition(item: CompetitionItem) {
    setSelectedCompetition(item)
    setView('detail')
    setStartError('')
  }

  async function handleFormatCode() {
    if (formatting) return
    if (!codeDraft) return
    setFormatError('')
    setFormatting(true)
    try {
      const formatted = await formatCodeByLanguage(codeLanguage, codeDraft)
      const currentSelection = selectionRef.current
      setCodeDraft(formatted)
      scheduleHighlightUpdate(formatted, currentSelection, codeLanguage)
    } catch {
      setFormatError('格式化失败，请检查代码是否存在语法错误')
    } finally {
      setFormatting(false)
    }
  }

  const loadLatestSubmission = useCallback(async () => {
    if (view !== 'running') return
    if (!competitionJwtToken) return
    if (activeCompetitionProblemId === null) return

    const requestId = latestSubmissionRequestRef.current + 1
    latestSubmissionRequestRef.current = requestId
    setLatestSubmissionLoading(true)
    setLatestSubmissionError('')
    setLatestSubmission(null)
    try {
      const res = await getLatestSubmission(
        competitionJwtToken,
        activeCompetitionProblemId,
      )
      if (latestSubmissionRequestRef.current !== requestId) return
      const data = res.data
      if (!res.ok || !data || data.code !== 200) {
        setLatestSubmissionError(data?.message ?? '获取提交记录失败')
        return
      }
      setLatestSubmission(data.data ?? null)
      if (data.data?.result === 1) {
        setProblemAcceptedMap((prev) => ({
          ...prev,
          [activeCompetitionProblemId]: true,
        }))
      }
      if (!data.data) {
        setLatestSubmissionError('暂无提交记录')
      }
    } catch {
      if (latestSubmissionRequestRef.current !== requestId) return
      setLatestSubmissionError('网络错误，请稍后重试')
    } finally {
      if (latestSubmissionRequestRef.current === requestId) {
        setLatestSubmissionLoading(false)
      }
    }
  }, [view, competitionJwtToken, activeCompetitionProblemId])

  async function handleSubmitCode() {
    if (submitting) return
    if (view !== 'running') return
    if (!competitionJwtToken) return
    if (activeCompetitionProblemId === null) return
    if (codeDraftRef.current.trim().length === 0) {
      setSubmitError('请输入代码后再提交')
      return
    }

    setSubmitError('')
    setSubmitStatus('')
    setSubmitting(true)
    try {
      const res = await submitCompetitionProblem(competitionJwtToken, {
        code: codeDraftRef.current,
        language: resolveSubmitLanguageId(codeLanguageRef.current),
        problem_id: activeCompetitionProblemId,
      })
      const data = res.data
      if (res.status === 403 || data?.code === 403) {
        setSubmitQueueModalOpen(true)
        return
      }
      if (!res.ok || !data || data.code !== 200) {
        setSubmitError(data?.message ?? '提交失败')
        return
      }
      setSubmitStatus(data.message || '提交成功')
      setLatestSubmissionOpen(true)
      void loadLatestSubmission()
    } catch {
      setSubmitError('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStartCompetition() {
    if (!selectedCompetition) return
    setStartError('')
    setStartLoading(true)
    try {
      const res = await startCompetition(selectedCompetition.id)
      const data = res.data
      if (!res.ok || !data || data.code !== 200) {
        setStartError(data?.message ?? '开始比赛失败')
        return
      }
      const token = res.headers?.get('X-Competition-JWT-Token') ?? ''
      if (!token) {
        setStartError('开始比赛失败：缺少比赛令牌')
        return
      }
      setCompetitionJwtToken(token)
      setView('running')
      setTimeEventStatus('')
      setRemainingBaseMs(null)
      setRemainingSyncAt(null)
      competitionEndedNotifiedRef.current = false
      setCompetitionEndedModalOpen(false)
      setCompetitionEndedMessage('')
    } catch {
      setStartError('网络错误，请稍后重试')
    } finally {
      setStartLoading(false)
    }
  }

  const handleCompetitionEndedAcknowledge = useCallback(() => {
    setCompetitionEndedModalOpen(false)
    setCompetitionEndedMessage('')
    setTimeEventStatus('')
    setRemainingBaseMs(null)
    setRemainingSyncAt(null)
    setCompetitionJwtToken('')
    setCompetitionProblems([])
    setCompetitionProblemsError('')
    setCompetitionProblemsLoading(false)
    setActiveCompetitionProblemId(null)
    setCompetitionProblemDetail(null)
    setCompetitionProblemDetailError('')
    setCompetitionProblemDetailLoading(false)
    setCodeDraft('')
    setProblemAcceptedMap({})
    setRankingData(null)
    setRankingError('')
    setRankingLoading(false)
    setRankingPage(1)
    setRankingReloadKey(0)
    setView('detail')
  }, [])

  const notifyCompetitionEnded = useCallback((reason?: string) => {
    if (competitionEndedNotifiedRef.current) return
    competitionEndedNotifiedRef.current = true
    setCompetitionEndedMessage((reason || '').trim() || '比赛已结束')
    setCompetitionEndedModalOpen(true)
  }, [])

  const competitionSseEnabled =
    Boolean(competitionJwtToken) && (view === 'running' || view === 'ranking')

  useEffect(() => {
    if (!competitionSseEnabled) return
    if (!competitionJwtToken) return

    const controller = new AbortController()
    setTimeEventStatus('连接中…')
    void connectCompetitionTimeEventStream(competitionJwtToken, {
      signal: controller.signal,
      onMessage: (value) => {
        const trimmed = value.trim()
        if (trimmed && trimmed.toLowerCase() === 'closed') {
          setTimeEventStatus('比赛已结束')
          notifyCompetitionEnded('比赛已结束')
          return
        }
        const remainingMs = parseRemainingMs(value)
        if (remainingMs === null) return
        setRemainingBaseMs(remainingMs)
        setRemainingSyncAt(Date.now())
        setTimeEventStatus('')
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : typeof err === 'string' ? err : '连接失败'
        setTimeEventStatus(message)
      },
    })
      .then(() => {
        if (!controller.signal.aborted) {
          setTimeEventStatus('连接已结束')
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setTimeEventStatus('连接失败')
        }
      })

    return () => {
      controller.abort()
    }
  }, [competitionSseEnabled, competitionJwtToken, notifyCompetitionEnded])

  useEffect(() => {
    if (!competitionSseEnabled) return
    if (remainingBaseMs === null || remainingSyncAt === null) return
    const displayMs = remainingBaseMs - (now - remainingSyncAt)
    if (displayMs > 0) return
    setTimeEventStatus('比赛已结束')
    notifyCompetitionEnded('比赛已结束')
  }, [
    competitionSseEnabled,
    remainingBaseMs,
    remainingSyncAt,
    now,
    notifyCompetitionEnded,
  ])

  useEffect(() => {
    if (view !== 'running') return
    if (!selectedCompetition) return
    if (!competitionJwtToken) return
    let disposed = false

    void (async () => {
      setCompetitionProblemsLoading(true)
      setCompetitionProblemsError('')
      setProblemAcceptedMap({})
      try {
        const res = await fetchUserCompetitionProblemList(competitionJwtToken)
        if (disposed) return
        if (!res.ok || !res.data) {
          setCompetitionProblems([])
          setCompetitionProblemsError(res.data?.message ?? '获取比赛题目列表失败')
          return
        }
        if (typeof res.data.code === 'number' && res.data.code !== 200) {
          setCompetitionProblems([])
          setCompetitionProblemsError(res.data.message ?? '获取比赛题目列表失败')
          return
        }
        const problems = res.data.data ?? []
        setCompetitionProblems(problems)

        const requestId = acceptedStatusRequestRef.current + 1
        acceptedStatusRequestRef.current = requestId

        const uniqueProblemIds = Array.from(
          new Set(problems.map((p) => p.problem_id)),
        )
        if (uniqueProblemIds.length === 0) return

        const concurrency = 4
        const acceptedProblemIdSet = new Set<number>()
        let cursor = 0

        async function worker() {
          while (cursor < uniqueProblemIds.length) {
            const currentIndex = cursor
            cursor += 1
            const problemId = uniqueProblemIds[currentIndex]
            try {
              const res = await checkUserCompetitionProblemAccepted(
                competitionJwtToken,
                problemId,
              )
              if (disposed) return
              if (acceptedStatusRequestRef.current !== requestId) return
              const data = res.data
              if (!res.ok || !data || data.code !== 200) continue
              if (data.data) {
                acceptedProblemIdSet.add(problemId)
              }
            } catch {
              if (disposed) return
              if (acceptedStatusRequestRef.current !== requestId) return
            }
          }
        }

        const workers = Array.from(
          { length: Math.min(concurrency, uniqueProblemIds.length) },
          () => worker(),
        )
        await Promise.all(workers)

        if (disposed) return
        if (acceptedStatusRequestRef.current !== requestId) return
        if (acceptedProblemIdSet.size === 0) return
        setProblemAcceptedMap((prev) => {
          const next: Record<number, boolean> = { ...prev }
          acceptedProblemIdSet.forEach((problemId) => {
            next[problemId] = true
          })
          return next
        })
      } catch {
        if (disposed) return
        setCompetitionProblems([])
        setCompetitionProblemsError('网络错误，请稍后重试')
      } finally {
        if (!disposed) {
          setCompetitionProblemsLoading(false)
        }
      }
    })()

    return () => {
      disposed = true
    }
  }, [view, selectedCompetition, competitionJwtToken])

  useEffect(() => {
    if (view !== 'ranking') return
    if (!selectedCompetition) return
    if (!competitionJwtToken) return
    let disposed = false
    const requestId = rankingRequestRef.current + 1
    rankingRequestRef.current = requestId

    void (async () => {
      setRankingLoading(true)
      setRankingError('')
      try {
        const res = await fetchCompetitionRankingList(
          competitionJwtToken,
          rankingPage,
          50,
        )
        if (disposed) return
        if (rankingRequestRef.current !== requestId) return
        if (!res.ok || !res.data) {
          setRankingData(null)
          setRankingError(res.data?.message ?? '获取比赛排名失败')
          return
        }
        if (typeof res.data.code === 'number' && res.data.code !== 200) {
          setRankingData(null)
          setRankingError(res.data.message ?? '获取比赛排名失败')
          return
        }
        setRankingData(res.data.data ?? null)
      } catch {
        if (disposed) return
        if (rankingRequestRef.current !== requestId) return
        setRankingData(null)
        setRankingError('网络错误，请稍后重试')
      } finally {
        if (!disposed && rankingRequestRef.current === requestId) {
          setRankingLoading(false)
        }
      }
    })()

    return () => {
      disposed = true
    }
  }, [view, selectedCompetition, competitionJwtToken, rankingPage, rankingReloadKey])

  useEffect(() => {
    if (competitionProblems.length === 0) {
      setActiveCompetitionProblemId(null)
      return
    }
    if (
      activeCompetitionProblemId === null ||
      !competitionProblems.some((p) => p.problem_id === activeCompetitionProblemId)
    ) {
      setActiveCompetitionProblemId(competitionProblems[0].problem_id)
    }
  }, [competitionProblems, activeCompetitionProblemId])

  useEffect(() => {
    if (view !== 'running') return
    if (!competitionJwtToken) return
    if (activeCompetitionProblemId === null) {
      setCompetitionProblemDetail(null)
      setCompetitionProblemDetailError('')
      setCompetitionProblemDetailLoading(false)
      return
    }
    void loadCompetitionProblemDetail(competitionJwtToken, activeCompetitionProblemId)
  }, [view, competitionJwtToken, activeCompetitionProblemId])

  async function loadCompetitionProblemDetail(token: string, problemId: number) {
    const requestId = competitionProblemDetailRequestRef.current + 1
    competitionProblemDetailRequestRef.current = requestId
    setCompetitionProblemDetailLoading(true)
    setCompetitionProblemDetailError('')
    try {
      const res = await fetchUserCompetitionProblemDetail(token, problemId)
      if (competitionProblemDetailRequestRef.current !== requestId) return
      if (!res.ok || !res.data) {
        setCompetitionProblemDetail(null)
        setCompetitionProblemDetailError(res.data?.message ?? '获取题目详情失败')
        return
      }
      if (typeof res.data.code === 'number' && res.data.code !== 200) {
        setCompetitionProblemDetail(null)
        setCompetitionProblemDetailError(res.data.message ?? '获取题目详情失败')
        return
      }
      setCompetitionProblemDetail(res.data.data ?? null)
    } catch {
      if (competitionProblemDetailRequestRef.current !== requestId) return
      setCompetitionProblemDetail(null)
      setCompetitionProblemDetailError('网络错误，请稍后重试')
    } finally {
      if (competitionProblemDetailRequestRef.current === requestId) {
        setCompetitionProblemDetailLoading(false)
      }
    }
  }

  function renderCompetitionDetail() {
    if (!selectedCompetition) {
      return <div className="page-message">未找到比赛信息</div>
    }
    const startAt = new Date(selectedCompetition.start_time).getTime()
    const endAt = new Date(selectedCompetition.end_time).getTime()
    const nowMs = now
    const canStart = nowMs >= startAt && nowMs < endAt
    let statusText = ''
    if (Number.isFinite(startAt) && Number.isFinite(endAt)) {
      if (nowMs < startAt) {
        statusText = `距离开始还有 ${formatDuration(startAt - nowMs)}`
      } else if (nowMs >= startAt && nowMs < endAt) {
        statusText = `距离结束还有 ${formatDuration(endAt - nowMs)}`
      } else {
        statusText = '比赛已结束'
      }
    }

    return (
      <div className="competition-detail">
        <div className="competition-detail-main">
          <div className="competition-detail-title">
            {selectedCompetition.name}
          </div>
          <div className="competition-detail-meta">
            <span className="competition-time">
              <span className="competition-time-icon">⏱</span>
              <span className="competition-time-label">开始时间</span>
              <span className="competition-time-value">
                {formatDateTimeText(selectedCompetition.start_time)}
              </span>
            </span>
            <span className="competition-detail-separator" />
            <span className="competition-time">
              <span className="competition-time-icon">🏁</span>
              <span className="competition-time-label">结束时间</span>
              <span className="competition-time-value">
                {formatDateTimeText(selectedCompetition.end_time)}
              </span>
            </span>
          </div>
          {startError && (
            <div className="competition-detail-error">{startError}</div>
          )}
          <div className="competition-detail-actions">
            <button
              type="button"
              className="competition-detail-start"
              onClick={handleStartCompetition}
              disabled={!canStart || startLoading}
            >
              {startLoading ? '开始中…' : '开始比赛'}
            </button>
            {statusText && (
              <span className="competition-detail-status">{statusText}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  function renderRunningPage() {
    if (!selectedCompetition) {
      return <div className="page-message">未找到比赛信息</div>
    }

    const hasActiveProblem = activeCompetitionProblemId !== null
    const statementTitle =
      competitionProblemDetail?.title ||
      competitionProblems.find((p) => p.problem_id === activeCompetitionProblemId)
        ?.problem_title ||
      ''
    const codeLineCount = Math.max(1, codeDraft.split(/\r?\n/u).length)
    const gutterDigits = Math.max(2, String(codeLineCount).length)
    const gutterText = Array.from(
      { length: codeLineCount },
      (_, idx) => idx + 1,
    ).join('\n')
    const codeLineHeightPx = Math.round(codeFontSize * 1.6)

    return (
      <div className="oj-running-layout">
        <div className="oj-running-sidebar">
          <div className="oj-problem-sidebar-plain">
            {competitionProblemsLoading && (
              <div className="competition-empty">正在加载比赛题目列表…</div>
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
              <div className="oj-problem-list">
                {competitionProblems.map((p) => (
                  <button
                    key={p.problem_id}
                    type="button"
                    className={
                      'oj-problem-item' +
                      (problemAcceptedMap[p.problem_id] ? ' oj-problem-item-accepted' : '') +
                      (p.problem_id === activeCompetitionProblemId
                        ? ' oj-problem-item-active'
                        : '')
                    }
                    onClick={() => handleSelectProblem(p.problem_id)}
                    title={p.problem_title}
                    aria-label={`查看题目 ${p.problem_id}`}
                  >
                    <span className="oj-problem-title">{p.problem_title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="oj-running-main">
          <div className="oj-card oj-card-compact oj-problem-statement-card">
            <div className="oj-card-title">
              {hasActiveProblem && statementTitle ? statementTitle : '题目展示'}
            </div>
            {competitionProblemsLoading ? (
              <div className="competition-empty">正在加载比赛题目列表…</div>
            ) : competitionProblemsError ? (
              <div className="competition-error">{competitionProblemsError}</div>
            ) : !hasActiveProblem ? (
              <div className="competition-empty">当前比赛暂无题目</div>
            ) : competitionProblemDetailLoading ? (
              <div className="competition-empty">正在加载题目详情…</div>
            ) : competitionProblemDetailError ? (
              <div className="competition-error">{competitionProblemDetailError}</div>
            ) : !competitionProblemDetail ? (
              <div className="competition-empty">未获取到题目详情</div>
            ) : (
              <>
                <div className="oj-problem-statement-meta">
                  <span>
                    时间限制：
                    <span className="oj-problem-statement-meta-value">
                      {competitionProblemDetail.time_limit}ms
                    </span>
                  </span>
                  <span className="oj-nav-dot" />
                  <span>
                    内存限制：
                    <span className="oj-problem-statement-meta-value">
                      {competitionProblemDetail.memory_limit}MB
                    </span>
                  </span>
                </div>
                <div className="oj-problem-statement-description">
                  {renderProblemDescription(competitionProblemDetail.description)}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="oj-running-editor">
          <div className="oj-card oj-card-compact oj-code-card">
            <div className="oj-editor-toolbar">
              <div className="oj-editor-toolbar-left">
                <span className="oj-editor-label">语言</span>
                <div
                  className="problem-sort-select-wrapper"
                  ref={codeLanguageDropdownRef}
                >
                  <button
                    type="button"
                    className={
                      'problem-sort-select oj-editor-language-select' +
                      (codeLanguageDropdownOpen
                        ? ' problem-sort-select-open'
                        : '')
                    }
                    onClick={() => {
                      if (!hasActiveProblem) return
                      setCodeLanguageDropdownOpen((prev) => !prev)
                      setCodeFontDropdownOpen(false)
                    }}
                    disabled={!hasActiveProblem}
                    aria-haspopup="menu"
                    aria-expanded={codeLanguageDropdownOpen}
                  >
                    {codeLanguage === 'cpp'
                      ? 'C++'
                      : codeLanguage === 'c'
                        ? 'C'
                        : codeLanguage === 'java'
                          ? 'Java'
                          : codeLanguage === 'python'
                            ? 'Python'
                            : 'Go'}
                  </button>
                  {codeLanguageDropdownOpen && (
                    <div className="problem-sort-menu problem-sort-menu-left problem-sort-menu-match-trigger">
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (codeLanguage === 'cpp'
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          setCodeLanguage('cpp')
                          setCodeLanguageDropdownOpen(false)
                        }}
                      >
                        C++
                      </button>
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (codeLanguage === 'c'
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          setCodeLanguage('c')
                          setCodeLanguageDropdownOpen(false)
                        }}
                      >
                        C
                      </button>
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (codeLanguage === 'java'
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          setCodeLanguage('java')
                          setCodeLanguageDropdownOpen(false)
                        }}
                      >
                        Java
                      </button>
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (codeLanguage === 'python'
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          setCodeLanguage('python')
                          setCodeLanguageDropdownOpen(false)
                        }}
                      >
                        Python
                      </button>
                      <button
                        type="button"
                        className={
                          'problem-sort-menu-item' +
                          (codeLanguage === 'go'
                            ? ' problem-sort-menu-item-active'
                            : '')
                        }
                        onClick={() => {
                          setCodeLanguage('go')
                          setCodeLanguageDropdownOpen(false)
                        }}
                      >
                        Go
                      </button>
                    </div>
                  )}
                </div>
                <span className="oj-editor-label">字号</span>
                <div
                  className="problem-sort-select-wrapper"
                  ref={codeFontDropdownRef}
                >
                  <button
                    type="button"
                    className={
                      'problem-sort-select oj-editor-font-select' +
                      (codeFontDropdownOpen
                        ? ' problem-sort-select-open'
                        : '')
                    }
                    onClick={() => {
                      if (!hasActiveProblem) return
                      setCodeFontDropdownOpen((prev) => !prev)
                      setCodeLanguageDropdownOpen(false)
                    }}
                    disabled={!hasActiveProblem}
                    aria-haspopup="menu"
                    aria-expanded={codeFontDropdownOpen}
                  >
                    {codeFontSize}
                  </button>
                  {codeFontDropdownOpen && (
                    <div className="problem-sort-menu problem-sort-menu-left problem-sort-menu-match-trigger">
                      {[12, 13, 14, 15, 16].map((size) => (
                        <button
                          key={`font-${size}`}
                          type="button"
                          className={
                            'problem-sort-menu-item' +
                            (codeFontSize === size
                              ? ' problem-sort-menu-item-active'
                              : '')
                          }
                          onClick={() => {
                            setCodeFontSize(size)
                            setCodeFontDropdownOpen(false)
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="oj-editor-toolbar-right">
                <button
                  type="button"
                  className="oj-editor-btn"
                  onClick={() => setCodeDraft('')}
                  disabled={!hasActiveProblem || codeDraft.length === 0}
                >
                  清空
                </button>
                <button
                  type="button"
                  className="oj-editor-btn"
                  onClick={() => void handleFormatCode()}
                  disabled={!hasActiveProblem || codeDraft.length === 0 || formatting}
                >
                  {formatting ? '格式化中…' : '格式化'}
                </button>
                <button
                  type="button"
                  className="oj-editor-btn"
                  onClick={() => {
                    if (!hasActiveProblem) return
                    if (!competitionJwtToken) return
                    setLatestSubmissionOpen(true)
                    void loadLatestSubmission()
                  }}
                  disabled={!hasActiveProblem || !competitionJwtToken}
                >
                  上次提交
                </button>
                <button
                  type="button"
                  className="oj-editor-btn oj-editor-btn-primary"
                  onClick={() => void handleSubmitCode()}
                  disabled={
                    !hasActiveProblem ||
                    submitting ||
                    codeDraft.trim().length === 0
                  }
                >
                  {submitting ? '提交中…' : '提交'}
                </button>
              </div>
            </div>
            {formatError && <div className="competition-error">{formatError}</div>}
            {submitError && <div className="competition-error">{submitError}</div>}
            {submitStatus && (
              <div className="competition-detail-status">{submitStatus}</div>
            )}
            <AdminCompetitionAlertModal
              open={submitQueueModalOpen}
              title="提示"
              message="已有任务在队列中，请稍后再试"
              onClose={() => setSubmitQueueModalOpen(false)}
            />
            <AdminCompetitionAlertModal
              open={competitionEndedModalOpen}
              title="提示"
              message={competitionEndedMessage || '比赛已结束'}
              onClose={handleCompetitionEndedAcknowledge}
            />
            {latestSubmissionOpen && (
              <div
                className="oj-modal-overlay"
                onClick={() => {
                  setLatestSubmissionOpen(false)
                }}
              >
                <div
                  className="oj-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label="上次提交记录"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <div className="oj-modal-header">
                    <div className="oj-modal-title">上次提交记录</div>
                  </div>
                  <div className="oj-modal-body">
                    {latestSubmissionError && (
                      <div className="competition-error">{latestSubmissionError}</div>
                    )}
                    {latestSubmission && (
                      <>
                        {(() => {
                          const pendingJudge =
                            latestSubmission.time_used < 0 && latestSubmission.memory_used < 0
                          const timeUsedText = pendingJudge
                            ? '--'
                            : `${latestSubmission.time_used} ms`
                          const memoryUsedText = pendingJudge
                            ? '--'
                            : `${latestSubmission.memory_used} KB`
                          return (
                            <div className="oj-submission-meta-grid">
                              <div className="oj-submission-meta-col">
                                <div className="oj-submission-meta-item">
                                  语言：{formatSubmissionLanguage(latestSubmission.language)}
                                </div>
                                <div className="oj-submission-meta-item">
                                  状态：{formatSubmissionStatus(latestSubmission.status)}
                                </div>
                                <div className="oj-submission-meta-item">
                                  时间：
                                  {formatDateTimeTextWithMs(latestSubmission.created_at)}
                                </div>
                              </div>
                              <div className="oj-submission-meta-col">
                                <div className="oj-submission-meta-item">
                                  用时：{timeUsedText}
                                </div>
                                <div className="oj-submission-meta-item">
                                  内存：{memoryUsedText}
                                </div>
                                <div className="oj-submission-meta-item">
                                  结果：
                                  <span
                                    className={
                                      'oj-result-pill' +
                                      (latestSubmission.status !== 2 ||
                                      latestSubmission.result === 0
                                        ? ' oj-result-pill-pending'
                                        : latestSubmission.result === 1
                                          ? ' oj-result-pill-accepted'
                                          : ' oj-result-pill-rejected')
                                    }
                                  >
                                    {formatSubmissionResult(latestSubmission.result)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                        {latestSubmission.stderr && (
                          <>
                            <div className="oj-modal-section-title">标准错误输出</div>
                            <pre className="oj-modal-pre">{latestSubmission.stderr}</pre>
                          </>
                        )}
                        <div className="oj-modal-section-title">提交代码</div>
                        <pre className="oj-modal-pre">{latestSubmission.code}</pre>
                      </>
                    )}
                  </div>
                  <div className="oj-modal-footer">
                    <button
                      type="button"
                      className="oj-editor-btn"
                      onClick={() => void loadLatestSubmission()}
                      disabled={latestSubmissionLoading}
                    >
                      {latestSubmissionLoading ? '刷新中…' : '刷新'}
                    </button>
                    <button
                      type="button"
                      className="oj-editor-btn"
                      onClick={() => setLatestSubmissionOpen(false)}
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            )}
              <div className="oj-editor-wrapper">
              <div className="oj-editor-gutter"
                ref={codeGutterRef}
                aria-hidden="true"
                style={{
                  ['--oj-editor-gutter-digits' as never]: gutterDigits,
                  fontSize: `${codeFontSize}px`,
                  lineHeight: `${codeLineHeightPx}px`,
                }}
              >
                {gutterText}
              </div>
              <div
                className="oj-editor-code-area"
                style={{
                  fontSize: `${codeFontSize}px`,
                  lineHeight: `${codeLineHeightPx}px`,
                }}
              >
                <pre
                  className="oj-editor-highlight"
                  ref={codeHighlightRef}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: highlightHtml }}
                >
                </pre>
                <textarea
                  ref={codeEditorRef}
                  className="oj-code-editor oj-editor-textarea"
                  placeholder="在此输入代码"
                  value={codeDraft}
                  onChange={(e) => {
                    const next = e.target.value
                    const start = e.target.selectionStart ?? 0
                    const end = e.target.selectionEnd ?? 0
                    const nextSelection = { start, end }
                    selectionRef.current = nextSelection
                    setSelection(nextSelection)
                    setCodeDraft(next)
                    scheduleHighlightUpdate(next, nextSelection, codeLanguage)
                  }}
                  onSelect={handleEditorSelectionChange}
                  onMouseUp={handleEditorSelectionChange}
                  onMouseMove={(e) => {
                    if (e.buttons !== 1) return
                    handleEditorSelectionChange()
                  }}
                  onKeyUp={handleEditorSelectionChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      const el = e.currentTarget
                      const start = el.selectionStart ?? 0
                      const end = el.selectionEnd ?? 0
                      const indent = '    '
                      const current = codeDraftRef.current
                      const next = current.slice(0, start) + indent + current.slice(end)
                      const nextSelection = {
                        start: start + indent.length,
                        end: start + indent.length,
                      }
                      selectionRef.current = nextSelection
                      setSelection(nextSelection)
                      setCodeDraft(next)
                      scheduleHighlightUpdate(next, nextSelection, codeLanguage)
                      requestAnimationFrame(() => {
                        el.selectionStart = start + indent.length
                        el.selectionEnd = start + indent.length
                      })
                      return
                    }
                    handleEditorSelectionChange()
                  }}
                  onScroll={(e) => {
                    if (codeGutterRef.current) {
                      codeGutterRef.current.scrollTop = e.currentTarget.scrollTop
                    }
                    if (codeHighlightRef.current) {
                      codeHighlightRef.current.scrollLeft = e.currentTarget.scrollLeft
                      codeHighlightRef.current.scrollTop = e.currentTarget.scrollTop
                    }
                  }}
                  disabled={!hasActiveProblem}
                  wrap="off"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderCompetitionRankingPage() {
    if (!selectedCompetition) {
      return <div className="page-message">未找到比赛信息</div>
    }
    if (!competitionJwtToken) {
      return <div className="page-message">缺少比赛令牌</div>
    }

    const pageSize = rankingData?.page_size ?? 50
    const total = rankingData?.total ?? 0
    const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1

    const problemDefs =
      competitionProblems.length > 0
        ? competitionProblems.map((p, idx) => ({
            problemId: p.problem_id,
            label: formatProblemLabel(idx),
            title: p.problem_title,
          }))
        : (() => {
            const ids = new Set<number>()
            rankingData?.list?.forEach((u) => {
              u.problems.forEach((p) => ids.add(p.problem_id))
            })
            return Array.from(ids)
              .sort((a, b) => a - b)
              .map((problemId, idx) => ({
                problemId,
                label: formatProblemLabel(idx),
                title: String(problemId),
              }))
          })()

    function formatProblemLabel(index: number) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      let n = index
      let out = ''
      while (n >= 0) {
        out = letters[n % 26] + out
        n = Math.floor(n / 26) - 1
      }
      return out || String(index + 1)
    }

    function renderProblemCell(
      info:
        | CompetitionRankingListData['list'][number]['problems'][number]
        | undefined,
    ) {
      const result = info?.result ?? 0
      const retries = info?.retries ?? 0
      const acceptedAt = info?.accepted_at ?? 0
      const isFastest = Boolean(info?.is_fastest)
      const isAccepted = result === 2
      const isTried = result === 1
      const retriesText = `(${retries})`

      const className =
        'oj-rank-cell' +
        (isFastest
          ? ' oj-rank-cell-fastest'
          : isAccepted
            ? ' oj-rank-cell-accepted'
            : isTried
              ? ' oj-rank-cell-tried'
              : ' oj-rank-cell-none')

      const title = isAccepted
        ? `通过时间 ${formatDuration(acceptedAt)}，重试${retriesText}` +
          (isFastest ? '（最快通过）' : '')
        : isTried
          ? `尝试中，重试${retriesText}`
          : '未提交'

      return (
        <td className={className} title={title}>
          {isAccepted ? (
            <div className="oj-rank-cell-inner">
              <div className="oj-rank-cell-main">{formatDuration(acceptedAt)}</div>
              <div className="oj-rank-cell-sub">
                {isFastest ? `最快 ${retriesText}` : retriesText}
              </div>
            </div>
          ) : isTried ? (
            <div className="oj-rank-cell-inner">
              <div className="oj-rank-cell-main">尝试</div>
              <div className="oj-rank-cell-sub">{retriesText}</div>
            </div>
          ) : (
            <div className="oj-rank-cell-inner">
              <div className="oj-rank-cell-main">-</div>
              <div className="oj-rank-cell-sub" />
            </div>
          )}
        </td>
      )
    }

    return (
      <div className="oj-ranking-page">
        <div className="oj-card oj-ranking-card">
          <div className="oj-ranking-header">
            <div className="oj-ranking-title">比赛排名</div>
            <div className="oj-ranking-actions">
              <button
                type="button"
                className="oj-ranking-action-btn"
                onClick={() => setRankingReloadKey((prev) => prev + 1)}
                disabled={rankingLoading}
              >
                {rankingLoading ? '刷新中…' : '刷新'}
              </button>
              <button
                type="button"
                className="oj-ranking-action-btn"
                onClick={() => setRankingPage((prev) => Math.max(1, prev - 1))}
                disabled={rankingLoading || rankingPage <= 1}
              >
                上一页
              </button>
              <div className="oj-ranking-page-indicator">
                {rankingPage} / {totalPages}
              </div>
              <button
                type="button"
                className="oj-ranking-action-btn"
                onClick={() =>
                  setRankingPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={rankingLoading || rankingPage >= totalPages}
              >
                下一页
              </button>
            </div>
          </div>

          {rankingError && <div className="competition-error">{rankingError}</div>}
          {!rankingError && rankingLoading && (
            <div className="competition-empty">正在加载比赛排名…</div>
          )}
          {!rankingError && !rankingLoading && (!rankingData || rankingData.list.length === 0) && (
            <div className="competition-empty">暂无排名数据</div>
          )}

          {!rankingError && rankingData && rankingData.list.length > 0 && (
            <div className="oj-ranking-table-wrapper">
              <table className="oj-ranking-table">
                <thead>
                  <tr>
                    <th className="oj-ranking-th-rank">#</th>
                    <th className="oj-ranking-th-user">用户</th>
                    <th className="oj-ranking-th-solved">通过</th>
                    <th className="oj-ranking-th-time">用时</th>
                    {problemDefs.map((p) => (
                      <th key={p.problemId} className="oj-ranking-th-problem" title={p.title}>
                        {p.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankingData.list.map((u, idx) => {
                    const problemMap = new Map<number, typeof u.problems[number]>()
                    u.problems.forEach((p) => {
                      problemMap.set(p.problem_id, p)
                    })
                    return (
                      <tr key={u.user_id}>
                        <td className="oj-ranking-td-rank">
                          {(rankingData.page - 1) * rankingData.page_size + idx + 1}
                        </td>
                        <td className="oj-ranking-td-user">
                          <div className="oj-ranking-user-main">
                            <span className="oj-ranking-realname">{u.realname}</span>
                            <span className="oj-ranking-username">{u.username}</span>
                          </div>
                        </td>
                        <td className="oj-ranking-td-solved">{u.total_accepted}</td>
                        <td className="oj-ranking-td-time">
                          {formatDuration(u.total_time_used)}
                        </td>
                        {problemDefs.map((p) => renderProblemCell(problemMap.get(p.problemId)))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderContent() {
    if (loading) {
      return <div className="page-message">正在加载用户信息…</div>
    }
    if (error) {
      return <div className="page-error">{error}</div>
    }
    if (!user) {
      return <div className="page-message">未获取到用户信息</div>
    }
    if (user.status !== 0) {
      return <div className="page-error">当前账号已被禁用，请联系管理员</div>
    }
    if (user.role === 1) {
      return (
        <div className="page-message">
          管理员页面占位，后续在此实现管理功能
        </div>
      )
    }
    if (view === 'detail') {
      return renderCompetitionDetail()
    }
    if (view === 'running') {
      return renderRunningPage()
    }
    if (view === 'ranking') {
      return renderCompetitionRankingPage()
    }
    return <CompetitionList onSelect={handleSelectCompetition} />
  }

  return (
    <div className="app-shell">
      <TopNav
        title="Online Judge"
        username={user?.username}
        realname={user?.realname}
        onLogout={onLogout}
        onTitleClick={handleGoHome}
        wide={view === 'running' || view === 'ranking'}
        middle={
          (view === 'running' || view === 'ranking') && selectedCompetition ? (
            <div className="oj-nav-competition">
              <div className="oj-nav-competition-main">
                <div className="oj-nav-competition-title">
                  {selectedCompetition.name}
                </div>
                <div className="oj-nav-competition-times">
                  <span className="oj-nav-competition-time">
                    开始 {formatDateTimeText(selectedCompetition.start_time)}
                  </span>
                  <span className="oj-nav-dot" />
                  <span className="oj-nav-competition-time">
                    结束 {formatDateTimeText(selectedCompetition.end_time)}
                  </span>
                </div>
              </div>
              <div className="oj-nav-countdown">
                {(() => {
                  const displayMs =
                    remainingBaseMs !== null && remainingSyncAt !== null
                      ? Math.max(0, remainingBaseMs - (now - remainingSyncAt))
                      : null
                  return (
                    <>
                      <div className="oj-nav-countdown-row">
                        <div className="oj-nav-countdown-label">距离比赛结束还有</div>
                        <div className="oj-nav-countdown-time">
                          {displayMs === null
                            ? '等待同步…'
                            : formatRemainingText(displayMs)}
                        </div>
                      </div>
                      {timeEventStatus && (
                        <div className="oj-nav-countdown-status">{timeEventStatus}</div>
                      )}
                    </>
                  )
                })()}
              </div>
              <button
                type="button"
                className="oj-nav-rank-btn"
                onClick={() => {
                  if (view === 'running') {
                    setRankingPage(1)
                    setRankingReloadKey((prev) => prev + 1)
                    setView('ranking')
                  } else {
                    setView('running')
                  }
                }}
                aria-label={view === 'running' ? '查看比赛排名' : '返回做题'}
              >
                {view === 'running' ? '查看比赛排名' : '返回做题'}
              </button>
            </div>
          ) : undefined
        }
      />
      <main
        className={
          'page-container' +
          (view === 'running' || view === 'ranking' ? ' page-container-wide' : '')
        }
      >
        <div
          className={
            'page-content' +
            (view === 'running' || view === 'ranking' ? ' page-content-fill' : '')
          }
        >
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
