'use client'

import type { TipoPrecio } from '../lib/tipos'
import { descuentoFractionToPctUi } from '../lib/descuento-pct'
import {
  tipoPrecioDefault,
  tiposPrecioOpcionesParaProducto,
} from '../lib/validate-tipo-precio'
import { CurrencyInput } from './CurrencyInput'
import { NumberInput } from '@/components/NumberInput'

export type PrecioLineaDraft = {
  tipo_precio: TipoPrecio
  precio_unitario: number
  cantidad_min: number
  cantidad_max: number | null
  descuento_pct_ui: number
}

interface Props {
  tipoProducto: 'individual' | 'caja'
  lineas: PrecioLineaDraft[]
  onChange: (lineas: PrecioLineaDraft[]) => void
}

function newPrecioLinea(tipoProducto: 'individual' | 'caja'): PrecioLineaDraft {
  return {
    tipo_precio: tipoPrecioDefault(tipoProducto),
    precio_unitario: 0,
    cantidad_min: 1,
    cantidad_max: null,
    descuento_pct_ui: 0,
  }
}

export function precioRowToDraft(p: {
  tipo_precio: TipoPrecio
  precio_unitario: number
  cantidad_min: number
  cantidad_max: number | null
  descuento_pct: number
}): PrecioLineaDraft {
  return {
    tipo_precio: p.tipo_precio,
    precio_unitario: p.precio_unitario,
    cantidad_min: p.cantidad_min,
    cantidad_max: p.cantidad_max,
    descuento_pct_ui: descuentoFractionToPctUi(p.descuento_pct),
  }
}

export function ProductoPreciosEditor({ tipoProducto, lineas, onChange }: Props) {
  const tiposOpciones = tiposPrecioOpcionesParaProducto(tipoProducto)

  function updateLinea(index: number, patch: Partial<PrecioLineaDraft>) {
    onChange(lineas.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function setTipoPrecio(index: number, tipo_precio: TipoPrecio) {
    const linea = lineas[index]
    if (!linea) return
    updateLinea(index, {
      tipo_precio,
      cantidad_min: tipo_precio === 'distribuidor' ? linea.cantidad_min || 1 : 1,
      cantidad_max: tipo_precio === 'distribuidor' ? linea.cantidad_max : null,
      descuento_pct_ui: tipo_precio === 'caja' ? linea.descuento_pct_ui : 0,
    })
  }

  function removeLinea(index: number) {
    onChange(lineas.filter((_, i) => i !== index))
  }

  function addLinea() {
    onChange([...lineas, newPrecioLinea(tipoProducto)])
  }

  return (
    <div className="sm:col-span-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Precios</span>
        <button type="button" onClick={addLinea} className="text-sm text-blue-600">
          + agregar precio
        </button>
      </div>

      {lineas.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin precios cargados. Agrega al menos uno si aplica.</p>
      ) : (
        <ul className="space-y-2">
          {lineas.map((linea, index) => (
            <li
              key={index}
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[140px_1fr_120px_120px_120px_auto] items-end rounded-md border border-zinc-200 p-3"
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">Tipo de precio</span>
                <select
                  value={linea.tipo_precio}
                  onChange={(e) => setTipoPrecio(index, e.target.value as TipoPrecio)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  {tiposOpciones.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700">Precio unitario</span>
                <CurrencyInput
                  value={linea.precio_unitario || null}
                  onChange={(precio_unitario) =>
                    updateLinea(index, { precio_unitario: precio_unitario ?? 0 })
                  }
                  className="text-sm"
                />
              </label>

              {linea.tipo_precio === 'distribuidor' && (
                <>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-zinc-700">Cantidad mín.</span>
                    <NumberInput
                      integer
                      min={1}
                      value={linea.cantidad_min}
                      onChange={(cantidad_min) =>
                        updateLinea(index, { cantidad_min: cantidad_min ?? 1 })
                      }
                      className="text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-zinc-700">Cantidad máx.</span>
                    <NumberInput
                      integer
                      min={1}
                      emptyWhenZero
                      value={linea.cantidad_max}
                      onChange={(cantidad_max) => updateLinea(index, { cantidad_max })}
                      className="text-sm"
                      placeholder="Sin tope"
                    />
                  </label>
                </>
              )}

              {linea.tipo_precio === 'caja' && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-zinc-700">Descuento (%)</span>
                  <NumberInput
                    value={linea.descuento_pct_ui || null}
                    onChange={(descuento_pct_ui) =>
                      updateLinea(index, { descuento_pct_ui: descuento_pct_ui ?? 0 })
                    }
                    className="text-sm"
                  />
                  <span className="text-xs text-zinc-500">Ej.: 10 = 10%</span>
                </label>
              )}

              <button
                type="button"
                onClick={() => removeLinea(index)}
                className="rounded-md border px-3 py-2 text-sm text-red-600 sm:col-start-auto"
                title="Quitar precio"
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
