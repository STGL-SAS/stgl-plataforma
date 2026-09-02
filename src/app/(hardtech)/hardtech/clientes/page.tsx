import { getClientesHardtech } from '@/modules/hardtech/lib/queries'
import { ClientesHardtech } from '@/modules/hardtech/components/ClientesHardtech'

export const dynamic = 'force-dynamic'

export default async function ClientesHardtechPage() {
  const clientes = await getClientesHardtech()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Clientes HARDTECH</h2>
      <ClientesHardtech
        clientes={clientes.map((c) => ({
          id: c.id as string,
          nombre: c.nombre as string,
          contacto: (c.contacto as Record<string, unknown>) ?? {},
          notas: (c.notas as string | null) ?? null,
        }))}
      />
    </div>
  )
}
