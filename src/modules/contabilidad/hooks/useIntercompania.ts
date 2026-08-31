'use client'

import { useCallback, useEffect, useState } from 'react'
import { getMovimientosIntercompania } from '../actions/intercompania'
import type { MovimientoIntercompania } from '../types'

export function useIntercompania() {
  const [data, setData] = useState<MovimientoIntercompania[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getMovimientosIntercompania())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar intercompañía')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
