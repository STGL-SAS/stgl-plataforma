'use client'

import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { useTareas } from '../hooks/useTareas'
import type { NegocioOption, SocioOption, TareaRow } from '../types'
import { TareaFormModal } from './TareaFormModal'
import { TareasBoard } from './TareasBoard'
import { TareasList } from './TareasList'

interface Props {
  negocios: NegocioOption[]
  socios: SocioOption[]
  initialNegocioId?: string
  /** Si se define, oculta el selector y fija el filtro a este negocio. */
  lockedNegocioId?: string
  /** Por defecto muestra solo pendiente/en curso/esperando cuando está bloqueado. */
  defaultSoloAbiertas?: boolean
}

const ESTADOS_ABIERTAS = ['pendiente', 'en_curso', 'esperando'] as const

export function TareasPageClient({
  negocios,
  socios,
  initialNegocioId = '',
  lockedNegocioId,
  defaultSoloAbiertas = false,
}: Props) {
  const [negocioId, setNegocioId] = useState(lockedNegocioId ?? initialNegocioId)
  const [soloAbiertas, setSoloAbiertas] = useState(defaultSoloAbiertas)
  const [vista, setVista] = useState<'tablero' | 'lista'>('tablero')
  const [showForm, setShowForm] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const effectiveNegocioId = lockedNegocioId ?? negocioId
  const { tareas, loading, error, reload } = useTareas(effectiveNegocioId)

  const tareasVisibles = soloAbiertas
    ? tareas.filter((t) => ESTADOS_ABIERTAS.includes(t.estado as (typeof ESTADOS_ABIERTAS)[number]))
    : tareas

  const negocioDefault = useMemo(
    () => effectiveNegocioId || negocios.find((n) => n.codigo === 'STGL')?.id || negocios[0]?.id || '',
    [effectiveNegocioId, negocios]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        {!lockedNegocioId && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--cmd-text)]">Negocio</span>
            <select
              className="rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel)] px-3 py-2 text-[var(--cmd-text)]"
              value={negocioId}
              onChange={(e) => setNegocioId(e.target.value)}
            >
              <option value="">Todos</option>
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        {(lockedNegocioId || defaultSoloAbiertas) && (
          <label className="flex items-center gap-2 text-sm text-[var(--cmd-text-muted)]">
            <input
              type="checkbox"
              checked={soloAbiertas}
              onChange={(e) => setSoloAbiertas(e.target.checked)}
              className="rounded border-[var(--cmd-border)]"
            />
            Solo abiertas
          </label>
        )}
        <div className="flex rounded-md border border-[var(--cmd-border)] text-sm">
          {(['tablero', 'lista'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={cn(
                'px-3 py-2 capitalize transition-colors',
                vista === v
                  ? 'bg-[var(--cmd-panel-hover)] text-[var(--cmd-text)]'
                  : 'text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)]'
              )}
              onClick={() => setVista(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)] px-4 py-2 text-sm font-medium text-[var(--cmd-text)] hover:bg-[var(--cmd-panel)]"
        >
          <Plus className="h-4 w-4" />
          Nueva
        </button>
      </div>

      {banner && (
        <p className="rounded-md border border-[var(--cmd-hangarc)]/30 bg-[var(--cmd-hangarc)]/10 px-3 py-2 text-sm text-[var(--cmd-text)]">
          {banner}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-[var(--cmd-decline)]/30 bg-[var(--cmd-decline)]/10 px-3 py-2 text-sm text-[var(--cmd-decline)]">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-[var(--cmd-text-muted)]">Cargando…</p>}
      {!loading && vista === 'tablero' && <TareasBoard tareas={tareasVisibles} />}
      {!loading && vista === 'lista' && <TareasList tareas={tareasVisibles} />}

      <TareaFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={(_t: TareaRow, warning) => {
          setBanner(warning ?? null)
          void reload()
        }}
        negocios={negocios}
        socios={socios}
        defaultNegocioId={negocioDefault}
      />
    </div>
  )
}
