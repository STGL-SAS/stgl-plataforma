'use client'

import { calcularGananciaVenta, formatCOP } from '../motor-calculo'
import type { HardtechCompra, HardtechGastoExtra, HardtechVenta } from '../lib/tipos'

interface Props {
  venta: Pick<
    HardtechVenta,
    | 'valor_venta_final'
    | 'propina'
    | 'comision_terceros_pct'
    | 'comision_terceros_monto'
  >
  compras: Pick<HardtechCompra, 'monto_cop_equivalente' | 'agrupada_con'>[]
  gastos: Pick<HardtechGastoExtra, 'monto_cop_equivalente'>[]
}

export function GananciaVentaResumen({ venta, compras, gastos }: Props) {
  const r = calcularGananciaVenta(venta, compras, gastos)
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-sm space-y-1">
      <p className="font-medium text-emerald-900">Resumen de ganancia</p>
      <p>Ingreso total: {formatCOP(r.ingresoTotal)}</p>
      <p>Costo compras: {formatCOP(r.costoCompras)}</p>
      <p>Gastos extra: {formatCOP(r.costoGastosExtra)}</p>
      <p className="font-medium">Ganancia: {formatCOP(r.ganancia)}</p>
      {r.comisionTerceros > 0 && <p>Comisión terceros: {formatCOP(r.comisionTerceros)}</p>}
      <p className="font-semibold text-emerald-800">Ganancia neta: {formatCOP(r.gananciaNeta)}</p>
    </div>
  )
}
