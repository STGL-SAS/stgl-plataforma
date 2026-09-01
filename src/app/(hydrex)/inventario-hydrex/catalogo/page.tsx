import {
  getInsumos,
  getPreciosProducto,
  getProductosConCosto,
  getProductosFull,
  getRecetaPorProducto,
  getStockProductos,
  getTiposInsumo,
} from '@/modules/inventario-hydrex/lib/queries'
import { stockProductosToMap } from '@/modules/inventario-hydrex/lib/stock-producto'
import { CatalogoPageClient } from './CatalogoPageClient'

export const dynamic = 'force-dynamic'

export default async function CatalogoPage() {
  const [tipos, insumos, productos, productosCosto, recetaMap, stockProductos] = await Promise.all([
    getTiposInsumo(),
    getInsumos(),
    getProductosFull(),
    getProductosConCosto(),
    getRecetaPorProducto(),
    getStockProductos(),
  ])
  const stockMap = stockProductosToMap(stockProductos)
  const preciosMap: Record<string, Awaited<ReturnType<typeof getPreciosProducto>>> = {}
  for (const p of productos) {
    preciosMap[p.id] = await getPreciosProducto(p.id)
  }
  return (
    <CatalogoPageClient
      initialTipos={tipos}
      initialInsumos={insumos}
      initialProductos={productos}
      initialProductosCosto={productosCosto}
      initialPreciosMap={preciosMap}
      initialRecetaMap={recetaMap}
      initialStockMap={stockMap}
    />
  )
}
