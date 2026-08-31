'use client'

import { useCallback, useEffect, useState } from 'react'
import { getTransacciones } from '../actions/transacciones'
import type { Transaccion, TransaccionFiltros } from '../types'

export function useTransacciones(filtrosIniciales: TransaccionFiltros = {}) {
  const [filtros, setFiltros] = useState<TransaccionFiltros>(filtrosIniciales)
  const [data, setData] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await getTransacciones(filtros)
      setData(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar transacciones')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, filtros, setFiltros, refetch }
}
