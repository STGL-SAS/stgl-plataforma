'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { deleteVentaHardtech } from '../actions/mutations'
import { calcularGananciaVenta, formatCOP } from '../motor-calculo'
import type { HardtechCompra, HardtechEstadoVenta, HardtechGastoExtra, HardtechVenta } from '../lib/tipos'
import { ESTADOS_VENTA } from '../lib/tipos'
import { DeleteIconButton } from '@/components/ui/IconAction'

interface VentaConDetalle extends HardtechVenta {
  compras: HardtechCompra[]
  gastos: HardtechGastoExtra[]
}

interface Props {
  ventas: VentaConDetalle[]
}

function labelEstado(e: HardtechEstadoVenta) {
  return ESTADOS_VENTA.find((x) => x.value === e)?.label ?? e
}

export function VentasList({ ventas }: Props) {
  const router = useRouter()
  const [estado, setEstado] = useState<HardtechEstadoVenta | ''>('')
  const [clienteQ, setClienteQ] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function eliminarVenta(v: VentaConDetalle) {
    if (
      !window.confirm(
        `¿Eliminar la venta «${v.titulo}»? Se borrarán también sus compras y gastos asociados. Esta acción no se puede deshacer.`
      )
    ) {
      return
    }
    setDeletingId(v.id)
    setError(null)
    try {
      await deleteVentaHardtech(v.id)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la venta')
    } finally {
      setDeletingId(null)
    }
  }

  const filtradas = useMemo(() => {
    return ventas.filter((v) => {
      if (estado && v.estado !== estado) return false
      if (clienteQ && !v.clientes?.nombre?.toLowerCase().includes(clienteQ.toLowerCase())) {
        return false
      }
      return true
    })
  }, [ventas, estado, clienteQ])

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado</span>
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={estado}
            onChange={(e) => setEstado(e.target.value as HardtechEstadoVenta | '')}
          >
            <option value="">Todos</option>
            {ESTADOS_VENTA.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Cliente</span>
          <input
            className="rounded-md border border-zinc-300 px-3 py-2"
            placeholder="Buscar…"
            value={clienteQ}
            onChange={(e) => setClienteQ(e.target.value)}
          />
        </label>
        <Link
          href="/hardtech/ventas/nueva"
          className="ml-auto rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Nueva venta
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Compra</th>
              <th className="px-4 py-3 text-right">Ganancia neta</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {filtradas.map((v) => {
              const calc = calcularGananciaVenta(v, v.compras, v.gastos)
              const compraTxt =
                v.compras.length === 0
                  ? 'Sin compra registrada'
                  : v.compras.map((c) => c.lugar_compra).join(', ')
              return (
                <tr key={v.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/hardtech/ventas/${v.id}`} className="font-medium text-zinc-900 hover:underline">
                      {v.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{v.clientes?.nombre ?? '—'}</td>
                  <td className="px-4 py-3">{labelEstado(v.estado)}</td>
                  <td className="px-4 py-3 text-zinc-600 max-w-xs truncate">{compraTxt}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCOP(calc.gananciaNeta)}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteIconButton
                      disabled={deletingId === v.id}
                      onClick={() => void eliminarVenta(v)}
                    />
                  </td>
                </tr>
              )
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No hay ventas con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
