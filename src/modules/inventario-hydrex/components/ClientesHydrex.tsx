'use client'

import { useEffect, useState } from 'react'
import { deleteCliente } from '../actions/deletes'
import { upsertCliente } from '../actions/mutations'
import {
  buildClienteContacto,
  contactoFromRecord,
  resumenContactoCliente,
} from '../lib/cliente-contacto'
import { getVentasCliente } from '../lib/queries'
import { formatCOP } from '../lib/motor-calculo'
import { ConfirmDialog } from './ConfirmDialog'
import { RowActions } from './RowActions'

interface Cliente {
  id: string
  nombre: string
  contacto: Record<string, unknown>
  notas: string | null
}

interface ClienteEditState {
  id?: string
  nombre: string
  telefono: string
  email: string
  direccion: string
  notas: string
}

interface Props {
  clientes: Cliente[]
  onRefresh: () => void
}

function toEditState(cliente: Cliente | null): ClienteEditState {
  if (!cliente) {
    return { nombre: '', telefono: '', email: '', direccion: '', notas: '' }
  }
  const contacto = contactoFromRecord(cliente.contacto)
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    telefono: contacto.telefono,
    email: contacto.email,
    direccion: contacto.direccion,
    notas: cliente.notas ?? '',
  }
}

export function ClientesHydrex({ clientes, onRefresh }: Props) {
  const [edit, setEdit] = useState<ClienteEditState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ventas, setVentas] = useState<Record<string, unknown>[]>([])
  const [confirm, setConfirm] = useState<{ id: string; nombre: string } | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!selectedId) {
      setVentas([])
      return
    }
    getVentasCliente(selectedId).then(setVentas).catch(() => setVentas([]))
  }, [selectedId])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!edit) return
    await upsertCliente({
      id: edit.id,
      nombre: edit.nombre.trim(),
      notas: edit.notas.trim() || null,
      contacto: buildClienteContacto(edit),
    })
    setEdit(null)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm) return
    setConfirming(true)
    try {
      const result = await deleteCliente(confirm.id, confirm.nombre)
      if (result.action === 'blocked') {
        alert(result.message)
      } else {
        if (selectedId === confirm.id) setSelectedId(null)
        setConfirm(null)
        onRefresh()
      }
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setEdit(toEditState(null))}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
      >
        + Cliente
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        <ul className="rounded-lg border divide-y text-sm">
          {clientes.map((c) => {
            const contacto = resumenContactoCliente(c.contacto)
            return (
              <li key={c.id} className="px-4 py-2 flex justify-between items-center gap-3">
                <button
                  type="button"
                  className="text-left hover:underline min-w-0"
                  onClick={() => setSelectedId(c.id)}
                >
                  <span className="font-medium">{c.nombre}</span>
                  {contacto && (
                    <span className="block text-xs text-zinc-500 truncate">{contacto}</span>
                  )}
                </button>
                <RowActions
                  onEdit={() => setEdit(toEditState(c))}
                  onDelete={() => setConfirm({ id: c.id, nombre: c.nombre })}
                />
              </li>
            )
          })}
        </ul>

        <div>
          <h3 className="mb-2 font-medium text-sm">Historial de compras</h3>
          {!selectedId ? (
            <p className="text-sm text-zinc-500">Selecciona un cliente.</p>
          ) : ventas.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin ventas registradas.</p>
          ) : (
            <ul className="rounded-lg border divide-y text-sm">
              {ventas.map((v) => {
                const prod = v.hydrex_productos as { nombre: string } | null
                const tx = v.transacciones as { fecha: string; monto: number } | null
                return (
                  <li key={String(v.id)} className="px-4 py-2">
                    <p>{prod?.nombre ?? '—'} × {String(v.cantidad)}</p>
                    <p className="text-xs text-zinc-500">{tx?.fecha} — {formatCOP(Number(tx?.monto ?? 0))}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {edit && (
        <form onSubmit={save} className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Nombre</span>
            <input
              value={edit.nombre}
              onChange={(e) => setEdit({ ...edit, nombre: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Teléfono</span>
            <input
              type="tel"
              value={edit.telefono}
              onChange={(e) => setEdit({ ...edit, telefono: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Email</span>
            <input
              type="email"
              value={edit.email}
              onChange={(e) => setEdit({ ...edit, email: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Dirección (opcional)</span>
            <input
              value={edit.direccion}
              onChange={(e) => setEdit({ ...edit, direccion: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Notas</span>
            <input
              value={edit.notas}
              onChange={(e) => setEdit({ ...edit, notas: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEdit(null)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Eliminar cliente"
        message={
          confirm
            ? `¿Seguro que quieres eliminar "${confirm.nombre}"? Si tiene ventas asociadas no se podrá eliminar.`
            : ''
        }
        confirming={confirming}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
