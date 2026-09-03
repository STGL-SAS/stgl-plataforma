'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getBalancePorNegocio,
  type BalanceNegocioDetalle,
} from '@/modules/contabilidad/actions/balance'

export function useBalanceNegocio(negocioId: string) {
  const [balance, setBalance] = useState<BalanceNegocioDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!negocioId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getBalancePorNegocio(negocioId)
      setBalance(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar balance')
    } finally {
      setLoading(false)
    }
  }, [negocioId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { balance, loading, error, reload }
}
