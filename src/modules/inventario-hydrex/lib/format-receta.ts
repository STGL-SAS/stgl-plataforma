import type { HydrexInsumo, HydrexProducto, HydrexProductoRecetaLinea } from './tipos'

export function formatInsumoLabel(
  insumo: Pick<HydrexInsumo, 'nombre' | 'atributo_1' | 'atributo_2'>
): string {
  const detalle = [insumo.atributo_1, insumo.atributo_2].filter(Boolean).join(' / ')
  return detalle ? `${insumo.nombre} (${detalle})` : insumo.nombre
}

export function formatProductoLabel(
  producto: Pick<HydrexProducto, 'nombre' | 'tipo_producto'>
): string {
  return `${producto.nombre} (${producto.tipo_producto})`
}

export function formatRecetaLinea(
  linea: Pick<
    HydrexProductoRecetaLinea,
    'cantidad' | 'insumo_id' | 'componente_producto_id' | 'insumo' | 'componente'
  >,
  insumoById?: Map<string, HydrexInsumo>,
  productoById?: Map<string, HydrexProducto>
): string {
  const cantidad = Number(linea.cantidad)
  const cantidadStr = Number.isInteger(cantidad) ? String(cantidad) : cantidad.toString()

  if (linea.componente_producto_id || linea.componente) {
    const producto =
      linea.componente ??
      (linea.componente_producto_id ? productoById?.get(linea.componente_producto_id) : undefined)
    const nombre = producto ? formatProductoLabel(producto) : 'Producto'
    return `${nombre} × ${cantidadStr}`
  }

  const insumo = linea.insumo ?? (linea.insumo_id ? insumoById?.get(linea.insumo_id) : undefined)
  const nombre = insumo ? formatInsumoLabel(insumo) : 'Insumo'
  return `${nombre} × ${cantidadStr}`
}

export function formatRecetaResumen(
  lineas: HydrexProductoRecetaLinea[],
  insumoById?: Map<string, HydrexInsumo>,
  productoById?: Map<string, HydrexProducto>
): string {
  if (!lineas.length) return 'Sin receta'
  return lineas.map((l) => formatRecetaLinea(l, insumoById, productoById)).join(' · ')
}
