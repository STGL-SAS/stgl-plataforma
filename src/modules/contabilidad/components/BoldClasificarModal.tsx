'use client'

import { useState } from 'react'
import { clasificarTransaccionBold } from '../actions/transacciones'
import type { Transaccion } from '../types'
import { formatCOP, formatFecha } from '../utils'

interface Props {
  transaccion: Transaccion | null
  categoriasSugeridas: string[]
  onClose: () => void
  onSuccess: () => void
}

export function BoldClasificarModal({
  transaccion,
  categoriasSugeridas,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!transaccion) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    try {
      await clasificarTransaccionBold(
        transaccion!.id,
        fd.get('nombre_interno') as string,
        fd.get('categoria') as string,
        (fd.get('observaciones') as string) || undefined
      )
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al clasificar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Clasificar transacción Bold</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {transaccion.nombre_original} · {formatFecha(transaccion.fecha)} ·{' '}
          {formatCOP(transaccion.monto)}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Nombre interno</span>
            <input
              name="nombre_interno"
              required
              defaultValue={transaccion.nombre_original ?? ''}
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Categoría</span>
            <input
              name="categoria"
              list="bold-categorias"
              required
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
            <datalist id="bold-categorias">
              {categoriasSugeridas.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Observaciones (opcional)</span>
            <textarea
              name="observaciones"
              rows={2}
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
