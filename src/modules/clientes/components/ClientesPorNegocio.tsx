'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  buildClienteContacto,
  contactoFromRecord,
  resumenContactoCliente,
} from '@/modules/inventario-hydrex/lib/cliente-contacto'
import {
  deleteClienteNegocio,
  getClientesByNegocio,
  upsertClienteNegocio,
} from '../lib/actions'
import { RowActions } from '@/components/ui/RowActions'

type NegocioOption = { id: string; codigo: string; nombre: string }

type Cliente = {
  id: string
  nombre: string
  contacto: Record<string, unknown>
  notas: string | null
}

interface Props {
  negocios: NegocioOption[]
  initialNegocioId?: string
}

export function ClientesPorNegocio({ negocios, initialNegocioId }: Props) {
  const router = useRouter()
  const defaultId =
    initialNegocioId ||
    negocios.find((n) => n.codigo === 'HANGARC')?.id ||
    negocios[0]?.id ||
    ''
  const [negocioId, setNegocioId] = useState(defaultId)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [edit, setEdit] = useState<{
    id?: string
    nombre: string
    telefono: string
    email: string
    direccion: string
    notas: string
  } | null>(null)

  async function load(id: string) {
    if (!id) {
      setClientes([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await getClientesByNegocio(id)
      setClientes(
        rows.map((c) => ({
          id: c.id as string,
          nombre: c.nombre as string,
          contacto: (c.contacto as Record<string, unknown>) ?? {},
          notas: (c.notas as string | null) ?? null,
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(negocioId)
  }, [negocioId])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!edit || !negocioId) return
    await upsertClienteNegocio({
      id: edit.id,
      negocio_id: negocioId,
      nombre: edit.nombre.trim(),
      notas: edit.notas.trim() || null,
      contacto: buildClienteContacto(edit),
    })
    setEdit(null)
    await load(negocioId)
    router.refresh()
  }

  const negocioActual = negocios.find((n) => n.id === negocioId)

  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-1 text-sm max-w-xs">
        <span className="font-medium">Negocio</span>
        <select
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={negocioId}
          onChange={(e) => setNegocioId(e.target.value)}
        >
          {negocios.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </label>

      <p className="text-sm text-zinc-600">
        Base de clientes de {negocioActual?.nombre ?? '…'} (separada por negocio).
      </p>

      <button
        type="button"
        onClick={() =>
          setEdit({ nombre: '', telefono: '', email: '', direccion: '', notas: '' })
        }
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
        disabled={!negocioId}
      >
        + Nuevo cliente
      </button>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {edit && (
        <form onSubmit={save} className="max-w-md space-y-3 rounded-lg border bg-white p-6 text-sm">
          <input
            required
            placeholder="Nombre"
            className="w-full rounded-md border px-3 py-2"
            value={edit.nombre}
            onChange={(e) => setEdit({ ...edit, nombre: e.target.value })}
          />
          <input
            placeholder="Teléfono"
            className="w-full rounded-md border px-3 py-2"
            value={edit.telefono}
            onChange={(e) => setEdit({ ...edit, telefono: e.target.value })}
          />
          <input
            placeholder="Email"
            className="w-full rounded-md border px-3 py-2"
            value={edit.email}
            onChange={(e) => setEdit({ ...edit, email: e.target.value })}
          />
          <input
            placeholder="Dirección"
            className="w-full rounded-md border px-3 py-2"
            value={edit.direccion}
            onChange={(e) => setEdit({ ...edit, direccion: e.target.value })}
          />
          <textarea
            placeholder="Notas"
            rows={2}
            className="w-full rounded-md border px-3 py-2"
            value={edit.notas}
            onChange={(e) => setEdit({ ...edit, notas: e.target.value })}
          />
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-white">
              Guardar
            </button>
            <button type="button" onClick={() => setEdit(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-white">
          {clientes.length === 0 && (
            <li className="px-4 py-6 text-sm text-zinc-500">No hay clientes en este negocio.</li>
          )}
          {clientes.map((c) => {
            const contacto = contactoFromRecord(c.contacto)
            return (
              <li key={c.id} className="flex items-start justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{c.nombre}</p>
                  <p className="text-sm text-zinc-500">{resumenContactoCliente(contacto)}</p>
                  {c.notas && <p className="mt-1 text-xs text-zinc-500">{c.notas}</p>}
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
                  onDelete={async () => {
                    await deleteClienteNegocio(c.id)
                    await load(negocioId)
                  }}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
