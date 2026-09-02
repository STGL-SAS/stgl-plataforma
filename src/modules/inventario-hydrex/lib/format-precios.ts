import { formatCOP } from './motor-calculo'
import { descuentoFractionToPctUi } from './descuento-pct'
import type { PrecioRow } from './tipos'

export function formatPreciosCompacto(precios: PrecioRow[]): string {
  if (precios.length === 0) return '—'
  return precios
    .map((p) => {
      const precio = formatCOP(p.precio_unitario)
      if (p.tipo_precio === 'distribuidor') {
        const desde = p.cantidad_min > 0 ? ` desde ${p.cantidad_min}u` : ''
        const hasta = p.cantidad_max != null ? ` hasta ${p.cantidad_max}u` : ''
        return `${p.tipo_precio}: ${precio}${desde}${hasta}`
      }
      if (p.tipo_precio === 'caja' && p.descuento_pct > 0) {
        return `${p.tipo_precio}: ${precio} (dto. ${descuentoFractionToPctUi(p.descuento_pct)}%)`
      }
      return `${p.tipo_precio}: ${precio}`
    })
    .join(' · ')
}
