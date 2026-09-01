'use client'

import { useState } from 'react'
import { deleteCompra, deleteProveedor } from '../actions/deletes'
import { crearCompra, upsertProveedor } from '../actions/mutations'
import { CREAR_NUEVO_INSUMO } from '../lib/constants'
import type { HydrexInsumo, HydrexTipoInsumo } from '../lib/tipos'
import { formatCOP } from '../lib/motor-calculo'
import { ConfirmDialog } from './ConfirmDialog'
import { CurrencyInput } from './CurrencyInput'
import { InsumoForm } from './InsumoForm'
import { NumberInput } from '@/components/NumberInput'
import { RowActions } from './RowActions'

interface Props {
  proveedores: Record<string, unknown>[]
  insumos: HydrexInsumo[]
  tipos: HydrexTipoInsumo[]
  compras: Record<string, unknown>[]
  onRefresh: () => void
  /** Actualiza insumos localmente sin recargar todo el formulario de compra */
  onInsumosChange?: (insumos: HydrexInsumo[]) => void
}

export function ProveedoresCompras({
  proveedores,
  insumos,
  tipos,
  compras,
  onRefresh,
  onInsumosChange,
}: Props) {
  const [editProv, setEditProv] = useState<Record<string, unknown> | null>(null)
  const [compra, setCompra] = useState<Record<string, unknown> | null>(null)
  const [showInsumoForm, setShowInsumoForm] = useState(false)
  const [confirm, setConfirm] = useState<{
    type: 'proveedor' | 'compra'
    id: string
    nombre: string
  } | null>(null)
  const [confirming, setConfirming] = useState(false)

  const insumosActivos = insumos.filter((i) => i.activo)

  async function saveProv(e: React.FormEvent) {
    e.preventDefault()
    if (!editProv) return
    await upsertProveedor(editProv)
    setEditProv(null)
    onRefresh()
  }

  async function saveCompra(e: React.FormEvent) {
    e.preventDefault()
    if (!compra?.insumo_id || compra.insumo_id === CREAR_NUEVO_INSUMO) return
    await crearCompra({
      proveedor_id: String(compra.proveedor_id),
      insumo_id: String(compra.insumo_id),
      cantidad: Number(compra.cantidad),
      valor_total: Number(compra.valor_total),
      fecha: String(compra.fecha ?? new Date().toISOString().slice(0, 10)),
      documento_url: compra.documento_url ? String(compra.documento_url) : undefined,
      notas: compra.notas ? String(compra.notas) : undefined,
    })
    setCompra(null)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm) return
    setConfirming(true)
    try {
      if (confirm.type === 'proveedor') {
        const result = await deleteProveedor(confirm.id, confirm.nombre)
        if (result.action === 'blocked') {
          alert(result.message)
        }
      } else {
        await deleteCompra(confirm.id)
      }
      setConfirm(null)
      onRefresh()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <button
          type="button"
          onClick={() => setEditProv({ nombre: '' })}
          className="mb-3 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          + Proveedor
        </button>
        <ul className="rounded-lg border divide-y text-sm">
          {proveedores.map((p) => (
            <li key={String(p.id)} className="px-4 py-2 flex justify-between items-center">
              <span>{String(p.nombre)}</span>
              <RowActions
                onEdit={() => setEditProv(p)}
                onDelete={() =>
                  setConfirm({ type: 'proveedor', id: String(p.id), nombre: String(p.nombre) })
                }
              />
            </li>
          ))}
        </ul>
      </section>

      {editProv && (
        <form onSubmit={saveProv} className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Nombre</span>
            <input
              value={String(editProv.nombre ?? '')}
              onChange={(e) => setEditProv({ ...editProv, nombre: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Contacto</span>
            <input
              value={String(editProv.contacto ?? '')}
              onChange={(e) => setEditProv({ ...editProv, contacto: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Teléfono</span>
            <input
              value={String(editProv.telefono ?? '')}
              onChange={(e) => setEditProv({ ...editProv, telefono: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Email</span>
            <input
              value={String(editProv.email ?? '')}
              onChange={(e) => setEditProv({ ...editProv, email: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
              Guardar
            </button>
            <button type="button" onClick={() => setEditProv(null)} className="rounded-md border px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section>
        <button
          type="button"
          onClick={() =>
            setCompra({
              proveedor_id: proveedores[0]?.id,
              insumo_id: insumosActivos[0]?.id ?? '',
              cantidad: 1,
              valor_total: 0,
              fecha: new Date().toISOString().slice(0, 10),
            })
          }
          className="mb-3 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          + Compra
        </button>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Proveedor</th>
                <th className="px-3 py-2 text-left">Insumo</th>
                <th className="px-3 py-2 text-right">Cant.</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Costo/u</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => {
                const prov = c.proveedores as { nombre: string } | null
                const ins = c.hydrex_insumos as { nombre: string } | null
                return (
                  <tr key={String(c.id)} className="border-t">
                    <td className="px-3 py-2">{String(c.fecha)}</td>
                    <td className="px-3 py-2">{prov?.nombre ?? '—'}</td>
                    <td className="px-3 py-2">{ins?.nombre ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{String(c.cantidad)}</td>
                    <td className="px-3 py-2 text-right">{formatCOP(Number(c.valor_total))}</td>
                    <td className="px-3 py-2 text-right">{formatCOP(Number(c.costo_unitario))}</td>
                    <td className="px-3 py-2">
                      <RowActions
                        onDelete={() =>
                          setConfirm({
                            type: 'compra',
                            id: String(c.id),
                            nombre: `${ins?.nombre ?? 'Compra'} — ${String(c.fecha)}`,
                          })
                        }
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {compra && (
        <form onSubmit={saveCompra} className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Proveedor</span>
            <select
              value={String(compra.proveedor_id ?? '')}
              onChange={(e) => setCompra({ ...compra, proveedor_id: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            >
              {proveedores.map((p) => (
                <option key={String(p.id)} value={String(p.id)}>
                  {String(p.nombre)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Insumo</span>
            <select
              value={String(compra.insumo_id ?? '')}
              onChange={(e) => {
                if (e.target.value === CREAR_NUEVO_INSUMO) {
                  setShowInsumoForm(true)
                  return
                }
                setCompra({ ...compra, insumo_id: e.target.value })
              }}
              className="rounded-md border px-3 py-2 text-sm"
            >
              {insumosActivos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
              <option value={CREAR_NUEVO_INSUMO}>+ Crear nuevo insumo</option>
            </select>
          </label>

          {showInsumoForm && (
            <div className="sm:col-span-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
              <p className="mb-3 text-sm font-medium text-blue-900">Nuevo insumo</p>
              <InsumoForm
                tipos={tipos}
                submitLabel="Crear y seleccionar"
                onSaved={async (saved) => {
                  onInsumosChange?.([...insumos, saved as HydrexInsumo])
                  setCompra({ ...compra, insumo_id: String(saved.id) })
                  setShowInsumoForm(false)
                }}
                onCancel={() => setShowInsumoForm(false)}
              />
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Cantidad</span>
            <NumberInput
              integer
              min={1}
              emptyWhenZero={false}
              value={compra.cantidad != null ? Number(compra.cantidad) : null}
              onChange={(cantidad) => setCompra({ ...compra, cantidad: cantidad ?? 1 })}
              className="text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Valor total</span>
            <CurrencyInput
              value={compra.valor_total != null ? Number(compra.valor_total) : null}
              onChange={(valor_total) => setCompra({ ...compra, valor_total: valor_total ?? 0 })}
              className="text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Fecha</span>
            <input
              type="date"
              value={String(compra.fecha ?? '')}
              onChange={(e) => setCompra({ ...compra, fecha: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Link OneDrive (texto)</span>
            <input
              value={String(compra.documento_url ?? '')}
              onChange={(e) => setCompra({ ...compra, documento_url: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={!compra.insumo_id || compra.insumo_id === CREAR_NUEVO_INSUMO}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Registrar compra
            </button>
            <button type="button" onClick={() => setCompra(null)} className="rounded-md border px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === 'compra' ? 'Eliminar compra' : 'Eliminar proveedor'}
        message={
          confirm
            ? confirm.type === 'compra'
              ? `¿Seguro que quieres eliminar la compra "${confirm.nombre}"? Los movimientos de inventario ya generados permanecen en el historial.`
              : `¿Seguro que quieres eliminar "${confirm.nombre}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirming={confirming}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
