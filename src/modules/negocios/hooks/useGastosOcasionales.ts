'use client'

import { useCallback, useEffect, useState } from 'react'
import { getGastosOcasionalesNegocio } from '@/modules/hardtech/lib/queries'
import type { GastoOcasionalRow } from '@/modules/hardtech/gastos/GastosOcasionalesLista'

export function useGastosOcasionales(negocioId: string) {
  const [gastos, setGastos] = useState<GastoOcasionalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!negocioId) return
    setLoading(true)
    setError(null)
    try {
      const rows = await getGastosOcasionalesNegocio(negocioId)
      setGastos(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar gastos ocasionales')
    } finally {
      setLoading(false)
    }
  }, [negocioId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { gastos, loading, error, reload }
}
