'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GastosFijosPuntoEquilibrio } from '@/modules/inventario-hydrex/components/GastosFijosPuntoEquilibrio'
import type { ComponenteCosto, HydrexProducto, PrecioRow } from '@/modules/inventario-hydrex/lib/tipos'
import { getGastosFijosHydrex, getGastosFijosMensuales } from '@/modules/inventario-hydrex/lib/queries'

export function GastosFijosPageClient({
  initialGastos,
  totalMensual: initialTotal,
  productos,
  preciosMap,
  componentes,
}: {
  initialGastos: { id: string; concepto: string; monto: number; periodicidad: string; activo: boolean }[]
  totalMensual: number
  productos: HydrexProducto[]
  preciosMap: Record<string, PrecioRow[]>
  componentes: ComponenteCosto[]
}) {
  const router = useRouter()
  const [gastos, setGastos] = useState(initialGastos)
  const [totalMensual, setTotalMensual] = useState(initialTotal)

  async function refresh() {
    const [g, t] = await Promise.all([getGastosFijosHydrex(), getGastosFijosMensuales()])
    setGastos(g as typeof initialGastos)
    setTotalMensual(t)
    router.refresh()
  }

  return (
    <GastosFijosPuntoEquilibrio
      gastos={gastos}
      totalMensual={totalMensual}
      productos={productos}
      preciosMap={preciosMap}
      componentes={componentes}
      onRefresh={refresh}
    />
  )
}
