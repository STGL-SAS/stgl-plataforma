import {
  getComponentesCosto,
  getGastosFijosHydrex,
  getGastosFijosMensuales,
  getPreciosProducto,
  getProductosConCosto,
} from '@/modules/inventario-hydrex/lib/queries'
import { GastosFijosPageClient } from './GastosFijosPageClient'

export const dynamic = 'force-dynamic'

export default async function GastosFijosPage() {
  const [gastos, totalMensual, productos, componentes] = await Promise.all([
    getGastosFijosHydrex(),
    getGastosFijosMensuales(),
    getProductosConCosto(true),
    getComponentesCosto(),
  ])

  const preciosMap: Record<string, Awaited<ReturnType<typeof getPreciosProducto>>> = {}
  for (const p of productos) {
    preciosMap[p.id] = await getPreciosProducto(p.id)
  }

  return (
    <GastosFijosPageClient
      initialGastos={gastos}
      totalMensual={totalMensual}
      productos={productos}
      preciosMap={preciosMap}
      componentes={componentes}
    />
  )
}
