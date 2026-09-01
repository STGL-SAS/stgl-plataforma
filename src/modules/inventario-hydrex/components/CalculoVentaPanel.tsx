'use client'

import type { CalculoVentaResultado } from '../lib/tipos'
import { CALIFICACION_UI } from '../lib/tipos'
import { formatCOP, formatPct } from '../lib/motor-calculo'

interface Props {
  resultado: CalculoVentaResultado | null
}

export function CalculoVentaPanel({ resultado }: Props) {
  if (!resultado) {
    return (
      <p className="text-sm text-zinc-500">Completa los campos para ver el cálculo.</p>
    )
  }

  if (!resultado.costoDisponible) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-900">Costo no disponible</p>
        <p className="mt-1 text-sm text-amber-800">
          Uno o más insumos de este producto aún no tienen compras registradas. Registrá las compras
          en Proveedores para calcular ganancia y margen.
        </p>
      </div>
    )
  }

  const cal = CALIFICACION_UI[resultado.calificacion!]

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-sm font-medium ${cal.className}`}>
          {cal.emoji} {cal.label}
        </span>
        <span className="text-sm text-zinc-600">Margen {formatPct(resultado.margenPct!)}</span>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <span className="text-zinc-500">Costo producto</span>
          <p className="font-medium">{formatCOP(resultado.costoProductoTotal!)}</p>
        </div>
        <div>
          <span className="text-zinc-500">Costo total</span>
          <p className="font-medium">{formatCOP(resultado.costoTotal!)}</p>
        </div>
        <div>
          <span className="text-zinc-500">Ganancia total</span>
          <p className="font-medium">{formatCOP(resultado.gananciaTotal!)}</p>
        </div>
        <div>
          <span className="text-zinc-500">Ganancia / unidad</span>
          <p className="font-medium">{formatCOP(resultado.gananciaPorUnidad!)}</p>
        </div>
      </div>

      {resultado.componentesAplicados.some((c) => c.activo) && (
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Componentes activos</p>
          <ul className="text-xs space-y-0.5">
            {resultado.componentesAplicados
              .filter((c) => c.activo)
              .map((c) => (
                <li key={c.componenteId} className="flex justify-between">
                  <span>{c.nombre}</span>
                  <span>{formatCOP(c.montoAplicado)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
