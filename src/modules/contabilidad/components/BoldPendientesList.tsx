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
      <p className="cmd-panel border-dashed p-8 text-center text-sm text-[var(--cmd-text-dim)]">
        No hay transacciones Bold pendientes de clasificar.
      </p>
    )
  }

  return (
    <ul className="cmd-panel divide-y divide-[var(--cmd-border)]">
      {transacciones.map((t) => {
        const dias = diasDesde(t.fecha)
        const antigua = dias >= 7

        return (
          <li
            key={t.id}
            className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
              antigua ? 'bg-amber-500/5' : ''
            }`}
          >
            <div>
              <p className="font-medium text-[var(--cmd-text)]">
                {t.nombre_original ?? 'Sin descripción Bold'}
              </p>
              <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
                {formatFecha(t.fecha)} ·{' '}
                <span className="font-label-mono">{formatCOP(t.monto)}</span>
                {antigua && (
                  <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-300">
                    {dias} días sin clasificar
                  </span>
                )}
              </p>
              {t.origen_referencia_id && (
                <p className="mt-1 text-xs text-[var(--cmd-text-dim)]">
                  ID Bold: {t.origen_referencia_id}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onClasificar(t)}
              className="shrink-0 rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)] px-4 py-2 text-sm font-medium text-[var(--cmd-text)] transition-colors hover:border-[var(--cmd-stgl)]"
            >
              Clasificar
            </button>
          </li>
        )
      })}
    </ul>
  )
}
