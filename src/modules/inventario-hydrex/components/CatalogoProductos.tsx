'use client'

import { useState } from 'react'
import { deleteProducto } from '../actions/deletes'
import { upsertProducto } from '../actions/mutations'
import type { HydrexInsumo, HydrexProducto, HydrexProductoRecetaLinea, PrecioRow } from '../lib/tipos'
import { formatCostoDisplay } from '../lib/motor-calculo'
import { formatPreciosCompacto } from '../lib/format-precios'
import { formatRecetaResumen } from '../lib/format-receta'
import { recetaInicialParaTipoProducto } from '../lib/tipo-producto'
import { ajustarTipoPrecio } from '../lib/validate-tipo-precio'
import { ConfirmDialog } from './ConfirmDialog'
import {
  ProductoPreciosEditor,
  precioRowToDraft,
  type PrecioLineaDraft,
} from './ProductoPreciosEditor'
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
  precios: PrecioLineaDraft[]
}

interface Props {
  productos: HydrexProducto[]
  productosCosto: HydrexProducto[]
  insumos: HydrexInsumo[]
  recetaMap: Record<string, HydrexProductoRecetaLinea[]>
  stockMap: Record<string, number>
  unidadesEquivMap: Record<string, number>
  preciosMap: Record<string, PrecioRow[]>
  onRefresh: () => void
}

function toEditState(
  producto: HydrexProducto | null,
  recetaMap: Record<string, HydrexProductoRecetaLinea[]>,
  preciosMap: Record<string, PrecioRow[]>,
  insumos: HydrexInsumo[]
): ProductoEditState {
  if (!producto) {
    return {
      nombre: '',
      tipo_producto: 'individual',
      activo: true,
      receta: createEmptyRecetaLineas(insumos),
      precios: [],
    }
  }
  const lineas = recetaMap[producto.id] ?? []
  const precios = preciosMap[producto.id] ?? []
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
    precios: precios.map(precioRowToDraft),
  }
}

export function CatalogoProductos({
  productos,
  productosCosto,
  insumos,
  recetaMap,
  stockMap,
  unidadesEquivMap,
  preciosMap,
  onRefresh,
}: Props) {
  const [editing, setEditing] = useState<ProductoEditState | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; nombre: string } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [productoError, setProductoError] = useState<string | null>(null)

  const insumoById = new Map(insumos.map((i) => [i.id, i]))
  const productoById = new Map(productos.map((p) => [p.id, p]))

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

  async function handleDelete() {
    if (!confirm) return
    setConfirming(true)
    try {
      await deleteProducto(confirm.id, confirm.nombre)
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
        onClick={() => setEditing(toEditState(null, recetaMap, preciosMap, insumos))}
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
                  precios: editing.precios.map((p) => {
                    const tipo_precio = ajustarTipoPrecio(tipo, p.tipo_precio)
                    return {
                      ...p,
                      tipo_precio,
                      cantidad_min: tipo_precio === 'distribuidor' ? p.cantidad_min : 1,
                      cantidad_max: tipo_precio === 'distribuidor' ? p.cantidad_max : null,
                      descuento_pct_ui: tipo_precio === 'caja' ? p.descuento_pct_ui : 0,
                    }
                  }),
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

          <ProductoPreciosEditor
            tipoProducto={editing.tipo_producto}
            lineas={editing.precios}
            onChange={(precios) => setEditing({ ...editing, precios })}
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
              <th className="px-3 py-2 text-right">Unid. equiv. (auto)</th>
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
              const unidadesEquiv = unidadesEquivMap[p.id] ?? 1
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
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                    {unidadesEquiv}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-600">
                    {formatCostoDisplay(costo?.costo_por_unidad)}
                  </td>
                  <td className="px-3 py-2 text-center text-xs">{p.activo ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2 text-xs text-zinc-600 max-w-xs">
                    {formatPreciosCompacto(precios)}
                  </td>
                  <td className="px-3 py-2">
                    <RowActions
                      onEdit={() => setEditing(toEditState(p, recetaMap, preciosMap, insumos))}
                      onDelete={() => setConfirm({ id: p.id, nombre: p.nombre })}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Eliminar producto"
        message={
          confirm
            ? `¿Seguro que quieres eliminar "${confirm.nombre}"? Si tiene ventas registradas se desactivará para conservar el historial.`
            : ''
        }
        confirming={confirming}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
