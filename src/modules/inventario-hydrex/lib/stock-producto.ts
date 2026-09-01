export function stockProductosToMap(
  rows: { producto_id: string; stock_disponible: number }[]
): Record<string, number> {
  return Object.fromEntries(rows.map((r) => [r.producto_id, r.stock_disponible]))
}

export function mensajeStockInsuficiente(
  stockMap: Record<string, number>,
  productoId: string,
  cantidad: number
): string | null {
  if (!productoId) return null
  const stock = stockMap[productoId]
  if (stock === undefined) return null
  if (cantidad > stock) {
    return `Solo hay ${stock} disponibles según insumos actuales`
  }
  return null
}
