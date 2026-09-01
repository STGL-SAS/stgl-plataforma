import {
  getComponentesCosto,
  getEnvioTarifas,
  getPreciosProducto,
  getProductosConCosto,
  getProductoReceta,
  getStockProductos,
} from '@/modules/inventario-hydrex/lib/queries'
import { stockProductosToMap } from '@/modules/inventario-hydrex/lib/stock-producto'
import { CalculadoraPageClient } from './CalculadoraPageClient'

export const dynamic = 'force-dynamic'

export default async function CalculadoraPage() {
  const [productos, recetaMap, stockProductos, componentes, envioTarifas] = await Promise.all([
    getProductosConCosto(true),
    getProductoReceta(),
    getStockProductos(),
    getComponentesCosto(),
    getEnvioTarifas(),
  ])
  const stockMap = stockProductosToMap(stockProductos)
  const preciosMap: Record<string, Awaited<ReturnType<typeof getPreciosProducto>>> = {}
  for (const p of productos) {
    preciosMap[p.id] = await getPreciosProducto(p.id)
  }
  return (
    <CalculadoraPageClient
      productos={productos}
      preciosMap={preciosMap}
      recetaMap={recetaMap}
      stockMap={stockMap}
      componentes={componentes}
      envioTarifas={envioTarifas}
    />
  )
}
