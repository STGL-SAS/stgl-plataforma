'use client'

import { useCallback, useEffect, useState } from 'react'
import { getTareas } from '../lib/actions'
import type { TareaRow } from '../types'

export function useTareas(negocioId: string) {
  const [tareas, setTareas] = useState<TareaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await getTareas(negocioId || null)
      setTareas(rows as TareaRow[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tareas')
    } finally {
      setLoading(false)
    }
  }, [negocioId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { tareas, loading, error, reload, setTareas }
}
