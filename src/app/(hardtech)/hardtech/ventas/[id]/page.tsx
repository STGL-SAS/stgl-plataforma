import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getClientesHardtech,
  getComprasParaAgrupar,
  getComprasVenta,
  getGastosExtraVenta,
  getVentaHardtech,
} from '@/modules/hardtech/lib/queries'
import { VentaFormEtapas } from '@/modules/hardtech/ventas/VentaFormEtapas'

export const dynamic = 'force-dynamic'

export default async function VentaHardtechDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [venta, clientes, compras, gastos, comprasAgrupables] = await Promise.all([
    getVentaHardtech(id),
    getClientesHardtech(),
    getComprasVenta(id),
    getGastosExtraVenta(id),
    getComprasParaAgrupar(id),
  ])

  if (!venta) notFound()

  return (
    <div className="space-y-4">
      <Link href="/hardtech/ventas" className="text-sm text-zinc-500 hover:text-zinc-700">
        ← Ventas
      </Link>
      <h2 className="text-lg font-semibold">{venta.titulo}</h2>
      <VentaFormEtapas
        venta={venta}
        compras={compras}
        gastos={gastos}
        clientes={clientes.map((c: { id: string; nombre: string }) => ({ id: c.id, nombre: c.nombre }))}
        comprasAgrupables={comprasAgrupables.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          lugar_compra: c.lugar_compra as string,
          hardtech_ventas: c.hardtech_ventas as { titulo: string } | null,
        }))}
      />
    </div>
  )
}
