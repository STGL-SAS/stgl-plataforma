import { getClientesHardtech, getMantenimientosHardtech } from '@/modules/hardtech/lib/queries'
import { MantenimientosPanel } from '@/modules/hardtech/mantenimientos/MantenimientosPanel'

export const dynamic = 'force-dynamic'

export default async function MantenimientosHardtechPage() {
  const [mantenimientos, clientes] = await Promise.all([
    getMantenimientosHardtech(),
    getClientesHardtech(),
  ])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Mantenimientos</h2>
      <MantenimientosPanel
        mantenimientos={mantenimientos}
        clientes={clientes.map((c) => ({ id: c.id as string, nombre: c.nombre as string }))}
      />
    </div>
  )
}
