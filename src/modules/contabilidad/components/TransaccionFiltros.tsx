'use client'

import type { Negocio, TransaccionFiltros } from '../types'

interface Props {
  filtros: TransaccionFiltros
  negocios: Negocio[]
  categorias: string[]
  onChange: (filtros: TransaccionFiltros) => void
}

export function TransaccionFiltros({
  filtros,
  negocios,
  categorias,
  onChange,
}: Props) {
  function update(partial: Partial<TransaccionFiltros>) {
    onChange({ ...filtros, ...partial })
  }

  return (
    <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Estado</span>
        <select
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={filtros.estado ?? ''}
          onChange={(e) =>
            update({ estado: (e.target.value || undefined) as TransaccionFiltros['estado'] })
          }
        >
          <option value="">Todos</option>
          <option value="pendiente_revision">Pendiente revisión</option>
          <option value="clasificada">Clasificada</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Negocio</span>
        <select
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={filtros.negocio_id ?? ''}
          onChange={(e) => update({ negocio_id: e.target.value || undefined })}
        >
          <option value="">Todos</option>
          {negocios.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Categoría</span>
        <select
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={filtros.categoria ?? ''}
          onChange={(e) => update({ categoria: e.target.value || undefined })}
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Desde</span>
        <input
          type="date"
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={filtros.fecha_desde ?? ''}
          onChange={(e) => update({ fecha_desde: e.target.value || undefined })}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Hasta</span>
        <input
          type="date"
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={filtros.fecha_hasta ?? ''}
          onChange={(e) => update({ fecha_hasta: e.target.value || undefined })}
        />
      </label>
    </div>
  )
}
