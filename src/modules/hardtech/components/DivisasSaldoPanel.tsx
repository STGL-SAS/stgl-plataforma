'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { registrarIngresoDivisas } from '../actions/mutations'
import { formatCOP, formatUSD } from '../motor-calculo'

interface Props {
  saldoUsd: number
  tasaReciente: number | null
  movimientos: {
    id: string
    tipo: string
    monto: number
    fecha: string
    nombre_interno: string | null
    categoria: string | null
  }[]
}

export function DivisasSaldoPanel({ saldoUsd, tasaReciente, movimientos }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ monto: '', fecha: new Date().toISOString().slice(0, 10), nota: '' })

  const equivalenteCop = tasaReciente != null ? saldoUsd * tasaReciente : null

  async function recargar(e: React.FormEvent) {
    e.preventDefault()
    await registrarIngresoDivisas({
      monto: Number(form.monto),
      fecha: form.fecha,
      nombre_interno: 'Recarga saldo USD HARDTECH',
      observaciones: form.nota || undefined,
    })
    setForm({ ...form, monto: '', nota: '' })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-zinc-600">Saldo actual USD</p>
          <p className="text-3xl font-semibold mt-1">{formatUSD(saldoUsd)}</p>
          {equivalenteCop != null && (
            <p className="text-sm text-zinc-500 mt-2">≈ {formatCOP(equivalenteCop)} COP (tasa {tasaReciente?.toLocaleString('es-CO')})</p>
          )}
        </div>
      </div>

      <form onSubmit={recargar} className="rounded-lg border bg-white p-6 max-w-md space-y-3 text-sm">
        <h2 className="font-semibold">Registrar ingreso USD (recarga plataforma)</h2>
        <input required type="number" step="0.01" placeholder="Monto USD" className="w-full rounded-md border px-3 py-2" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
        <input type="date" className="w-full rounded-md border px-3 py-2" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        <input placeholder="Nota" className="w-full rounded-md border px-3 py-2" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-white">Registrar ingreso</button>
      </form>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-right">USD</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="px-4 py-3">{m.fecha}</td>
                <td className="px-4 py-3 capitalize">{m.tipo}</td>
                <td className="px-4 py-3">{m.nombre_interno}</td>
                <td className="px-4 py-3 text-right">{m.tipo === 'egreso' ? '−' : '+'}{formatUSD(m.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
