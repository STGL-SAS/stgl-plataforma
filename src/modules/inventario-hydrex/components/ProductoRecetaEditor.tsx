'use client'

import { useMemo } from 'react'
import type { HydrexInsumo, HydrexProducto } from '../lib/tipos'
import { formatInsumoLabel, formatProductoLabel } from '../lib/format-receta'
import { NumberInput } from '@/components/NumberInput'

export type RecetaLineaTipo = 'insumo' | 'producto'

export type RecetaLineaDraft = {
  tipo_linea: RecetaLineaTipo
  insumo_id?: string
  componente_producto_id?: string
  cantidad: number
}

interface Props {
  insumos: HydrexInsumo[]
  productos: HydrexProducto[]
  productoIdExcluir?: string
  lineas: RecetaLineaDraft[]
  onChange: (lineas: RecetaLineaDraft[]) => void
}

function newLinea(insumos: HydrexInsumo[]): RecetaLineaDraft {
  const activos = insumos.filter((i) => i.activo)
  return { tipo_linea: 'insumo', insumo_id: activos[0]?.id ?? '', cantidad: 1 }
}

export function ProductoRecetaEditor({
  insumos,
  productos,
  productoIdExcluir,
  lineas,
  onChange,
}: Props) {
  const insumosActivos = insumos.filter((i) => i.activo)
  const productosOpciones = productos.filter(
    (p) => p.activo && p.id !== productoIdExcluir
  )

  const insumosPorTipo = useMemo(() => {
    const map = new Map<
      string,
      { nombre: string; orden: number; insumos: HydrexInsumo[] }
    >()
    for (const insumo of insumosActivos) {
      const key = insumo.tipo_insumo_id
      const entry = map.get(key) ?? {
        nombre: insumo.tipo?.nombre ?? 'Sin categoría',
        orden: insumo.tipo?.orden ?? 999,
        insumos: [],
      }
      entry.insumos.push(insumo)
      map.set(key, entry)
    }
    return [...map.values()].sort((a, b) => a.orden - b.orden)
  }, [insumosActivos])

  function updateLinea(index: number, patch: Partial<RecetaLineaDraft>) {
    onChange(lineas.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function setTipoLinea(index: number, tipo: RecetaLineaTipo) {
    const linea = lineas[index]
    if (!linea) return
    if (tipo === 'insumo') {
      updateLinea(index, {
        tipo_linea: 'insumo',
        insumo_id: insumosActivos[0]?.id ?? '',
        componente_producto_id: undefined,
      })
    } else {
      updateLinea(index, {
        tipo_linea: 'producto',
        componente_producto_id: productosOpciones[0]?.id ?? '',
        insumo_id: undefined,
      })
    }
  }

  function removeLinea(index: number) {
    if (lineas.length <= 1) return
    onChange(lineas.filter((_, i) => i !== index))
  }

  function addLinea() {
    onChange([...lineas, newLinea(insumosActivos)])
  }

  const puedeAgregar = insumosActivos.length > 0 || productosOpciones.length > 0

  return (
    <div className="sm:col-span-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Receta (insumos o productos × cantidad)</span>
        <button
          type="button"
          onClick={addLinea}
          disabled={!puedeAgregar}
          className="text-sm text-blue-600 disabled:opacity-50"
        >
          + agregar línea
        </button>
      </div>

      {!puedeAgregar ? (
        <p className="text-sm text-amber-700">
          No hay insumos ni productos disponibles para armar la receta.
        </p>
      ) : (
        <ul className="space-y-2">
          {lineas.map((linea, index) => (
            <li
              key={index}
              className="grid gap-2 sm:grid-cols-[120px_1fr_120px_auto] items-end rounded-md border border-zinc-200 p-3"
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">Tipo de línea</span>
                <select
                  value={linea.tipo_linea}
                  onChange={(e) => setTipoLinea(index, e.target.value as RecetaLineaTipo)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="insumo">Insumo</option>
                  <option value="producto" disabled={productosOpciones.length === 0}>
                    Producto
                  </option>
                </select>
              </label>

              {linea.tipo_linea === 'insumo' ? (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-zinc-700">Insumo</span>
                  <select
                    value={linea.insumo_id ?? ''}
                    onChange={(e) => updateLinea(index, { insumo_id: e.target.value })}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Seleccionar…</option>
                    {insumosPorTipo.map((grupo) => (
                      <optgroup key={grupo.nombre} label={grupo.nombre}>
                        {grupo.insumos.map((i) => (
                          <option key={i.id} value={i.id}>
                            {formatInsumoLabel(i)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-zinc-700">Producto</span>
                  <select
                    value={linea.componente_producto_id ?? ''}
                    onChange={(e) =>
                      updateLinea(index, { componente_producto_id: e.target.value })
                    }
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Seleccionar…</option>
                    {productosOpciones.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatProductoLabel(p)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

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
  return [newLinea(insumos)]
}

export function recetaLineaToDraft(linea: {
  insumo_id?: string | null
  componente_producto_id?: string | null
  cantidad: number
}): RecetaLineaDraft {
  if (linea.componente_producto_id) {
    return {
      tipo_linea: 'producto',
      componente_producto_id: linea.componente_producto_id,
      cantidad: linea.cantidad,
    }
  }
  return {
    tipo_linea: 'insumo',
    insumo_id: linea.insumo_id ?? '',
    cantidad: linea.cantidad,
  }
}
