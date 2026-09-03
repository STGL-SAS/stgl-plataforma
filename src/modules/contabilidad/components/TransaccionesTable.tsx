'use client'

import type { Transaccion } from '../types'
import { formatCOP, formatFecha } from '../utils'
import { NegocioRowLabel } from './NegocioRowLabel'

interface Props {
  transacciones: Transaccion[]
  onClasificar?: (t: Transaccion) => void
}

function EstadoBadge({ estado }: { estado: Transaccion['estado'] }) {
  const isClasificada = estado === 'clasificada'
  const label = isClasificada ? 'Clasificada' : 'Pendiente'

  return (
    <span
      className={`cmd-badge inline-flex rounded-full px-2 py-0.5 ${
        isClasificada
          ? 'bg-emerald-500/15 text-emerald-300'
          : 'bg-amber-500/15 text-amber-300'
      }`}
    >
      {label}
    </span>
  )
}

export function TransaccionesTable({ transacciones, onClasificar }: Props) {
  if (transacciones.length === 0) {
    return (
      <p className="cmd-panel border-dashed p-8 text-center text-sm text-[var(--cmd-text-dim)]">
        No hay transacciones con estos filtros.
      </p>
    )
  }

  return (
    <div className="cmd-panel overflow-x-auto">
      <table className="cmd-table min-w-full text-sm">
        <thead className="text-left">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Negocio</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3 text-right">Monto</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Origen</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {transacciones.map((t) => {
            const nombre =
              t.estado === 'clasificada'
                ? t.nombre_interno
                : t.nombre_original ?? t.nombre_interno

            return (
              <tr key={t.id} className="hover:bg-[var(--cmd-panel-hover)]">
                <td className="px-4 py-3 whitespace-nowrap text-[var(--cmd-text-muted)]">
                  {formatFecha(t.fecha)}
                </td>
                <td className="px-4 py-3">
                  {t.negocio?.codigo ? (
                    <NegocioRowLabel
                      codigo={t.negocio.codigo}
                      nombre={t.negocio.nombre ?? t.negocio.codigo}
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 capitalize text-[var(--cmd-text-muted)]">{t.tipo}</td>
                <td className="px-4 py-3 text-[var(--cmd-text-muted)]">{t.categoria ?? '—'}</td>
                <td className="max-w-xs truncate px-4 py-3 text-[var(--cmd-text)]" title={nombre ?? ''}>
                  {nombre ?? '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className="font-label-mono text-[var(--cmd-text)]">{formatCOP(t.monto)}</span>
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={t.estado} />
                </td>
                <td className="px-4 py-3 capitalize text-[var(--cmd-text-muted)]">{t.origen}</td>
                <td className="px-4 py-3">
                  {t.estado === 'pendiente_revision' && onClasificar && (
                    <button
                      type="button"
                      onClick={() => onClasificar(t)}
                      className="text-sm font-medium text-[var(--cmd-stgl)] hover:underline"
                    >
                      Clasificar
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
