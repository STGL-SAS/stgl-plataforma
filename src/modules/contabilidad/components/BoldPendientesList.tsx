'use client'

import type { Transaccion } from '../types'
import { diasDesde, formatCOP, formatFecha } from '../utils'

interface Props {
  transacciones: Transaccion[]
  onClasificar: (t: Transaccion) => void
}

export function BoldPendientesList({ transacciones, onClasificar }: Props) {
  if (transacciones.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
        No hay transacciones Bold pendientes de clasificar.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
      {transacciones.map((t) => {
        const dias = diasDesde(t.fecha)
        const antigua = dias >= 7

        return (
          <li
            key={t.id}
            className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${antigua ? 'bg-amber-50/60' : ''}`}
          >
            <div>
              <p className="font-medium text-zinc-900">
                {t.nombre_original ?? 'Sin descripción Bold'}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {formatFecha(t.fecha)} · {formatCOP(t.monto)}
                {antigua && (
                  <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-900">
                    {dias} días sin clasificar
                  </span>
                )}
              </p>
              {t.origen_referencia_id && (
                <p className="mt-1 text-xs text-zinc-400">
                  ID Bold: {t.origen_referencia_id}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onClasificar(t)}
              className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Clasificar
            </button>
          </li>
        )
      })}
    </ul>
  )
}
