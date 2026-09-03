'use client'

import { useState } from 'react'
import { CommandPanel } from '@/components/layout/ModuleShell'
import { createAporteSocio } from '../actions/aportes'
import type { EstadoCuentaSocio, Negocio, Socio } from '../types'
import { formatCOP } from '../utils'
import { NegocioRowLabel } from './NegocioRowLabel'

interface Props {
  socios: Socio[]
  negocios: Negocio[]
  socioId: string | null
  onSocioChange: (id: string) => void
  estado: EstadoCuentaSocio | null
  loading: boolean
  onRefresh: () => void
}

const fieldClass =
  'rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel)] px-3 py-2 text-[var(--cmd-text)]'

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
      <CommandPanel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--cmd-text-muted)]">Socio</span>
            <select
              className={`${fieldClass} min-w-[200px]`}
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
              className="rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)] px-4 py-2 text-sm font-medium text-[var(--cmd-text)] transition-colors hover:border-[var(--cmd-stgl)]"
            >
              {showForm ? 'Cancelar' : 'Registrar aporte'}
            </button>
          )}
        </div>
      </CommandPanel>

      {showForm && socioId && (
        <form onSubmit={handleAporte} className="cmd-panel max-w-xl space-y-4 p-4">
          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--cmd-text-muted)]">Negocio</span>
            <select name="negocio_id" required className={fieldClass}>
              {negocios.filter((n) => n.codigo !== 'STGL').map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </label>
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
              <input
                name="fecha"
                type="date"
                required
                defaultValue={hoy}
                className={fieldClass}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-[var(--cmd-text-muted)]">Clasificación</span>
            <select name="clasificacion" required className={fieldClass}>
              <option value="capital">Capital</option>
              <option value="prestamo">Préstamo</option>
            </select>
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
            {saving ? 'Guardando…' : 'Guardar aporte'}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-[var(--cmd-text-dim)]">Cargando…</p>}

      {!loading && socioId && estado && (
        <div className="cmd-panel overflow-x-auto">
          <table className="cmd-table min-w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3 text-right">Capital</th>
                <th className="px-4 py-3 text-right">Préstamo</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {estado.por_negocio.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[var(--cmd-text-dim)]">
                    Sin aportes registrados para este socio.
                  </td>
                </tr>
              ) : (
                estado.por_negocio.map((n) => {
                  const neg = negocios.find((x) => x.id === n.negocio_id)
                  const codigo = neg?.codigo ?? 'STGL'
                  return (
                    <tr key={n.negocio_id} className="hover:bg-[var(--cmd-panel-hover)]">
                      <td className="px-4 py-3">
                        <NegocioRowLabel codigo={codigo} nombre={n.negocio_nombre} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-label-mono text-[var(--cmd-text-muted)]">
                          {formatCOP(n.capital)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-label-mono text-[var(--cmd-text-muted)]">
                          {formatCOP(n.prestamo)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-label-mono text-[var(--cmd-text)]">
                          {formatCOP(n.total)}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {estado.por_negocio.length > 0 && (
              <tfoot>
                <tr className="font-semibold">
                  <td className="px-4 py-3 text-[var(--cmd-text)]">Total general</td>
                  <td colSpan={2} />
                  <td className="px-4 py-3 text-right">
                    <span className="font-label-mono text-[var(--cmd-text)]">
                      {formatCOP(estado.total_general)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}
