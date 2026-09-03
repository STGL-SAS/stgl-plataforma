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
          className="text-sm text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)] hover:underline"
        >
          ← Volver a transacciones
        </Link>
        <h2 className="mt-2 text-base font-semibold text-[var(--cmd-text)]">
          Nueva transacción manual
        </h2>
        <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
          Se registra directamente como clasificada (origen manual). Ingresos HYDREX incluyen detalle
          de costeo.
        </p>
      </div>

      <div className="cmd-panel p-4">
        <TransaccionFormManual
        negocios={negocios}
        cuentas={cuentas}
        categoriasSugeridas={categorias}
        hydrexCatalog={hydrexCatalog}
        hydrexCatalogError={hydrexCatalogError}
        />
      </div>
    </div>
  )
}
