'use client'

import { cn } from '@/lib/cn'
import {
  DEFAULT_DATE_FILTER,
  type DashboardDateFilter,
  type DatePreset,
} from '@/modules/core/lib/dashboard-date-filter'

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'mes_actual', label: 'Mes actual' },
  { id: 'trimestre_actual', label: 'Trimestre actual' },
  { id: 'anio_actual', label: 'Año actual' },
  { id: 'custom', label: 'Rango personalizado' },
]

const fieldClass =
  'rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel)] px-2 py-1.5 text-sm text-[var(--cmd-text)]'

export function DashboardDateFilterControl({
  value,
  onChange,
}: {
  value: DashboardDateFilter
  onChange: (next: DashboardDateFilter) => void
}) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="cmd-module-nav-scroll -mx-1 overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="flex w-max flex-nowrap rounded-lg border border-[var(--cmd-border)] p-0.5 sm:w-auto sm:flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange({ ...value, preset: p.id })}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                value.preset === p.id
                  ? 'bg-[var(--cmd-panel-hover)] text-[var(--cmd-text)]'
                  : 'text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)]'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {value.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--cmd-text-muted)]">
          <label className="flex items-center gap-1.5">
            Desde
            <input
              type="date"
              className={fieldClass}
              max={value.customTo ?? today}
              value={value.customFrom ?? ''}
              onChange={(e) => onChange({ ...value, customFrom: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-1.5">
            Hasta
            <input
              type="date"
              className={fieldClass}
              min={value.customFrom}
              max={today}
              value={value.customTo ?? today}
              onChange={(e) => onChange({ ...value, customTo: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  )
}

export { DEFAULT_DATE_FILTER }
