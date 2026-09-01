import type { Canal } from '../lib/tipos'
import { CANALES } from '../lib/tipos'

/** Vacío en BD = aplica a todos los canales. */
export function canalesAplicaFromDb(canales?: string[] | null): Canal[] {
  if (!canales?.length) return CANALES.map((c) => c.value)
  return CANALES.filter((c) => canales.includes(c.value)).map((c) => c.value)
}

/** Todos seleccionados → [] (convención “aplica a todos”). */
export function canalesAplicaToDb(selected: Canal[]): string[] {
  if (selected.length === CANALES.length) return []
  return selected
}

export function canalLabel(canal: string): string {
  return CANALES.find((c) => c.value === canal)?.label ?? canal
}

interface Props {
  label: string
  selected: Canal[]
  onChange: (selected: Canal[]) => void
  /** Si se define, solo muestra estos canales (ej. premarcado ⊆ aplica). */
  visibleCanales?: Canal[]
  minSelected?: number
}

export function CanalToggleButtons({
  label,
  selected,
  onChange,
  visibleCanales,
  minSelected = 0,
}: Props) {
  const options = visibleCanales
    ? CANALES.filter((c) => visibleCanales.includes(c.value))
    : CANALES

  function toggle(canal: Canal) {
    const set = new Set(selected)
    if (set.has(canal)) {
      if (selected.length <= minSelected) return
      set.delete(canal)
    } else {
      set.add(canal)
    }
    onChange(CANALES.map((c) => c.value).filter((v) => set.has(v)))
  }

  if (options.length === 0) {
    return (
      <div className="sm:col-span-2">
        <span className="text-sm font-medium">{label}</span>
        <p className="mt-1 text-xs text-zinc-500">Selecciona al menos un canal donde aplica.</p>
      </div>
    )
  }

  return (
    <div className="sm:col-span-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((canal) => {
          const active = selected.includes(canal.value)
          return (
            <button
              key={canal.value}
              type="button"
              onClick={() => toggle(canal.value)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
              }`}
              aria-pressed={active}
            >
              {canal.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CanalChips({ canales }: { canales: string[] }) {
  if (!canales.length) return <span className="text-zinc-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {canales.map((canal) => (
        <span
          key={canal}
          className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700"
        >
          {canalLabel(canal)}
        </span>
      ))}
    </div>
  )
}
