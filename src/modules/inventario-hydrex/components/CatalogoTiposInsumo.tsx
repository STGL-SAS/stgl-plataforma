'use client'

import { useState } from 'react'
import { deleteTipoInsumo } from '../actions/deletes'
import { upsertTipoInsumo } from '../actions/mutations'
import type { HydrexTipoInsumo } from '../lib/tipos'
import { ConfirmDialog } from './ConfirmDialog'
import { NumberInput } from '@/components/NumberInput'
import { RowActions } from './RowActions'

interface Props {
  tipos: HydrexTipoInsumo[]
  onRefresh: () => void
}

export function CatalogoTiposInsumo({ tipos, onRefresh }: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<HydrexTipoInsumo> | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState<{ id: string; nombre: string } | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setLoading(true)
    try {
      await upsertTipoInsumo(editing)
      setEditing(null)
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  function startNew() {
    setOpen(true)
    setEditing({
      codigo: '',
      nombre: '',
      label_atributo_1: 'Tipo',
      label_atributo_2: 'Talla',
      requiere_atributo_2: true,
      usa_costo_arte: false,
      activo: true,
      orden: tipos.length + 1,
    })
  }

  async function handleDelete() {
    if (!confirm) return
    setConfirming(true)
    try {
      await deleteTipoInsumo(confirm.id, confirm.nombre)
      setConfirm(null)
      onRefresh()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
      >
        <span>Categorías de insumo</span>
        <span className="text-zinc-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-zinc-200 px-4 py-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={startNew}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + categoría
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2.5 text-left">Código</th>
                  <th className="px-3 py-2.5 text-left">Nombre</th>
                  <th className="px-3 py-2.5 text-left">Label attr. 1</th>
                  <th className="px-3 py-2.5 text-left">Label attr. 2</th>
                  <th className="px-3 py-2.5 text-center">Req. attr. 2</th>
                  <th className="px-3 py-2.5 text-center">Costo arte</th>
                  <th className="px-3 py-2.5 text-right">Orden</th>
                  <th className="px-3 py-2.5 text-center">Activo</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {tipos.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2.5 font-mono text-xs">{t.codigo}</td>
                    <td className="px-3 py-2.5 font-medium">{t.nombre}</td>
                    <td className="px-3 py-2.5">{t.label_atributo_1}</td>
                    <td className="px-3 py-2.5">{t.label_atributo_2 ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center">{t.requiere_atributo_2 ? 'Sí' : 'No'}</td>
                    <td className="px-3 py-2.5 text-center">{t.usa_costo_arte ? 'Sí' : 'No'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{t.orden}</td>
                    <td className="px-3 py-2.5 text-center">{t.activo ? 'Sí' : 'No'}</td>
                    <td className="px-3 py-2.5">
                      <RowActions
                        onEdit={() => {
                          setOpen(true)
                          setEditing(t)
                        }}
                        onDelete={() => setConfirm({ id: t.id, nombre: t.nombre })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editing && (
            <form onSubmit={save} className="rounded-lg border border-zinc-200 p-4 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Código</span>
                <input
                  value={editing.codigo ?? ''}
                  onChange={(e) => setEditing({ ...editing, codigo: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="rounded-md border px-3 py-2 text-sm"
                  required
                  disabled={Boolean(editing.id)}
                />
                <span className="text-xs text-zinc-500">Slug interno, ej. cordon</span>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Nombre visible</span>
                <input
                  value={editing.nombre ?? ''}
                  onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                  className="rounded-md border px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Etiqueta del atributo 1</span>
                <input
                  value={editing.label_atributo_1 ?? ''}
                  onChange={(e) => setEditing({ ...editing, label_atributo_1: e.target.value })}
                  className="rounded-md border px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Etiqueta del atributo 2</span>
                <input
                  value={editing.label_atributo_2 ?? ''}
                  onChange={(e) => setEditing({ ...editing, label_atributo_2: e.target.value || null })}
                  className="rounded-md border px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.requiere_atributo_2 ?? true}
                  onChange={(e) => setEditing({ ...editing, requiere_atributo_2: e.target.checked })}
                />
                Requiere atributo 2
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.usa_costo_arte ?? false}
                  onChange={(e) => setEditing({ ...editing, usa_costo_arte: e.target.checked })}
                />
                Usa costo de arte
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Orden</span>
                <NumberInput
                  integer
                  value={editing.orden != null ? Number(editing.orden) : null}
                  onChange={(orden) => setEditing({ ...editing, orden: orden ?? 0 })}
                  className="text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.activo ?? true}
                  onChange={(e) => setEditing({ ...editing, activo: e.target.checked })}
                />
                Activo
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
                  Guardar
                </button>
                <button type="button" onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Eliminar categoría"
        message={
          confirm
            ? `¿Seguro que quieres eliminar "${confirm.nombre}"? Si tiene insumos asociados se desactivará en vez de eliminarse.`
            : ''
        }
        confirming={confirming}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
