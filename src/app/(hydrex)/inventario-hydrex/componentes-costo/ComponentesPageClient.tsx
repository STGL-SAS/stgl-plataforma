'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ComponentesCosto } from '@/modules/inventario-hydrex/components/ComponentesCosto'
import type { ComponenteCosto } from '@/modules/inventario-hydrex/lib/tipos'
import { getComponentesCosto, getEnvioTarifas } from '@/modules/inventario-hydrex/lib/queries'

export function ComponentesPageClient({
  initialComponentes,
  initialTarifas,
}: {
  initialComponentes: ComponenteCosto[]
  initialTarifas: Record<string, unknown>[]
}) {
  const router = useRouter()
  const [componentes, setComponentes] = useState(initialComponentes)
  const [tarifas, setTarifas] = useState(initialTarifas)

  async function refresh() {
    const [c, t] = await Promise.all([getComponentesCosto(undefined, false), getEnvioTarifas(false)])
    setComponentes(c)
    setTarifas(t)
    router.refresh()
  }

  return (
    <ComponentesCosto
      componentes={componentes}
      envioTarifas={tarifas as { id: string; nombre: string; valor_referencia: number; activo: boolean; orden: number }[]}
      onRefresh={refresh}
    />
  )
}
