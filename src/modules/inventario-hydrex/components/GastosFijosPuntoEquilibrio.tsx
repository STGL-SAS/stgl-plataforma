'use client'

import { useMemo, useState } from 'react'
import { deleteGastoFijo } from '../actions/deletes'
import { upsertGastoFijo } from '../actions/mutations'
import { formatCOP } from '../lib/motor-calculo'
import { ConfirmDialog } from './ConfirmDialog'
import { CurrencyInput } from './CurrencyInput'
import { RowActions } from './RowActions'

interface Gasto {
  id: string
  concepto: string
  monto: number
  periodicidad: string
  activo: boolean
}

interface Props {
  gastos: Gasto[]
  totalMensual: number
  /** Ganancia por unidad de referencia para punto de equilibrio */
  gananciaPorUnidadRef: number
  onRefresh: () => void
}

export function GastosFijosPuntoEquilibrio({
  gastos,
  totalMensual,
  gananciaPorUnidadRef,
  onRefresh,
}: Props) {
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; nombre: string } | null>(null)
  const [confirming, setConfirming] = useState(false)

  const unidadesEquilibrio = useMemo(() => {
    if (gananciaPorUnidadRef <= 0) return null
    return Math.ceil(totalMensual / gananciaPorUnidadRef)
  }, [totalMensual, gananciaPorUnidadRef])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!edit) return
    await upsertGastoFijo(edit)
    setEdit(null)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm) return
    setConfirming(true)
    try {
      await deleteGastoFijo(confirm.id, confirm.nombre)
      setConfirm(null)
      onRefresh()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-zinc-50 p-4">
        <p className="text-sm text-zinc-600">Total gastos fijos mensuales (prorrateados)</p>
        <p className="text-2xl font-semibold">{formatCOP(totalMensual)}</p>
        {unidadesEquilibrio != null && (
          <p className="mt-2 text-sm">
            Punto de equilibrio (ref. {formatCOP(gananciaPorUnidadRef)}/u):{' '}
            <strong>{unidadesEquilibrio} unidades/mes</strong>
          </p>
        )}
        {gananciaPorUnidadRef <= 0 && (
          <p className="mt-2 text-sm text-amber-700">
            Configura productos y precios en la calculadora para ver el punto de equilibrio.
          </p>
        )}
      </div>

      <button type="button" onClick={() => setEdit({ concepto: '', monto: 0, periodicidad: 'mensual', activo: true })} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">+ Gasto fijo</button>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2 text-left">Periodicidad</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {gastos.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="px-3 py-2">{g.concepto}</td>
                <td className="px-3 py-2 text-right">{formatCOP(g.monto)}</td>
                <td className="px-3 py-2 capitalize">{g.periodicidad}</td>
                <td className="px-3 py-2">
                  <RowActions
                    onEdit={() => setEdit(g as unknown as Record<string, unknown>)}
                    onDelete={() => setConfirm({ id: g.id, nombre: g.concepto })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <form onSubmit={save} className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Concepto</span>
            <input
              value={String(edit.concepto ?? '')}
              onChange={(e) => setEdit({ ...edit, concepto: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Monto</span>
            <CurrencyInput
              value={edit.monto != null ? Number(edit.monto) : null}
              onChange={(monto) => setEdit({ ...edit, monto: monto ?? 0 })}
              className="text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Periodicidad</span>
            <select
              value={String(edit.periodicidad ?? 'mensual')}
              onChange={(e) => setEdit({ ...edit, periodicidad: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
              <option value="unico">Único</option>
            </select>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">Guardar</button>
            <button type="button" onClick={() => setEdit(null)} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Eliminar gasto fijo"
        message={
          confirm
            ? `¿Seguro que quieres eliminar "${confirm.nombre}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirming={confirming}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
