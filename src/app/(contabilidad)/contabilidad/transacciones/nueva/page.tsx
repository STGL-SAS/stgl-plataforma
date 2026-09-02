import Link from 'next/link'
import { TransaccionFormManual } from '@/modules/contabilidad/components/TransaccionFormManual'
import {
  getCategoriasSugeridas,
  getCuentasBancarias,
  getNegocios,
} from '@/modules/contabilidad/actions/transacciones'
import { getHydrexCatalogForVenta } from '@/modules/inventario-hydrex/lib/queries'

export const dynamic = 'force-dynamic'

export default async function NuevaTransaccionPage() {
  let hydrexCatalog
  let hydrexCatalogError: string | undefined

  try {
    hydrexCatalog = await getHydrexCatalogForVenta()
  } catch (err) {
    hydrexCatalogError =
      err instanceof Error ? err.message : 'No se pudo cargar el catálogo HYDREX'
    console.error('[nueva transacción] catálogo HYDREX:', err)
  }

  const [negocios, cuentas, categorias] = await Promise.all([
    getNegocios(),
    getCuentasBancarias(),
    getCategoriasSugeridas(),
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
        hydrexCatalogError={hydrexCatalogError}
      />
    </div>
  )
}
