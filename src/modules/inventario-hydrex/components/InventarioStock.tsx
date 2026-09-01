'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { HydrexStockProducto, HydrexStockRow, HydrexTipoInsumo } from '../lib/tipos'

interface Movimiento {
  id: string
  tipo_movimiento: string
  cantidad: number
  origen: string
  canal: string | null
  fecha: string
  hydrex_insumos?: {
    nombre: string
    tipo?: { codigo: string; nombre: string }
  }
}

interface Props {
  stock: HydrexStockRow[]
  stockProductos: HydrexStockProducto[]
  tipos: HydrexTipoInsumo[]
  movimientos: Movimiento[]
}

export function InventarioStock({ stock, stockProductos, tipos, movimientos }: Props) {
  const tipoMeta = useMemo(() => new Map(tipos.map((t) => [t.codigo, t])), [tipos])

  const grouped = useMemo(() => {
    const map = new Map<string, { nombre: string; orden: number; rows: HydrexStockRow[] }>()
    for (const row of stock) {
      const meta = tipoMeta.get(row.tipo_insumo_codigo)
      const key = row.tipo_insumo_codigo
      const entry = map.get(key) ?? {
        nombre: row.tipo_insumo_nombre,
        orden: meta?.orden ?? 999,
        rows: [],
      }
      entry.rows.push(row)
      map.set(key, entry)
    }
    return [...map.entries()].sort((a, b) => a[1].orden - b[1].orden)
  }, [stock, tipoMeta])

  const totalUnidades = useMemo(
    () => stock.reduce((sum, row) => sum + row.stock_disponible, 0),
    [stock]
  )

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Stock actual</h2>
            <p className="mt-1 text-sm text-zinc-600">Saldo disponible por insumo</p>
          </div>
          {stock.length > 0 && (
            <p className="text-sm text-zinc-600">
              Total unidades:{' '}
              <span className="font-semibold tabular-nums text-zinc-900">{totalUnidades}</span>
            </p>
          )}
        </div>

        {stock.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-600">
            <p>No hay insumos con stock registrado.</p>
            <p className="mt-2">
              Creá insumos en{' '}
              <Link href="/inventario-hydrex/catalogo" className="font-medium text-blue-600 hover:text-blue-800">
                Catálogo
              </Link>{' '}
              y registrá compras en{' '}
              <Link href="/inventario-hydrex/proveedores" className="font-medium text-blue-600 hover:text-blue-800">
                Proveedores
              </Link>{' '}
              para ver entradas aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([codigo, { nombre, rows }]) => {
              const tipo = tipoMeta.get(codigo)
              return (
                <div key={codigo}>
                  <h3 className="mb-2 text-base font-semibold text-zinc-900">{nombre}</h3>
                  <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-3 py-2.5 text-left">Insumo</th>
                          <th className="px-3 py-2.5 text-left">{tipo?.label_atributo_1 ?? 'Atributo 1'}</th>
                          {tipo?.requiere_atributo_2 !== false && (
                            <th className="px-3 py-2.5 text-left">{tipo?.label_atributo_2 ?? 'Atributo 2'}</th>
                          )}
                          <th className="px-3 py-2.5 text-right">Disponible</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s) => (
                          <tr key={s.insumo_id}>
                            <td className="px-3 py-2.5 font-medium">{s.nombre}</td>
                            <td className="px-3 py-2.5">{s.atributo_1}</td>
                            {tipo?.requiere_atributo_2 !== false && (
                              <td className="px-3 py-2.5">{s.atributo_2 ?? '—'}</td>
                            )}
                            <td
                              className={`px-3 py-2.5 text-right font-medium tabular-nums ${
                                s.stock_disponible <= 0 ? 'text-red-600' : 'text-zinc-900'
                              }`}
                            >
                              {s.stock_disponible}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Stock de productos terminados (calculado)
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Unidades que se pueden armar hoy según insumos disponibles
          </p>
        </div>

        {stockProductos.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-600">
            No hay productos con receta e insumos para calcular stock.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2.5 text-left">Producto</th>
                  <th className="px-3 py-2.5 text-left">Tipo</th>
                  <th className="px-3 py-2.5 text-right">Unidades armables</th>
                </tr>
              </thead>
              <tbody>
                {stockProductos.map((p) => (
                  <tr key={p.producto_id}>
                    <td className="px-3 py-2.5 font-medium">{p.nombre}</td>
                    <td className="px-3 py-2.5 capitalize">{p.tipo_producto}</td>
                    <td
                      className={`px-3 py-2.5 text-right font-medium tabular-nums ${
                        p.stock_disponible <= 0 ? 'text-red-600' : 'text-zinc-900'
                      }`}
                    >
                      {p.stock_disponible}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Movimientos recientes</h2>
        {movimientos.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-center text-sm text-zinc-600">
            Sin movimientos de inventario todavía.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2.5 text-left">Fecha</th>
                  <th className="px-3 py-2.5 text-left">Insumo</th>
                  <th className="px-3 py-2.5 text-left">Categoría</th>
                  <th className="px-3 py-2.5 text-left">Tipo</th>
                  <th className="px-3 py-2.5 text-right">Cant.</th>
                  <th className="px-3 py-2.5 text-left">Origen</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2.5">{m.fecha}</td>
                    <td className="px-3 py-2.5">{m.hydrex_insumos?.nombre ?? '—'}</td>
                    <td className="px-3 py-2.5">{m.hydrex_insumos?.tipo?.nombre ?? '—'}</td>
                    <td className="px-3 py-2.5 capitalize">{m.tipo_movimiento}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{m.cantidad}</td>
                    <td className="px-3 py-2.5">
                      {m.origen}
                      {m.canal ? ` (${m.canal})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
