'use client'

import { useCallback, useEffect, useState } from 'react'
import { getGastosFijosNegocio } from '@/modules/hardtech/lib/queries'
import type { GastoFijoRow } from '@/modules/hardtech/gastos/GastosFijosLista'

export function useGastosFijos(negocioId: string) {
  const [gastos, setGastos] = useState<GastoFijoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!negocioId) return
    setLoading(true)
    setError(null)
    try {
      const rows = await getGastosFijosNegocio(negocioId)
      setGastos(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar gastos fijos')
    } finally {
      setLoading(false)
    }
  }, [negocioId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { gastos, loading, error, reload }
}
