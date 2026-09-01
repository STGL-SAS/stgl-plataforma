'use client'

import type { HydrexInsumo, HydrexProductoInsumo } from '../lib/tipos'
import { formatInsumoLabel } from '../lib/format-receta'
import { NumberInput } from '@/components/NumberInput'

export type RecetaLineaDraft = Pick<HydrexProductoInsumo, 'insumo_id' | 'cantidad'>

interface Props {
  insumos: HydrexInsumo[]
  lineas: RecetaLineaDraft[]
  onChange: (lineas: RecetaLineaDraft[]) => void
}

function newLinea(insumos: HydrexInsumo[]): RecetaLineaDraft {
  return { insumo_id: insumos[0]?.id ?? '', cantidad: 1 }
}

export function ProductoRecetaEditor({ insumos, lineas, onChange }: Props) {
  const insumosActivos = insumos.filter((i) => i.activo)

  function updateLinea(index: number, patch: Partial<RecetaLineaDraft>) {
    onChange(lineas.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function removeLinea(index: number) {
    if (lineas.length <= 1) return
    onChange(lineas.filter((_, i) => i !== index))
  }

  function addLinea() {
    onChange([...lineas, newLinea(insumosActivos)])
  }

  return (
    <div className="sm:col-span-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Receta (insumos × cantidad)</span>
        <button
          type="button"
          onClick={addLinea}
          disabled={insumosActivos.length === 0}
          className="text-sm text-blue-600 disabled:opacity-50"
        >
          + agregar línea
        </button>
      </div>

      {insumosActivos.length === 0 ? (
        <p className="text-sm text-amber-700">No hay insumos activos para armar la receta.</p>
      ) : (
        <ul className="space-y-2">
          {lineas.map((linea, index) => (
            <li
              key={index}
              className="grid gap-2 sm:grid-cols-[1fr_120px_auto] items-end rounded-md border border-zinc-200 p-3"
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">Insumo</span>
                <select
                  value={linea.insumo_id}
                  onChange={(e) => updateLinea(index, { insumo_id: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Seleccionar…</option>
                  {insumosActivos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {formatInsumoLabel(i)}
                      {i.tipo ? ` — ${i.tipo.nombre}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">Cantidad</span>
                <NumberInput
                  emptyWhenZero={false}
                  value={linea.cantidad}
                  onChange={(cantidad) => updateLinea(index, { cantidad: cantidad ?? 0 })}
                  className="text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => removeLinea(index)}
                disabled={lineas.length <= 1}
                className="rounded-md border px-3 py-2 text-sm text-red-600 disabled:opacity-40"
                title="Quitar línea"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function createEmptyRecetaLineas(insumos: HydrexInsumo[]): RecetaLineaDraft[] {
  const activos = insumos.filter((i) => i.activo)
  if (activos.length === 0) return [{ insumo_id: '', cantidad: 1 }]
  return [{ insumo_id: activos[0].id, cantidad: 1 }]
}
