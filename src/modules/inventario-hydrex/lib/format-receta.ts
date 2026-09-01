import type { HydrexInsumo, HydrexProductoInsumo } from './tipos'

export function formatInsumoLabel(
  insumo: Pick<HydrexInsumo, 'nombre' | 'atributo_1' | 'atributo_2'>
): string {
  const detalle = [insumo.atributo_1, insumo.atributo_2].filter(Boolean).join(' / ')
  return detalle ? `${insumo.nombre} (${detalle})` : insumo.nombre
}

export function formatRecetaLinea(
  linea: Pick<HydrexProductoInsumo, 'cantidad' | 'insumo_id' | 'insumo'>,
  insumoById?: Map<string, HydrexInsumo>
): string {
  const insumo = linea.insumo ?? insumoById?.get(linea.insumo_id)
  const nombre = insumo ? formatInsumoLabel(insumo) : 'Insumo'
  const cantidad = Number(linea.cantidad)
  const cantidadStr = Number.isInteger(cantidad) ? String(cantidad) : cantidad.toString()
  return `${nombre} × ${cantidadStr}`
}

export function formatRecetaResumen(
  lineas: HydrexProductoInsumo[],
  insumoById?: Map<string, HydrexInsumo>
): string {
  if (!lineas.length) return 'Sin receta'
  return lineas.map((l) => formatRecetaLinea(l, insumoById)).join(' · ')
}
