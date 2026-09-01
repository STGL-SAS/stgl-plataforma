import type { HydrexInsumo } from './tipos'

export type RecetaLineaDraftLike = {
  tipo_linea: 'insumo' | 'producto'
  insumo_id?: string
  componente_producto_id?: string
  cantidad: number
}

export type TipoProductoDb = 'individual' | 'caja'

export function esInsumoCategoriaCaja(insumo: HydrexInsumo): boolean {
  return insumo.tipo?.codigo === 'caja'
}

export function findInsumoCategoriaCaja(insumos: HydrexInsumo[]): HydrexInsumo | undefined {
  return insumos.find((i) => i.activo && esInsumoCategoriaCaja(i))
}

function recetaYaTieneInsumoCaja(
  receta: RecetaLineaDraftLike[],
  insumos: HydrexInsumo[]
): boolean {
  const cajaIds = new Set(insumos.filter(esInsumoCategoriaCaja).map((i) => i.id))
  return receta.some(
    (l) => l.tipo_linea === 'insumo' && l.insumo_id != null && cajaIds.has(l.insumo_id)
  )
}

/** Agrega una línea de insumo categoría Cajas si el producto es tipo caja y aún no hay ninguna. */
export function ensureRecetaConInsumoCaja(
  receta: RecetaLineaDraftLike[],
  insumos: HydrexInsumo[]
): RecetaLineaDraftLike[] {
  const insumoCaja = findInsumoCategoriaCaja(insumos)
  if (!insumoCaja || recetaYaTieneInsumoCaja(receta, insumos)) return receta

  return [{ tipo_linea: 'insumo', insumo_id: insumoCaja.id, cantidad: 1 }, ...receta]
}

export function recetaInicialParaTipoProducto(
  tipoProducto: TipoProductoDb,
  insumos: HydrexInsumo[],
  base: RecetaLineaDraftLike[]
): RecetaLineaDraftLike[] {
  if (tipoProducto === 'caja') {
    return ensureRecetaConInsumoCaja(base, insumos)
  }
  return base
}
