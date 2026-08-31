'use client'

import { useCallback, useEffect, useState } from 'react'
import { getEstadoCuentaSocio } from '../actions/aportes'
import type { EstadoCuentaSocio } from '../types'

export function useEstadoCuentaSocio(socioId: string | null) {
  const [data, setData] = useState<EstadoCuentaSocio | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!socioId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setData(await getEstadoCuentaSocio(socioId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar estado de cuenta')
    } finally {
      setLoading(false)
    }
  }, [socioId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
