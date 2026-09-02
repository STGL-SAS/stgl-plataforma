'use client'

import { useCallback, useEffect, useState } from 'react'
import { getTareaHistorial } from '../lib/actions'
import type { TareaHistorialRow } from '../types'

export function useTareaHistorial(tareaId: string) {
  const [historial, setHistorial] = useState<TareaHistorialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await getTareaHistorial(tareaId)
      setHistorial(rows as TareaHistorialRow[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }, [tareaId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { historial, loading, error, reload }
}
