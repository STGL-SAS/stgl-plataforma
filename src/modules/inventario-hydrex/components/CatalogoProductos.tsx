'use client'

import { useState } from 'react'
import { deletePrecio, deleteProducto } from '../actions/deletes'
import { upsertPrecio, upsertProducto } from '../actions/mutations'
import type { HydrexInsumo, HydrexProducto, HydrexProductoRecetaLinea, PrecioRow } from '../lib/tipos'
import { formatCostoDisplay, formatCOP } from '../lib/motor-calculo'
import { formatRecetaResumen } from '../lib/format-receta'
import { recetaInicialParaTipoProducto } from '../lib/tipo-producto'
import {
  TIPO_PRECIO_OPTIONS,
  tipoPrecioDefault,
  tiposPrecioPermitidos,
} from '../lib/validate-tipo-precio'
import { descuentoFractionToPctUi } from '../lib/descuento-pct'
import { ConfirmDialog } from './ConfirmDialog'
import { CurrencyInput } from './CurrencyInput'
import { NumberInput } from '@/components/NumberInput'
import {
  ProductoRecetaEditor,
  createEmptyRecetaLineas,
  recetaLineaToDraft,
  type RecetaLineaDraft,
} from './ProductoRecetaEditor'
import { RowActions } from './RowActions'

interface ProductoEditState {
  id?: string
  nombre: string
  tipo_producto: 'individual' | 'caja'
  activo: boolean
  receta: RecetaLineaDraft[]
}

interface Props {
  productos: HydrexProducto[]
  productosCosto: HydrexProducto[]
  insumos: HydrexInsumo[]
  recetaMap: Record<string, HydrexProductoRecetaLinea[]>
  stockMap: Record<string, number>
  preciosMap: Record<string, PrecioRow[]>
  onRefresh: () => void
}

function toEditState(
  producto: HydrexProducto | null,
  recetaMap: Record<string, HydrexProductoRecetaLinea[]>,
  insumos: HydrexInsumo[]
): ProductoEditState {
  if (!producto) {
    return {
      nombre: '',
      tipo_producto: 'individual',
      activo: true,
      receta: createEmptyRecetaLineas(insumos),
    }
  }
  const lineas = recetaMap[producto.id] ?? []
  return {
    id: producto.id,
    nombre: producto.nombre,
    tipo_producto: producto.tipo_producto,
    activo: producto.activo,
    receta:
      lineas.length > 0
        ? recetaInicialParaTipoProducto(
            producto.tipo_producto,
            insumos,
            lineas.map(recetaLineaToDraft)
          )
        : recetaInicialParaTipoProducto(
            producto.tipo_producto,
            insumos,
            createEmptyRecetaLineas(insumos)
          ),
  }
}

export function CatalogoProductos({
  productos,
  productosCosto,
  insumos,
  recetaMap,
  stockMap,
  preciosMap,
  onRefresh,
}: Props) {
  const [editing, setEditing] = useState<ProductoEditState | null>(null)
  const [precioEdit, setPrecioEdit] = useState<Record<string, unknown> | null>(null)
  const [confirm, setConfirm] = useState<
    { type: 'producto' | 'precio'; id: string; nombre: string } | null
  >(null)
  const [confirming, setConfirming] = useState(false)
  const [productoError, setProductoError] = useState<string | null>(null)

  const insumoById = new Map(insumos.map((i) => [i.id, i]))
  const productoById = new Map(productos.map((p) => [p.id, p]))

  const precioProducto = precioEdit
    ? productos.find((p) => p.id === precioEdit.producto_id)
    : undefined
  const tiposPrecioOpciones = TIPO_PRECIO_OPTIONS.filter((opt) =>
    precioProducto
      ? tiposPrecioPermitidos(precioProducto.tipo_producto).includes(opt.value)
      : true
  )

  async function saveProducto(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setProductoError(null)
    try {
      await upsertProducto(editing)
      setEditing(null)
      onRefresh()
    } catch (err) {
      setProductoError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  async function savePrecio(e: React.FormEvent) {
    e.preventDefault()
    if (!precioEdit) return
    await upsertPrecio({
      ...precioEdit,
      cantidad_min: Math.trunc(Number(precioEdit.cantidad_min)) || 1,
      precio_unitario: precioEdit.precio_unitario ?? 0,
    })
    setPrecioEdit(null)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm) return
    setConfirming(true)
    try {
      if (confirm.type === 'producto') {
        await deleteProducto(confirm.id, confirm.nombre)
      } else {
        await deletePrecio(confirm.id)
      }
      setConfirm(null)
      onRefresh()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setEditing(toEditState(null, recetaMap, insumos))}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
      >
        + Nuevo producto
      </button>

      {editing && (
        <form onSubmit={saveProducto} className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Nombre</span>
            <input
              value={editing.nombre}
              onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Tipo de producto</span>
            <select
              value={editing.tipo_producto}
              onChange={(e) => {
                const tipo = e.target.value as ProductoEditState['tipo_producto']
                setEditing({
                  ...editing,
                  tipo_producto: tipo,
                  receta: recetaInicialParaTipoProducto(tipo, insumos, editing.receta),
                })
              }}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="individual">Individual</option>
              <option value="caja">Caja</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm self-end pb-2">
            <input
              type="checkbox"
              checked={editing.activo}
              onChange={(e) => setEditing({ ...editing, activo: e.target.checked })}
            />
            Activo
          </label>

          <ProductoRecetaEditor
            insumos={insumos}
            productos={productos}
            productoIdExcluir={editing.id}
            lineas={editing.receta}
            onChange={(receta) => setEditing({ ...editing, receta })}
          />

          {productoError && (
            <p className="sm:col-span-2 text-sm text-red-700">{productoError}</p>
          )}

          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Receta</th>
              <th className="px-3 py-2 text-right">Stock disp. (calc.)</th>
              <th className="px-3 py-2 text-right">Costo/u (auto)</th>
              <th className="px-3 py-2 text-center">Estado</th>
              <th className="px-3 py-2">Precios</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const costo = productosCosto.find((c) => c.id === p.id)
              const precios = preciosMap[p.id] ?? []
              const receta = recetaMap[p.id] ?? []
              const stock = stockMap[p.id]
              return (
                <tr key={p.id} className={`border-t ${!p.activo ? 'opacity-60' : ''}`}>
                  <td className="px-3 py-2 font-medium">{p.nombre}</td>
                  <td className="px-3 py-2 capitalize">{p.tipo_producto}</td>
                  <td className="px-3 py-2 text-xs text-zinc-600 max-w-xs">
                    {receta.length > 0 ? (
                      <ul className="space-y-0.5">
                        {receta.map((l) => (
                          <li key={l.id ?? `${l.insumo_id ?? l.componente_producto_id}-${l.cantidad}`}>
                            {formatRecetaResumen([l], insumoById, productoById)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums font-medium ${
                      stock === undefined
                        ? 'text-zinc-400'
                        : stock <= 0
                          ? 'text-red-600'
                          : 'text-zinc-900'
                    }`}
                  >
                    {stock === undefined ? '—' : stock}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-600">
                    {formatCostoDisplay(costo?.costo_por_unidad)}
                  </td>
                  <td className="px-3 py-2 text-center text-xs">{p.activo ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2">
                    <ul className="text-xs space-y-0.5">
                      {precios.map((pr) => (
                        <li key={pr.id} className="flex items-center justify-between gap-2">
                          <span>
                            {pr.tipo_precio}: {formatCOP(pr.precio_unitario)} (min {pr.cantidad_min}
                            {pr.descuento_pct > 0
                              ? `, dto. ${descuentoFractionToPctUi(pr.descuento_pct)}%`
                              : ''}
                            )
                          </span>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800"
                            onClick={() =>
                              setConfirm({
                                type: 'precio',
                                id: pr.id,
                                nombre: `${pr.tipo_precio} — ${formatCOP(pr.precio_unitario)}`,
                              })
                            }
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="text-blue-600 text-xs mt-1"
                      onClick={() =>
                        setPrecioEdit({
                          producto_id: p.id,
                          tipo_precio: tipoPrecioDefault(p.tipo_producto),
                          cantidad_min: 1,
                          precio_unitario: 0,
                          descuento_pct_ui: 0,
                        })
                      }
                    >
                      + precio
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <RowActions
                      onEdit={() => setEditing(toEditState(p, recetaMap, insumos))}
                      onDelete={() => setConfirm({ type: 'producto', id: p.id, nombre: p.nombre })}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {precioEdit && (
        <form onSubmit={savePrecio} className="rounded-lg border p-4 grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Tipo de precio</span>
            <select
              value={String(precioEdit.tipo_precio)}
              onChange={(e) => setPrecioEdit({ ...precioEdit, tipo_precio: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            >
              {tiposPrecioOpciones.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Cantidad mínima</span>
            <NumberInput
              integer
              min={1}
              value={precioEdit.cantidad_min != null ? Number(precioEdit.cantidad_min) : null}
              onChange={(cantidad_min) =>
                setPrecioEdit({ ...precioEdit, cantidad_min: cantidad_min ?? 0 })
              }
              className="text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Precio unitario</span>
            <CurrencyInput
              value={precioEdit.precio_unitario != null ? Number(precioEdit.precio_unitario) : null}
              onChange={(precio_unitario) =>
                setPrecioEdit({ ...precioEdit, precio_unitario: precio_unitario ?? 0 })
              }
              className="text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Descuento (%)</span>
            <NumberInput
              value={precioEdit.descuento_pct_ui != null ? Number(precioEdit.descuento_pct_ui) : null}
              onChange={(descuento_pct_ui) =>
                setPrecioEdit({ ...precioEdit, descuento_pct_ui: descuento_pct_ui ?? 0 })
              }
              className="text-sm"
            />
            <span className="text-xs text-zinc-500">Ej.: 10 = 10% de descuento</span>
          </label>
          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
              Guardar precio
            </button>
            <button
              type="button"
              onClick={() => setPrecioEdit(null)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === 'precio' ? 'Eliminar precio' : 'Eliminar producto'}
        message={
          confirm
            ? confirm.type === 'producto'
              ? `¿Seguro que quieres eliminar "${confirm.nombre}"? Si tiene ventas registradas se desactivará para conservar el historial.`
              : `¿Seguro que quieres eliminar el precio "${confirm.nombre}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirming={confirming}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
