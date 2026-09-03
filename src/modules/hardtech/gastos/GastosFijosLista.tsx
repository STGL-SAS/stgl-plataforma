'use client'

import { useState } from 'react'
import { RowActions } from '@/components/ui/RowActions'
import { formatCOP } from '../motor-calculo'

export interface GastoFijoRow {
  id: string
  concepto: string
  monto: number
  periodicidad: string
  fecha: string
  activo: boolean
  notas: string | null
  pagado_por_socio_id: string | null
  socio_nombre: string | null
}

export interface SocioOption {
  id: string
  nombre: string
}

interface Props {
  gastos: GastoFijoRow[]
  socios: SocioOption[]
  /** Si false, oculta el campo de pago personal (p. ej. HYDREX futuro). */
  mostrarPagoPersonal?: boolean
  variant?: 'light' | 'dark'
  onSave: (input: {
    id?: string
    concepto: string
    monto: number
    periodicidad: 'mensual' | 'anual' | 'unico'
    fecha: string
    activo: boolean
    notas: string | null
    pagado_por_socio_id: string | null
  }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void
}

const empty = () => ({
  id: undefined as string | undefined,
  concepto: '',
  monto: '',
  periodicidad: 'mensual' as 'mensual' | 'anual' | 'unico',
  fecha: new Date().toISOString().slice(0, 10),
  activo: true,
  notas: '',
  pagado_por_socio_id: '',
})

export function GastosFijosLista({
  gastos,
  socios,
  mostrarPagoPersonal = true,
  variant = 'light',
  onSave,
  onDelete,
  onRefresh,
}: Props) {
  const isDark = variant === 'dark'
  const btnPrimary = isDark
    ? 'rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)] px-4 py-2 text-sm text-[var(--cmd-text)] hover:bg-[var(--cmd-panel)]'
    : 'rounded-md bg-zinc-900 px-4 py-2 text-sm text-white'
  const formClass = isDark
    ? 'rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-panel)] p-6 grid gap-3 sm:grid-cols-2 max-w-2xl text-sm text-[var(--cmd-text)]'
    : 'rounded-lg border bg-white p-6 grid gap-3 sm:grid-cols-2 max-w-2xl text-sm'
  const fieldClass = isDark
    ? 'rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-bg)] px-3 py-2 text-[var(--cmd-text)]'
    : 'rounded-md border px-3 py-2'
  const tableWrap = isDark
    ? 'overflow-x-auto rounded-lg border border-[var(--cmd-border)]'
    : 'overflow-x-auto rounded-lg border bg-white'
  const theadClass = isDark
    ? 'border-b border-[var(--cmd-border)] bg-black/20 text-left text-[var(--cmd-text-muted)]'
    : 'border-b bg-zinc-50 text-left text-zinc-600'
  const rowClass = isDark ? 'border-b border-[var(--cmd-border)]' : 'border-b'
  const emptyClass = isDark
    ? 'px-4 py-8 text-center text-[var(--cmd-text-dim)]'
    : 'px-4 py-8 text-center text-zinc-500'
  const [edit, setEdit] = useState(empty())
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSave({
        id: edit.id,
        concepto: edit.concepto,
        monto: Number(edit.monto),
        periodicidad: edit.periodicidad,
        fecha: edit.fecha,
        activo: edit.activo,
        notas: edit.notas.trim() || null,
        pagado_por_socio_id: edit.pagado_por_socio_id || null,
      })
      setShow(false)
      setEdit(empty())
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          setEdit(empty())
          setShow(true)
        }}
        className={btnPrimary}
      >
        + Gasto fijo
      </button>

      {show && (
        <form onSubmit={submit} className={formClass}>
          {error && <p className={`sm:col-span-2 ${isDark ? 'text-[var(--cmd-decline)]' : 'text-red-700'}`}>{error}</p>}
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-medium">Concepto</span>
            <input
              required
              className={fieldClass}
              value={edit.concepto}
              onChange={(e) => setEdit({ ...edit, concepto: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Monto</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              className={fieldClass}
              value={edit.monto}
              onChange={(e) => setEdit({ ...edit, monto: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Periodicidad</span>
            <select
              className={fieldClass}
              value={edit.periodicidad}
              onChange={(e) =>
                setEdit({
                  ...edit,
                  periodicidad: e.target.value as 'mensual' | 'anual' | 'unico',
                })
              }
            >
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
              <option value="unico">Único</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Fecha</span>
            <input
              type="date"
              className={fieldClass}
              value={edit.fecha}
              onChange={(e) => setEdit({ ...edit, fecha: e.target.value })}
            />
          </label>
          {mostrarPagoPersonal && (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Pagado con plata personal de</span>
              <select
                className={fieldClass}
                value={edit.pagado_por_socio_id}
                onChange={(e) => setEdit({ ...edit, pagado_por_socio_id: e.target.value })}
              >
                <option value="">—</option>
                {socios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={edit.activo}
              onChange={(e) => setEdit({ ...edit, activo: e.target.checked })}
            />
            <span>Activo</span>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`${btnPrimary} disabled:opacity-50`}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className={isDark ? 'text-[var(--cmd-text-muted)]' : 'text-zinc-600'}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={tableWrap}>
        <table className="min-w-full text-sm">
          <thead className={theadClass}>
            <tr>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3">Periodicidad</th>
              {mostrarPagoPersonal && <th className="px-4 py-3">Pagó</th>}
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {gastos.map((g) => (
              <tr key={g.id} className={rowClass}>
                <td className={`px-4 py-3 font-medium ${isDark ? 'text-[var(--cmd-text)]' : ''}`}>{g.concepto}</td>
                <td className="px-4 py-3 text-right">{formatCOP(g.monto)}</td>
                <td className="px-4 py-3 capitalize">{g.periodicidad}</td>
                {mostrarPagoPersonal && (
                  <td className={`px-4 py-3 ${isDark ? 'text-[var(--cmd-text-muted)]' : 'text-zinc-600'}`}>{g.socio_nombre ?? '—'}</td>
                )}
                <td className="px-4 py-3">{g.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="px-4 py-3">
                  <RowActions
                    onEdit={() => {
                      setEdit({
                        id: g.id,
                        concepto: g.concepto,
                        monto: String(g.monto),
                        periodicidad: g.periodicidad as 'mensual' | 'anual' | 'unico',
                        fecha: g.fecha,
                        activo: g.activo,
                        notas: g.notas ?? '',
                        pagado_por_socio_id: g.pagado_por_socio_id ?? '',
                      })
                      setShow(true)
                    }}
                    onDelete={async () => {
                      await onDelete(g.id)
                      onRefresh()
                    }}
                  />
                </td>
              </tr>
            ))}
            {gastos.length === 0 && (
              <tr>
                <td
                  colSpan={mostrarPagoPersonal ? 6 : 5}
                  className={emptyClass}
                >
                  Sin gastos fijos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
