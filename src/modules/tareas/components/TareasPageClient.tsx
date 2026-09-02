'use client'

import { useMemo, useState } from 'react'
import { useTareas } from '../hooks/useTareas'
import type { NegocioOption, SocioOption, TareaRow } from '../types'
import { TareaFormModal } from './TareaFormModal'
import { TareasBoard } from './TareasBoard'
import { TareasList } from './TareasList'

interface Props {
  negocios: NegocioOption[]
  socios: SocioOption[]
  initialNegocioId?: string
}

export function TareasPageClient({ negocios, socios, initialNegocioId = '' }: Props) {
  const [negocioId, setNegocioId] = useState(initialNegocioId)
  const [vista, setVista] = useState<'tablero' | 'lista'>('tablero')
  const [showForm, setShowForm] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const { tareas, loading, error, reload } = useTareas(negocioId)

  const negocioDefault = useMemo(
    () => negocioId || negocios.find((n) => n.codigo === 'STGL')?.id || negocios[0]?.id || '',
    [negocioId, negocios]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Negocio</span>
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
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
        <div className="flex rounded-md border border-zinc-300 text-sm">
          <button
            type="button"
            className={`px-3 py-2 ${vista === 'tablero' ? 'bg-zinc-900 text-white' : 'bg-white'}`}
            onClick={() => setVista('tablero')}
          >
            Tablero
          </button>
          <button
            type="button"
            className={`px-3 py-2 ${vista === 'lista' ? 'bg-zinc-900 text-white' : 'bg-white'}`}
            onClick={() => setVista('lista')}
          >
            Lista
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          + Nueva
        </button>
      </div>

      {banner && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{banner}</p>
      )}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-zinc-500">Cargando…</p>}
      {!loading && vista === 'tablero' && <TareasBoard tareas={tareas} />}
      {!loading && vista === 'lista' && <TareasList tareas={tareas} />}

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
