'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { crearPagoSocioHardtech, deletePagoSocioHardtech } from '../actions/mutations'
import { DeleteIconButton } from '@/components/ui/IconAction'
import { calcularSaldoSocios, formatCOP } from '../motor-calculo'
import type { HardtechPagoSocio, HardtechPagoSocioTipo } from '../lib/tipos'
import { TIPOS_PAGO_SOCIO } from '../lib/tipos'

interface Socio { id: string; nombre: string }

interface Props {
  pagos: HardtechPagoSocio[]
  socios: Socio[]
}

export function PagosSociosPanel({ pagos, socios }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    socio_id: '',
    tipo: 'socio_puso_plata' as HardtechPagoSocioTipo,
    monto: '',
    fecha: new Date().toISOString().slice(0, 10),
    nota: '',
  })

  const saldosCalc = calcularSaldoSocios(
    pagos.map((p) => ({
      socio_id: p.socio_id,
      socio_nombre: p.socios?.nombre,
      tipo: p.tipo,
      monto: p.monto,
    })),
    socios
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await crearPagoSocioHardtech({
      socio_id: form.socio_id,
      tipo: form.tipo,
      monto: Number(form.monto),
      fecha: form.fecha,
      nota: form.nota || null,
    })
    setForm({ ...form, monto: '', nota: '' })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {saldosCalc.map((s) => (
          <div key={s.socio_id} className="rounded-lg border bg-white p-4">
            <p className="font-medium">{s.socio_nombre}</p>
            <p className="text-sm text-zinc-600 mt-1">
              Puso: {formatCOP(s.total_puesto)} · Recibió: {formatCOP(s.total_recibido)}
            </p>
            <p className={`mt-2 text-lg font-semibold ${s.saldo_neto >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {s.saldo_neto >= 0
                ? `HARDTECH le debe: ${formatCOP(s.saldo_neto)}`
                : `Debe a HARDTECH: ${formatCOP(Math.abs(s.saldo_neto))}`}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="rounded-lg border bg-white p-6 grid gap-3 sm:grid-cols-2 max-w-2xl text-sm">
        <h2 className="font-semibold sm:col-span-2">Registrar movimiento</h2>
        <select required className="rounded-md border px-3 py-2" value={form.socio_id} onChange={(e) => setForm({ ...form, socio_id: e.target.value })}>
          <option value="">Socio…</option>
          {socios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <select className="rounded-md border px-3 py-2" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as HardtechPagoSocioTipo })}>
          {TIPOS_PAGO_SOCIO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input required type="number" placeholder="Monto" className="rounded-md border px-3 py-2" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
        <input type="date" className="rounded-md border px-3 py-2" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        <input placeholder="Nota" className="rounded-md border px-3 py-2 sm:col-span-2" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
        <button type="submit" className="sm:col-span-2 rounded-md bg-zinc-900 px-4 py-2 text-white">Registrar</button>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Socio</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-4 py-3">{p.fecha}</td>
                <td className="px-4 py-3">{p.socios?.nombre}</td>
                <td className="px-4 py-3">{TIPOS_PAGO_SOCIO.find((t) => t.value === p.tipo)?.label}</td>
                <td className="px-4 py-3 text-right">{formatCOP(p.monto)}</td>
                <td className="px-4 py-3">
                  <DeleteIconButton
                    onClick={async () => {
                      await deletePagoSocioHardtech(p.id)
                      router.refresh()
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
