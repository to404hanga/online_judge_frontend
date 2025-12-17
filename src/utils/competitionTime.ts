export const COMPETITION_TIMEZONE_OPTIONS = [
  { label: 'UTC+8', offset: 480 },
  { label: 'UTC', offset: 0 },
] as const

export function toDateTimeLocalValue(source: string, offsetMinutes: number) {
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
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d+)?$/u.exec(
      trimmed,
    )
  if (!match) return ''
  const year = match[1]
  const month = match[2]
  const day = match[3]
  const hours = match[4]
  const minutes = match[5]
  const seconds = match[6]
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export function toRfc3339FromLocal(value: string, offsetMinutes: number) {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/u.exec(
      trimmed,
    )
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
