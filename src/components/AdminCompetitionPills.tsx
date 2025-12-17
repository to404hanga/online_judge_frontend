import type { CompetitionItem } from '../api/competition'

type CompetitionRuntimeTone = 'upcoming' | 'running' | 'finished'

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

export function renderCompetitionStatusPill(status: number) {
  const text = status === 0 ? '未发布' : status === 1 ? '已发布' : '已删除'
  const toneClass =
    status === 0
      ? 'problem-status-pill-pending'
      : status === 1
        ? 'problem-status-pill-active'
        : 'problem-status-pill-deleted'
  return <span className={`problem-status-pill ${toneClass}`}>{text}</span>
}

export function renderCompetitionRuntimePill(item: CompetitionItem) {
  const tone = getRuntimeStatusTone(item)
  const text = getRuntimeStatusLabel(item)
  if (!text) return null
  const toneClass =
    tone === 'upcoming'
      ? 'competition-runtime-pill-upcoming'
      : tone === 'running'
        ? 'competition-runtime-pill-running'
        : 'competition-runtime-pill-finished'
  return <span className={`competition-runtime-pill ${toneClass}`}>{text}</span>
}

export function renderCompetitionProblemStatusPill(status: number) {
  const effective = status === 1
  const text = effective ? '启用' : '禁用'
  const toneClass = effective
    ? 'problem-status-pill-active'
    : 'problem-status-pill-deleted'
  return <span className={`problem-status-pill ${toneClass}`}>{text}</span>
}
