'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GastosFijosPuntoEquilibrio } from '@/modules/inventario-hydrex/components/GastosFijosPuntoEquilibrio'
import { getGastosFijosHydrex, getGastosFijosMensuales } from '@/modules/inventario-hydrex/lib/queries'

export function GastosFijosPageClient({
  initialGastos,
  totalMensual: initialTotal,
  gananciaPorUnidadRef,
}: {
  initialGastos: { id: string; concepto: string; monto: number; periodicidad: string; activo: boolean }[]
  totalMensual: number
  gananciaPorUnidadRef: number
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
      gananciaPorUnidadRef={gananciaPorUnidadRef}
      onRefresh={refresh}
    />
  )
}
