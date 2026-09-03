'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteMantenimientoHardtech, upsertMantenimientoHardtech } from '../actions/mutations'
import { RowActions } from '@/components/ui/RowActions'
import { calcularGananciaMantenimiento, formatCOP } from '../motor-calculo'
import type { HardtechMantenimiento } from '../lib/tipos'

interface Cliente { id: string; nombre: string }

interface Props {
  mantenimientos: HardtechMantenimiento[]
  clientes: Cliente[]
}

const emptyForm = () => ({
  id: undefined as string | undefined,
  cliente_id: '',
  titulo: '',
  descripcion: '',
  fecha: new Date().toISOString().slice(0, 10),
  anticipo_monto: '',
  anticipo_fecha: '',
  pago_final_monto: '',
  pago_final_fecha: '',
  honorarios_monto: '0',
  honorarios_destinatario: '',
  insumos_monto: '0',
  domicilio_monto: '0',
})

export function MantenimientosPanel({ mantenimientos, clientes }: Props) {
  const router = useRouter()
  const [edit, setEdit] = useState(emptyForm())
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const gananciaPreview = calcularGananciaMantenimiento({
    anticipo_monto: edit.anticipo_monto ? Number(edit.anticipo_monto) : null,
    pago_final_monto: edit.pago_final_monto ? Number(edit.pago_final_monto) : null,
    honorarios_monto: edit.honorarios_monto ? Number(edit.honorarios_monto) : null,
    insumos_monto: edit.insumos_monto ? Number(edit.insumos_monto) : null,
    domicilio_monto: edit.domicilio_monto ? Number(edit.domicilio_monto) : null,
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await upsertMantenimientoHardtech({
        id: edit.id,
        cliente_id: edit.cliente_id,
        titulo: edit.titulo,
        descripcion: edit.descripcion || null,
        fecha: edit.fecha,
        anticipo_monto: edit.anticipo_monto ? Number(edit.anticipo_monto) : null,
        anticipo_fecha: edit.anticipo_fecha || null,
        pago_final_monto: edit.pago_final_monto ? Number(edit.pago_final_monto) : null,
        pago_final_fecha: edit.pago_final_fecha || null,
        honorarios_monto: Number(edit.honorarios_monto) || 0,
        honorarios_destinatario: edit.honorarios_destinatario || null,
        insumos_monto: Number(edit.insumos_monto) || 0,
        domicilio_monto: Number(edit.domicilio_monto) || 0,
      })
      setShowForm(false)
      setEdit(emptyForm())
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function openEdit(m: HardtechMantenimiento) {
    setEdit({
      id: m.id,
      cliente_id: m.cliente_id,
      titulo: m.titulo,
      descripcion: m.descripcion ?? '',
      fecha: m.fecha,
      anticipo_monto: m.anticipo_monto?.toString() ?? '',
      anticipo_fecha: m.anticipo_fecha ?? '',
      pago_final_monto: m.pago_final_monto?.toString() ?? '',
      pago_final_fecha: m.pago_final_fecha ?? '',
      honorarios_monto: m.honorarios_monto?.toString() ?? '0',
      honorarios_destinatario: m.honorarios_destinatario ?? '',
      insumos_monto: m.insumos_monto?.toString() ?? '0',
      domicilio_monto: m.domicilio_monto?.toString() ?? '0',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => { setShowForm(true); setEdit(emptyForm()) }}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        + Nuevo mantenimiento
      </button>

      {showForm && (
        <form onSubmit={save} className="rounded-lg border bg-white p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold">{edit.id ? 'Editar' : 'Nuevo'} mantenimiento</h2>
          <select required className="w-full rounded-md border px-3 py-2 text-sm" value={edit.cliente_id} onChange={(e) => setEdit({ ...edit, cliente_id: e.target.value })}>
            <option value="">Cliente…</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input required placeholder="Título" className="w-full rounded-md border px-3 py-2 text-sm" value={edit.titulo} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} />
          <textarea placeholder="Descripción" rows={2} className="w-full rounded-md border px-3 py-2 text-sm" value={edit.descripcion} onChange={(e) => setEdit({ ...edit, descripcion: e.target.value })} />
          <input type="date" className="rounded-md border px-3 py-2 text-sm" value={edit.fecha} onChange={(e) => setEdit({ ...edit, fecha: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <input type="number" placeholder="Anticipo" className="rounded-md border px-3 py-2" value={edit.anticipo_monto} onChange={(e) => setEdit({ ...edit, anticipo_monto: e.target.value })} />
            <input type="date" className="rounded-md border px-3 py-2" value={edit.anticipo_fecha} onChange={(e) => setEdit({ ...edit, anticipo_fecha: e.target.value })} />
            <input type="number" placeholder="Pago final" className="rounded-md border px-3 py-2" value={edit.pago_final_monto} onChange={(e) => setEdit({ ...edit, pago_final_monto: e.target.value })} />
            <input type="date" className="rounded-md border px-3 py-2" value={edit.pago_final_fecha} onChange={(e) => setEdit({ ...edit, pago_final_fecha: e.target.value })} />
            <input type="number" placeholder="Honorarios (técnico externo)" className="rounded-md border px-3 py-2" value={edit.honorarios_monto} onChange={(e) => setEdit({ ...edit, honorarios_monto: e.target.value })} />
            <input placeholder="Destinatario honorarios" className="rounded-md border px-3 py-2" value={edit.honorarios_destinatario} onChange={(e) => setEdit({ ...edit, honorarios_destinatario: e.target.value })} />
            <input type="number" placeholder="Insumos" className="rounded-md border px-3 py-2" value={edit.insumos_monto} onChange={(e) => setEdit({ ...edit, insumos_monto: e.target.value })} />
            <input type="number" placeholder="Domicilio" className="rounded-md border px-3 py-2" value={edit.domicilio_monto} onChange={(e) => setEdit({ ...edit, domicilio_monto: e.target.value })} />
          </div>
          <p className="text-sm font-medium text-emerald-800">Ganancia: {formatCOP(gananciaPreview.ganancia)}</p>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-zinc-600">Cancelar</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Ganancia</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {mantenimientos.map((m) => {
              const g = calcularGananciaMantenimiento(m)
              return (
                <tr key={m.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{m.titulo}</td>
                  <td className="px-4 py-3">{m.clientes?.nombre}</td>
                  <td className="px-4 py-3">{m.fecha}</td>
                  <td className="px-4 py-3 text-right">{formatCOP(g.ganancia)}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => openEdit(m)}
                      onDelete={async () => {
                        await deleteMantenimientoHardtech(m.id)
                        router.refresh()
                      }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
