import { ClientesPorNegocio } from '@/modules/clientes/components/ClientesPorNegocio'
import { getNegociosConClientes } from '@/modules/clientes/lib/actions'

export const dynamic = 'force-dynamic'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ negocio?: string }>
}) {
  const sp = await searchParams
  let negocios: { id: string; codigo: string; nombre: string }[] = []

  try {
    negocios = await getNegociosConClientes()
  } catch {
    // Tabla aún no disponible
  }

  const initial =
    negocios.find((n) => n.codigo === sp.negocio?.toUpperCase())?.id ||
    negocios.find((n) => n.codigo === 'HANGARC')?.id ||
    negocios[0]?.id

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Ficha de clientes</h2>
      <ClientesPorNegocio negocios={negocios} initialNegocioId={initial} />
    </div>
  )
}
