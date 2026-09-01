import { getMovimientosInventario, getStockActual, getStockProductos, getTiposInsumo } from '@/modules/inventario-hydrex/lib/queries'
import { InventarioStock } from '@/modules/inventario-hydrex/components/InventarioStock'

export const dynamic = 'force-dynamic'

export default async function StockPage() {
  const [stock, stockProductos, tipos, movimientos] = await Promise.all([
    getStockActual(),
    getStockProductos(),
    getTiposInsumo(),
    getMovimientosInventario(),
  ])
  return (
    <InventarioStock
      stock={stock}
      stockProductos={stockProductos}
      tipos={tipos}
      movimientos={movimientos}
    />
  )
}
