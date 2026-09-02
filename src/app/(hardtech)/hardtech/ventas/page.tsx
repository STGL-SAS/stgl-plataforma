import {
  getComprasVenta,
  getGastosExtraVenta,
  getVentasHardtech,
} from '@/modules/hardtech/lib/queries'
import { VentasList } from '@/modules/hardtech/ventas/VentasList'

export const dynamic = 'force-dynamic'

export default async function VentasHardtechPage() {
  const ventas = await getVentasHardtech()
  const ventasConDetalle = await Promise.all(
    ventas.map(async (v) => ({
      ...v,
      compras: await getComprasVenta(v.id),
      gastos: await getGastosExtraVenta(v.id),
    }))
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Ventas HARDTECH</h2>
      <VentasList ventas={ventasConDetalle} />
    </div>
  )
}
