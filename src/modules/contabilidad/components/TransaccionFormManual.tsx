'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createTransaccionManual } from '../actions/transacciones'
import type { CuentaBancaria, Negocio, TipoTransaccionManual } from '../types'

interface Props {
  negocios: Negocio[]
  cuentas: CuentaBancaria[]
  categoriasSugeridas: string[]
}

export function TransaccionFormManual({ negocios, cuentas, categoriasSugeridas }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hoy = new Date().toISOString().slice(0, 10)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    try {
      await createTransaccionManual({
        negocio_id: fd.get('negocio_id') as string,
        cuenta_id: fd.get('cuenta_id') as string,
        tipo: fd.get('tipo') as TipoTransaccionManual,
        categoria: fd.get('categoria') as string,
        monto: Number(fd.get('monto')),
        fecha: fd.get('fecha') as string,
        nombre_interno: fd.get('nombre_interno') as string,
        observaciones: (fd.get('observaciones') as string) || undefined,
      })
      router.push('/contabilidad/transacciones')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Negocio</span>
        <select name="negocio_id" required className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="">Seleccionar…</option>
          {negocios.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Cuenta bancaria</span>
        <select name="cuenta_id" required className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="">Seleccionar…</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Tipo</span>
        <select name="tipo" required className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Categoría</span>
        <input
          name="categoria"
          list="categorias-sugeridas"
          required
          placeholder="Ej: nómina, insumos, venta web…"
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
        <datalist id="categorias-sugeridas">
          {categoriasSugeridas.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Monto</span>
          <input
            name="monto"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Fecha</span>
          <input
            name="fecha"
            type="date"
            required
            defaultValue={hoy}
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Nombre interno</span>
        <input
          name="nombre_interno"
          required
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Observaciones</span>
        <textarea
          name="observaciones"
          rows={3}
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? 'Guardando…' : 'Guardar transacción'}
        </button>
      </div>
    </form>
  )
}
