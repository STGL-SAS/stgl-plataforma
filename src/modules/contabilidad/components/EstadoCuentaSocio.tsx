'use client'

import { useState } from 'react'
import { createAporteSocio } from '../actions/aportes'
import type { EstadoCuentaSocio, Negocio, Socio } from '../types'
import { formatCOP } from '../utils'

interface Props {
  socios: Socio[]
  negocios: Negocio[]
  socioId: string | null
  onSocioChange: (id: string) => void
  estado: EstadoCuentaSocio | null
  loading: boolean
  onRefresh: () => void
}

export function EstadoCuentaSocioView({
  socios,
  negocios,
  socioId,
  onSocioChange,
  estado,
  loading,
  onRefresh,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hoy = new Date().toISOString().slice(0, 10)

  async function handleAporte(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!socioId) return
    setSaving(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    try {
      await createAporteSocio({
        socio_id: socioId,
        negocio_id: fd.get('negocio_id') as string,
        monto: Number(fd.get('monto')),
        fecha: fd.get('fecha') as string,
        clasificacion: fd.get('clasificacion') as 'capital' | 'prestamo',
        observaciones: (fd.get('observaciones') as string) || undefined,
      })
      setShowForm(false)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar aporte')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Socio</span>
          <select
            className="min-w-[200px] rounded-md border border-zinc-300 px-3 py-2"
            value={socioId ?? ''}
            onChange={(e) => onSocioChange(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>

        {socioId && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            {showForm ? 'Cancelar' : 'Registrar aporte'}
          </button>
        )}
      </div>

      {showForm && socioId && (
        <form
          onSubmit={handleAporte}
          className="max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-4"
        >
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Negocio</span>
            <select name="negocio_id" required className="rounded-md border border-zinc-300 px-3 py-2">
              {negocios.filter((n) => n.codigo !== 'STGL').map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </label>
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
            <span className="font-medium">Clasificación</span>
            <select name="clasificacion" required className="rounded-md border border-zinc-300 px-3 py-2">
              <option value="capital">Capital</option>
              <option value="prestamo">Préstamo</option>
            </select>
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
            {saving ? 'Guardando…' : 'Guardar aporte'}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-zinc-500">Cargando…</p>}

      {!loading && socioId && estado && (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Negocio</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Capital</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Préstamo</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {estado.por_negocio.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                      Sin aportes registrados para este socio.
                    </td>
                  </tr>
                ) : (
                  estado.por_negocio.map((n) => (
                    <tr key={n.negocio_id}>
                      <td className="px-4 py-3">{n.negocio_nombre}</td>
                      <td className="px-4 py-3 text-right">{formatCOP(n.capital)}</td>
                      <td className="px-4 py-3 text-right">{formatCOP(n.prestamo)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCOP(n.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {estado.por_negocio.length > 0 && (
                <tfoot className="bg-zinc-50 font-semibold">
                  <tr>
                    <td className="px-4 py-3">Total general</td>
                    <td colSpan={2} />
                    <td className="px-4 py-3 text-right">{formatCOP(estado.total_general)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  )
}
