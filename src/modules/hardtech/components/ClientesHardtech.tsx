'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteClienteHardtech, upsertClienteHardtech } from '../actions/mutations'
import { RowActions } from '@/components/ui/RowActions'
import {
  buildClienteContacto,
  contactoFromRecord,
  resumenContactoCliente,
} from '@/modules/inventario-hydrex/lib/cliente-contacto'

interface Cliente {
  id: string
  nombre: string
  contacto: Record<string, unknown>
  notas: string | null
}

interface Props {
  clientes: Cliente[]
}

export function ClientesHardtech({ clientes }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [edit, setEdit] = useState<{
    id?: string
    nombre: string
    telefono: string
    email: string
    direccion: string
    notas: string
  } | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!edit) return
    setError(null)
    try {
      await upsertClienteHardtech({
        id: edit.id,
        nombre: edit.nombre.trim(),
        notas: edit.notas.trim() || null,
        contacto: buildClienteContacto(edit),
      })
      setEdit(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el cliente')
    }
  }

  async function eliminarCliente(c: Cliente) {
    if (
      !window.confirm(
        `¿Eliminar a «${c.nombre}»? Esta acción no se puede deshacer.`
      )
    ) {
      return
    }
    setDeletingId(c.id)
    setError(null)
    try {
      const result = await deleteClienteHardtech(c.id, c.nombre)
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el cliente')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <button
        type="button"
        onClick={() => setEdit({ nombre: '', telefono: '', email: '', direccion: '', notas: '' })}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
      >
        + Nuevo cliente
      </button>

      {edit && (
        <form onSubmit={save} className="rounded-lg border bg-white p-6 space-y-3 max-w-md text-sm">
          <input required placeholder="Nombre" className="w-full rounded-md border px-3 py-2" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
          <input placeholder="Teléfono" className="w-full rounded-md border px-3 py-2" value={edit.telefono} onChange={(e) => setEdit({ ...edit, telefono: e.target.value })} />
          <input placeholder="Email" className="w-full rounded-md border px-3 py-2" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
          <input placeholder="Dirección" className="w-full rounded-md border px-3 py-2" value={edit.direccion} onChange={(e) => setEdit({ ...edit, direccion: e.target.value })} />
          <textarea placeholder="Notas" rows={2} className="w-full rounded-md border px-3 py-2" value={edit.notas} onChange={(e) => setEdit({ ...edit, notas: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-white">Guardar</button>
            <button type="button" onClick={() => setEdit(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <ul className="rounded-lg border bg-white divide-y">
        {clientes.map((c) => {
          const contacto = contactoFromRecord(c.contacto)
          return (
            <li key={c.id} className="px-4 py-3 flex justify-between items-start">
              <div>
                <p className="font-medium">{c.nombre}</p>
                <p className="text-sm text-zinc-500">{resumenContactoCliente(contacto)}</p>
              </div>
              <RowActions
                onEdit={() =>
                  setEdit({
                    id: c.id,
                    nombre: c.nombre,
                    telefono: contacto.telefono,
                    email: contacto.email,
                    direccion: contacto.direccion,
                    notas: c.notas ?? '',
                  })
                }
                onDelete={
                  deletingId === c.id
                    ? undefined
                    : () => void eliminarCliente(c)
                }
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
