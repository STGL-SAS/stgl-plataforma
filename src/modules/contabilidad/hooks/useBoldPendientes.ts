'use client'

import { useCallback, useEffect, useState } from 'react'
import { getBoldPendientes } from '../actions/transacciones'
import type { Transaccion } from '../types'

export function useBoldPendientes() {
  const [data, setData] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getBoldPendientes())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar pendientes Bold')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
