import type { TipoPrecio } from './tipos'

export type TipoProducto = 'individual' | 'caja'

const LABELS: Record<TipoPrecio, string> = {
  individual: 'Individual',
  caja: 'Caja',
  distribuidor: 'Distribuidor',
}

export function tiposPrecioPermitidos(tipoProducto: TipoProducto): TipoPrecio[] {
  if (tipoProducto === 'caja') return ['caja']
  return ['individual', 'distribuidor']
}

export function tipoPrecioDefault(tipoProducto: TipoProducto): TipoPrecio {
  return tipoProducto === 'caja' ? 'caja' : 'individual'
}

export function esTipoPrecioPermitido(tipoProducto: TipoProducto, tipoPrecio: string): boolean {
  return tiposPrecioPermitidos(tipoProducto).includes(tipoPrecio as TipoPrecio)
}

export function validarTipoPrecioParaProducto(
  tipoProducto: TipoProducto,
  tipoPrecio: string
): void {
  if (esTipoPrecioPermitido(tipoProducto, tipoPrecio)) return

  const permitidos = tiposPrecioPermitidos(tipoProducto).map((t) => LABELS[t]).join(' o ')
  const recibido = LABELS[tipoPrecio as TipoPrecio] ?? tipoPrecio
  const productoLabel = tipoProducto === 'caja' ? 'caja' : 'individual'

  throw new Error(
    `El tipo de precio "${recibido}" no aplica a un producto tipo ${productoLabel}. Usa: ${permitidos}.`
  )
}

export const TIPO_PRECIO_OPTIONS: { value: TipoPrecio; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'caja', label: 'Caja' },
  { value: 'distribuidor', label: 'Distribuidor' },
]
