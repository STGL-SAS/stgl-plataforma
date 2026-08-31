'use client'

import { useState } from 'react'
import {
  createMovimientoIntercompania,
  marcarIntercompaniaSaldado,
} from '../actions/intercompania'
import type { MovimientoIntercompania, Negocio } from '../types'
import { formatCOP, formatFecha } from '../utils'

interface Props {
  movimientos: MovimientoIntercompania[]
  negocios: Negocio[]
  onRefresh: () => void
}

export function IntercompaniaTable({ movimientos, negocios, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saldandoId, setSaldandoId] = useState<string | null>(null)

  const hoy = new Date().toISOString().slice(0, 10)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    try {
      await createMovimientoIntercompania({
        negocio_origen_id: fd.get('negocio_origen_id') as string,
        negocio_destino_id: fd.get('negocio_destino_id') as string,
        monto: Number(fd.get('monto')),
        fecha: fd.get('fecha') as string,
        concepto: fd.get('concepto') as string,
        observaciones: (fd.get('observaciones') as string) || undefined,
      })
      setShowForm(false)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaldar(id: string) {
    setSaldandoId(id)
    try {
      await marcarIntercompaniaSaldado(id)
      onRefresh()
    } finally {
      setSaldandoId(null)
    }
  }

  const negociosOperativos = negocios.filter((n) => n.codigo !== 'STGL')

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          {showForm ? 'Cancelar' : 'Nuevo movimiento'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-4"
        >
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Origen</span>
              <select name="negocio_origen_id" required className="rounded-md border border-zinc-300 px-3 py-2">
                {negociosOperativos.map((n) => (
                  <option key={n.id} value={n.id}>{n.nombre}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Destino</span>
              <select name="negocio_destino_id" required className="rounded-md border border-zinc-300 px-3 py-2">
                {negociosOperativos.map((n) => (
                  <option key={n.id} value={n.id}>{n.nombre}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Monto</span>
              <input name="monto" type="number" min="0.01" step="0.01" required className="rounded-md border border-zinc-300 px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Fecha</span>
              <input name="fecha" type="date" required defaultValue={hoy} className="rounded-md border border-zinc-300 px-3 py-2" />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Concepto</span>
            <input name="concepto" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Observaciones</span>
            <textarea name="observaciones" rows={2} className="rounded-md border border-zinc-300 px-3 py-2" />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </form>
      )}

      {movimientos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
          No hay movimientos intercompañía registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Origen → Destino</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600">Monto</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Concepto</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    {m.negocio_origen?.codigo ?? '?'} → {m.negocio_destino?.codigo ?? '?'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCOP(m.monto)}</td>
                  <td className="px-4 py-3">{formatFecha(m.fecha)}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={m.concepto}>{m.concepto}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.estado === 'saldado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.estado === 'saldado' ? 'Saldado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {m.estado === 'pendiente' && (
                      <button
                        type="button"
                        disabled={saldandoId === m.id}
                        onClick={() => handleSaldar(m.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        Marcar saldado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
