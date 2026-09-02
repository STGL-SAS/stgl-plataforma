'use client'

import { useState } from 'react'
import { formatCOP } from '../motor-calculo'
import type { SocioOption } from './GastosFijosLista'

export interface GastoOcasionalRow {
  id: string
  concepto: string
  monto: number
  fecha: string
  comprobante: string | null
  pagado_por_socio_id: string | null
  socio_nombre: string | null
}

interface Props {
  gastos: GastoOcasionalRow[]
  socios: SocioOption[]
  mostrarPagoPersonal?: boolean
  onSave: (input: {
    id?: string
    concepto: string
    monto: number
    fecha: string
    comprobante: string | null
    pagado_por_socio_id: string | null
  }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onRefresh: () => void
}

const empty = () => ({
  id: undefined as string | undefined,
  concepto: '',
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  comprobante: '',
  pagado_por_socio_id: '',
})

export function GastosOcasionalesLista({
  gastos,
  socios,
  mostrarPagoPersonal = true,
  onSave,
  onDelete,
  onRefresh,
}: Props) {
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
        fecha: edit.fecha,
        comprobante: edit.comprobante.trim() || null,
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
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
      >
        + Gasto ocasional
      </button>

      {show && (
        <form
          onSubmit={submit}
          className="rounded-lg border bg-white p-6 grid gap-3 sm:grid-cols-2 max-w-2xl text-sm"
        >
          {error && <p className="sm:col-span-2 text-red-700">{error}</p>}
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-medium">Concepto</span>
            <input
              required
              className="rounded-md border px-3 py-2"
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
              className="rounded-md border px-3 py-2"
              value={edit.monto}
              onChange={(e) => setEdit({ ...edit, monto: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Fecha</span>
            <input
              type="date"
              className="rounded-md border px-3 py-2"
              value={edit.fecha}
              onChange={(e) => setEdit({ ...edit, fecha: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-medium">Comprobante (link)</span>
            <input
              className="rounded-md border px-3 py-2"
              placeholder="https://…"
              value={edit.comprobante}
              onChange={(e) => setEdit({ ...edit, comprobante: e.target.value })}
            />
          </label>
          {mostrarPagoPersonal && (
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-medium">Pagado con plata personal de</span>
              <select
                className="rounded-md border px-3 py-2"
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
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
            >
              Guardar
            </button>
            <button type="button" onClick={() => setShow(false)} className="text-zinc-600">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3 text-right">Monto</th>
              {mostrarPagoPersonal && <th className="px-4 py-3">Pagó</th>}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {gastos.map((g) => (
              <tr key={g.id} className="border-b">
                <td className="px-4 py-3">{g.fecha}</td>
                <td className="px-4 py-3 font-medium">{g.concepto}</td>
                <td className="px-4 py-3 text-right">{formatCOP(g.monto)}</td>
                {mostrarPagoPersonal && (
                  <td className="px-4 py-3 text-zinc-600">{g.socio_nombre ?? '—'}</td>
                )}
                <td className="px-4 py-3 space-x-2">
                  <button
                    type="button"
                    className="text-xs text-zinc-600"
                    onClick={() => {
                      setEdit({
                        id: g.id,
                        concepto: g.concepto,
                        monto: String(g.monto),
                        fecha: g.fecha,
                        comprobante: g.comprobante ?? '',
                        pagado_por_socio_id: g.pagado_por_socio_id ?? '',
                      })
                      setShow(true)
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={async () => {
                      await onDelete(g.id)
                      onRefresh()
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {gastos.length === 0 && (
              <tr>
                <td
                  colSpan={mostrarPagoPersonal ? 5 : 4}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  Sin gastos ocasionales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
