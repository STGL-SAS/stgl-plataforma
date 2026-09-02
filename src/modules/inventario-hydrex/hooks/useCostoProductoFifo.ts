'use client'

import { useEffect, useState } from 'react'
import { obtenerCostoProductoFifo } from '../lib/queries'

export function useCostoProductoFifo(productoId: string, cantidad: number) {
  const [costoProductoTotal, setCostoProductoTotal] = useState<number | null>(null)
  const [incompleto, setIncompleto] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!productoId || cantidad <= 0) {
      setCostoProductoTotal(null)
      setIncompleto(true)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    obtenerCostoProductoFifo(productoId, cantidad)
      .then(({ costo, incompleto: inc }) => {
        if (cancelled) return
        setCostoProductoTotal(costo)
        setIncompleto(inc)
      })
      .catch(() => {
        if (cancelled) return
        setCostoProductoTotal(null)
        setIncompleto(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [productoId, cantidad])

  const costoDisponible =
    !incompleto && costoProductoTotal != null && !Number.isNaN(costoProductoTotal)

  return { costoProductoTotal, incompleto, loading, costoDisponible }
}
