export type DatePreset = 'mes_actual' | 'trimestre_actual' | 'anio_actual' | 'custom'

export type DashboardDateFilter = {
  preset: DatePreset
  customFrom?: string
  customTo?: string
}

export type DateRange = {
  start: Date
  end: Date
  preset: DatePreset
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function quarterStart(d: Date) {
  const q = Math.floor(d.getMonth() / 3)
  return new Date(d.getFullYear(), q * 3, 1)
}

function quarterEnd(d: Date) {
  const q = Math.floor(d.getMonth() / 3)
  return endOfDay(new Date(d.getFullYear(), q * 3 + 3, 0))
}

export function resolveDateRange(filter: DashboardDateFilter, now = new Date()): DateRange {
  const today = startOfDay(now)

  if (filter.preset === 'mes_actual') {
    return {
      preset: 'mes_actual',
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: endOfDay(now),
    }
  }

  if (filter.preset === 'trimestre_actual') {
    return {
      preset: 'trimestre_actual',
      start: quarterStart(today),
      end: endOfDay(now),
    }
  }

  if (filter.preset === 'anio_actual') {
    return {
      preset: 'anio_actual',
      start: new Date(today.getFullYear(), 0, 1),
      end: endOfDay(now),
    }
  }

  const from = filter.customFrom ? startOfDay(new Date(filter.customFrom + 'T12:00:00')) : today
  const to = filter.customTo
    ? endOfDay(new Date(filter.customTo + 'T12:00:00'))
    : endOfDay(now)

  return {
    preset: 'custom',
    start: from <= to ? from : to,
    end: from <= to ? to : from,
  }
}

export function previousPeriodRange(range: DateRange): DateRange | null {
  const { start, end, preset } = range

  if (preset === 'mes_actual') {
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1)
    const prevEnd = endOfDay(new Date(start.getFullYear(), start.getMonth(), 0))
    return { preset, start: prevStart, end: prevEnd }
  }

  if (preset === 'trimestre_actual') {
    const prevEnd = endOfDay(new Date(start.getFullYear(), start.getMonth(), 0))
    const prevStart = quarterStart(prevEnd)
    return { preset, start: prevStart, end: prevEnd }
  }

  if (preset === 'anio_actual') {
    const y = start.getFullYear() - 1
    return {
      preset,
      start: new Date(y, 0, 1),
      end: endOfDay(new Date(y, 11, 31)),
    }
  }

  const durationMs = end.getTime() - start.getTime()
  if (durationMs <= 0) return null
  const prevEnd = endOfDay(new Date(start.getTime() - 86400000))
  const prevStart = startOfDay(new Date(prevEnd.getTime() - durationMs))
  return { preset: 'custom', start: prevStart, end: prevEnd }
}

export function monthOverlapsRange(mesIso: string, range: DateRange): boolean {
  const m = new Date(mesIso.includes('T') ? mesIso : mesIso + 'T12:00:00')
  const monthStart = new Date(m.getFullYear(), m.getMonth(), 1)
  const monthEnd = endOfDay(new Date(m.getFullYear(), m.getMonth() + 1, 0))
  return monthStart <= range.end && monthEnd >= range.start
}

export function dateInRange(iso: string, range: DateRange): boolean {
  const d = new Date(iso.includes('T') ? iso : iso + 'T12:00:00')
  return d >= range.start && d <= range.end
}

export function balancePeriodLabel(preset: DatePreset): string {
  switch (preset) {
    case 'mes_actual':
      return 'Balance mes'
    case 'trimestre_actual':
      return 'Balance trimestre'
    case 'anio_actual':
      return 'Balance año'
    case 'custom':
      return 'Balance período'
  }
}

export function periodSuffix(preset: DatePreset): string {
  switch (preset) {
    case 'mes_actual':
      return 'mes'
    case 'trimestre_actual':
      return 'trimestre'
    case 'anio_actual':
      return 'año'
    case 'custom':
      return 'período'
  }
}

export function growthComparisonLabel(preset: DatePreset): string {
  switch (preset) {
    case 'mes_actual':
      return 'mes vs anterior'
    case 'trimestre_actual':
      return 'trimestre vs anterior'
    case 'anio_actual':
      return 'año vs anterior'
    case 'custom':
      return 'período vs anterior'
  }
}

export const DEFAULT_DATE_FILTER: DashboardDateFilter = { preset: 'mes_actual' }
