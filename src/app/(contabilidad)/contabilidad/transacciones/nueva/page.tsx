import Link from 'next/link'
import { TransaccionFormManual } from '@/modules/contabilidad/components/TransaccionFormManual'
import {
  getCategoriasSugeridas,
  getCuentasBancarias,
  getNegocios,
} from '@/modules/contabilidad/actions/transacciones'
import {
  getClientesHydrex,
  getComponentesCosto,
  getEnvioTarifas,
  getPreciosProducto,
  getProductosConCosto,
  getRecetaPorProducto,
  getStockProductos,
} from '@/modules/inventario-hydrex/lib/queries'
import { stockProductosToMap } from '@/modules/inventario-hydrex/lib/stock-producto'

export const dynamic = 'force-dynamic'

async function loadHydrexCatalog() {
  try {
    const [productos, componentes, envioTarifas, clientes, recetaMap, stockProductos] =
      await Promise.all([
      getProductosConCosto(true),
      getComponentesCosto(),
      getEnvioTarifas(),
      getClientesHydrex(),
      getRecetaPorProducto(),
      getStockProductos(),
    ])
    const stockMap = stockProductosToMap(stockProductos)
    const preciosMap: Record<string, Awaited<ReturnType<typeof getPreciosProducto>>> = {}
    for (const p of productos) {
      preciosMap[p.id] = await getPreciosProducto(p.id)
    }
    return {
      productos,
      preciosMap,
      recetaMap,
      stockMap,
      componentes,
      envioTarifas,
      clientes: clientes.map((c) => ({ id: c.id as string, nombre: c.nombre as string })),
    }
  } catch {
    return undefined
  }
}

export default async function NuevaTransaccionPage() {
  const [negocios, cuentas, categorias, hydrexCatalog] = await Promise.all([
    getNegocios(),
    getCuentasBancarias(),
    getCategoriasSugeridas(),
    loadHydrexCatalog(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/contabilidad/transacciones"
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          ← Volver a transacciones
        </Link>
        <h2 className="mt-2 text-lg font-semibold">Nueva transacción manual</h2>
        <p className="text-sm text-zinc-600">
          Se registra directamente como clasificada (origen manual). Ingresos HYDREX incluyen detalle de costeo.
        </p>
      </div>

      <TransaccionFormManual
        negocios={negocios}
        cuentas={cuentas}
        categoriasSugeridas={categorias}
        hydrexCatalog={hydrexCatalog}
      />
    </div>
  )
}
