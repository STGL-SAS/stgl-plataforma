'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ClientesHydrex } from '@/modules/inventario-hydrex/components/ClientesHydrex'
import { getClientesHydrex } from '@/modules/inventario-hydrex/lib/queries'

export function ClientesPageClient({
  initialClientes,
}: {
  initialClientes: { id: string; nombre: string; contacto: Record<string, unknown>; notas: string | null }[]
}) {
  const router = useRouter()
  const [clientes, setClientes] = useState(initialClientes)

  async function refresh() {
    setClientes(await getClientesHydrex() as typeof initialClientes)
    router.refresh()
  }

  return <ClientesHydrex clientes={clientes} onRefresh={refresh} />
}
