import { getClientesHydrex } from '@/modules/inventario-hydrex/lib/queries'
import { ClientesPageClient } from './ClientesPageClient'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const clientes = await getClientesHydrex()
  return <ClientesPageClient initialClientes={clientes as { id: string; nombre: string; contacto: Record<string, unknown>; notas: string | null }[]} />
}
