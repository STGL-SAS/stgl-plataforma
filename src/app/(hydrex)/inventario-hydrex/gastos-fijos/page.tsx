import { getGastosFijosHydrex, getGastosFijosMensuales, getProductosConCosto, getComponentesCosto } from '@/modules/inventario-hydrex/lib/queries'
import { calcularVenta, productoCostoDisponible } from '@/modules/inventario-hydrex/lib/motor-calculo'
import { GastosFijosPageClient } from './GastosFijosPageClient'

export const dynamic = 'force-dynamic'

export default async function GastosFijosPage() {
  const [gastos, totalMensual, productos, componentes] = await Promise.all([
    getGastosFijosHydrex(),
    getGastosFijosMensuales(),
    getProductosConCosto(true),
    getComponentesCosto(),
  ])

  let gananciaPorUnidadRef = 0
  const ref = productos[0]
  const costoRef = ref?.costo_por_unidad
  if (ref && productoCostoDisponible(ref) && costoRef != null) {
    const r = calcularVenta({
      costoProductoUnitario: costoRef,
      precioVentaUnitario: costoRef * 1.5,
      cantidad: 1,
      canal: 'web',
      componentesDisponibles: componentes,
      componentesActivos: {},
      incluyeEnvio: false,
      valorEnvio: 0,
      unidadesEquivalentes: ref.unidades_equivalentes ?? 1,
    })
    gananciaPorUnidadRef = r.gananciaPorUnidad ?? 0
  }

  return (
    <GastosFijosPageClient
      initialGastos={gastos}
      totalMensual={totalMensual}
      gananciaPorUnidadRef={gananciaPorUnidadRef}
    />
  )
}
