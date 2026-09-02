import Link from 'next/link'
import { getClientesHardtech } from '@/modules/hardtech/lib/queries'
import { VentaFormEtapas } from '@/modules/hardtech/ventas/VentaFormEtapas'

export const dynamic = 'force-dynamic'

export default async function NuevaVentaHardtechPage() {
  const clientes = await getClientesHardtech()

  return (
    <div className="space-y-4">
      <Link href="/hardtech/ventas" className="text-sm text-zinc-500 hover:text-zinc-700">
        ← Ventas
      </Link>
      <h2 className="text-lg font-semibold">Nueva venta</h2>
      <VentaFormEtapas
        compras={[]}
        gastos={[]}
        clientes={clientes.map((c) => ({ id: c.id as string, nombre: c.nombre as string }))}
        comprasAgrupables={[]}
      />
    </div>
  )
}
