'use client'

import type { Transaccion } from '../types'
import { formatCOP, formatFecha } from '../utils'

interface Props {
  transacciones: Transaccion[]
  onClasificar?: (t: Transaccion) => void
}

function EstadoBadge({ estado }: { estado: Transaccion['estado'] }) {
  const styles =
    estado === 'clasificada'
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-amber-100 text-amber-800'
  const label = estado === 'clasificada' ? 'Clasificada' : 'Pendiente'

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  )
}

export function TransaccionesTable({ transacciones, onClasificar }: Props) {
  if (transacciones.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
        No hay transacciones con estos filtros.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Fecha</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Negocio</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Tipo</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Categoría</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Nombre</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-600">Monto</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Estado</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">Origen</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {transacciones.map((t) => {
            const nombre =
              t.estado === 'clasificada'
                ? t.nombre_interno
                : t.nombre_original ?? t.nombre_interno

            return (
              <tr key={t.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 whitespace-nowrap">{formatFecha(t.fecha)}</td>
                <td className="px-4 py-3">{t.negocio?.codigo ?? '—'}</td>
                <td className="px-4 py-3 capitalize">{t.tipo}</td>
                <td className="px-4 py-3">{t.categoria ?? '—'}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={nombre ?? ''}>
                  {nombre ?? '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                  {formatCOP(t.monto)}
                </td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={t.estado} />
                </td>
                <td className="px-4 py-3 capitalize">{t.origen}</td>
                <td className="px-4 py-3">
                  {t.estado === 'pendiente_revision' && onClasificar && (
                    <button
                      type="button"
                      onClick={() => onClasificar(t)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
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
