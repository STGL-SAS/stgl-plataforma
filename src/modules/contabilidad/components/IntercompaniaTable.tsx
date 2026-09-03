'use client'

import { useState } from 'react'
import {
  createMovimientoIntercompania,
  marcarIntercompaniaSaldado,
} from '../actions/intercompania'
import type { MovimientoIntercompania, Negocio } from '../types'
import { formatCOP, formatFecha } from '../utils'
import { NegocioRowLabel } from './NegocioRowLabel'

interface Props {
  movimientos: MovimientoIntercompania[]
  negocios: Negocio[]
  onRefresh: () => void
}

const fieldClass =
  'rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel)] px-3 py-2 text-[var(--cmd-text)]'

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
          className="rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)] px-4 py-2 text-sm font-medium text-[var(--cmd-text)] transition-colors hover:border-[var(--cmd-stgl)]"
        >
          {showForm ? 'Cancelar' : 'Nuevo movimiento'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="cmd-panel max-w-xl space-y-4 p-4">
          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[var(--cmd-text-muted)]">Origen</span>
              <select name="negocio_origen_id" required className={fieldClass}>
                {negociosOperativos.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[var(--cmd-text-muted)]">Destino</span>
              <select name="negocio_destino_id" required className={fieldClass}>
                {negociosOperativos.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[var(--cmd-text-muted)]">Monto</span>
              <input
                name="monto"
                type="number"
                min="0.01"
                step="0.01"
                required
                className={fieldClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-[var(--cmd-text-muted)]">Fecha</span>
              <input name="fecha" type="date" required defaultValue={hoy} className={fieldClass} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--cmd-text-muted)]">Concepto</span>
            <input name="concepto" required className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--cmd-text-muted)]">Observaciones</span>
            <textarea name="observaciones" rows={2} className={fieldClass} />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)] px-4 py-2 text-sm font-medium text-[var(--cmd-text)] disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </form>
      )}

      {movimientos.length === 0 ? (
        <p className="cmd-panel border-dashed p-8 text-center text-sm text-[var(--cmd-text-dim)]">
          No hay movimientos intercompañía registrados.
        </p>
      ) : (
        <div className="cmd-panel overflow-x-auto">
          <table className="cmd-table min-w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3">Origen → Destino</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--cmd-panel-hover)]">
                  <td className="px-4 py-3">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {m.negocio_origen?.codigo ? (
                        <NegocioRowLabel
                          codigo={m.negocio_origen.codigo}
                          nombre={m.negocio_origen.nombre ?? m.negocio_origen.codigo}
                        />
                      ) : (
                        '?'
                      )}
                      <span className="text-[var(--cmd-text-dim)]">→</span>
                      {m.negocio_destino?.codigo ? (
                        <NegocioRowLabel
                          codigo={m.negocio_destino.codigo}
                          nombre={m.negocio_destino.nombre ?? m.negocio_destino.codigo}
                        />
                      ) : (
                        '?'
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-label-mono text-[var(--cmd-text)]">
                      {formatCOP(m.monto)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--cmd-text-muted)]">{formatFecha(m.fecha)}</td>
                  <td
                    className="max-w-xs truncate px-4 py-3 text-[var(--cmd-text-muted)]"
                    title={m.concepto}
                  >
                    {m.concepto}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`cmd-badge inline-flex rounded-full px-2 py-0.5 ${
                        m.estado === 'saldado'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
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
                        className="text-sm font-medium text-[var(--cmd-stgl)] hover:underline disabled:opacity-50"
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
