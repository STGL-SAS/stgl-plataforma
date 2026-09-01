'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ProveedoresCompras } from '@/modules/inventario-hydrex/components/ProveedoresCompras'
import type { HydrexInsumo, HydrexTipoInsumo } from '@/modules/inventario-hydrex/lib/tipos'
import { getComprasHydrex, getInsumos, getProveedoresHydrex } from '@/modules/inventario-hydrex/lib/queries'

export function ProveedoresPageClient({
  initialProveedores,
  initialInsumos,
  initialTipos,
  initialCompras,
}: {
  initialProveedores: Record<string, unknown>[]
  initialInsumos: HydrexInsumo[]
  initialTipos: HydrexTipoInsumo[]
  initialCompras: Record<string, unknown>[]
}) {
  const router = useRouter()
  const [proveedores, setProveedores] = useState(initialProveedores)
  const [insumos, setInsumos] = useState(initialInsumos)
  const [tipos] = useState(initialTipos)
  const [compras, setCompras] = useState(initialCompras)

  async function refresh() {
    const [p, i, c] = await Promise.all([
      getProveedoresHydrex(),
      getInsumos(),
      getComprasHydrex(),
    ])
    setProveedores(p)
    setInsumos(i)
    setCompras(c)
    router.refresh()
  }

  return (
    <ProveedoresCompras
      proveedores={proveedores}
      insumos={insumos}
      tipos={tipos}
      compras={compras}
      onRefresh={refresh}
      onInsumosChange={setInsumos}
    />
  )
}
