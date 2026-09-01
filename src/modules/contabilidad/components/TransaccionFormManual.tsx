'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { createTransaccionManual } from '../actions/transacciones'
import {
  VentaHydrexFormExtension,
  type VentaHydrexPayload,
} from '@/modules/inventario-hydrex/components/VentaHydrexFormExtension'
import { createTransaccionConVentaHydrex } from '@/modules/inventario-hydrex/actions/mutations'
import type { ComponenteCosto, HydrexProducto, HydrexProductoRecetaLinea, PrecioRow } from '@/modules/inventario-hydrex/lib/tipos'
import type { CuentaBancaria, Negocio, TipoTransaccionManual } from '../types'

interface HydrexCatalog {
  productos: HydrexProducto[]
  preciosMap: Record<string, PrecioRow[]>
  recetaMap: Record<string, HydrexProductoRecetaLinea[]>
  stockMap: Record<string, number>
  componentes: ComponenteCosto[]
  envioTarifas: { id: string; nombre: string; valor_referencia: number }[]
  clientes: { id: string; nombre: string }[]
}

interface Props {
  negocios: Negocio[]
  cuentas: CuentaBancaria[]
  categoriasSugeridas: string[]
  hydrexCatalog?: HydrexCatalog
}

export function TransaccionFormManual({
  negocios,
  cuentas,
  categoriasSugeridas,
  hydrexCatalog,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [negocioId, setNegocioId] = useState('')
  const [tipo, setTipo] = useState<TipoTransaccionManual>('ingreso')
  const [ventaHydrex, setVentaHydrex] = useState<VentaHydrexPayload | null>(null)

  const hoy = new Date().toISOString().slice(0, 10)

  const esHydrexIngreso = useMemo(() => {
    const n = negocios.find((x) => x.id === negocioId)
    return n?.codigo === 'HYDREX' && tipo === 'ingreso'
  }, [negocios, negocioId, tipo])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const base = {
      negocio_id: fd.get('negocio_id') as string,
      cuenta_id: fd.get('cuenta_id') as string,
      categoria: fd.get('categoria') as string,
      fecha: fd.get('fecha') as string,
      nombre_interno: fd.get('nombre_interno') as string,
      observaciones: (fd.get('observaciones') as string) || undefined,
    }

    try {
      if (esHydrexIngreso && ventaHydrex && hydrexCatalog) {
        if (!ventaHydrex.costo_disponible || !ventaHydrex.venta_calculo.costoDisponible) {
          throw new Error(
            'No se puede guardar la venta: el producto no tiene costo conocido (faltan compras de insumos).'
          )
        }
        const calc = ventaHydrex.venta_calculo
        await createTransaccionConVentaHydrex({
          ...base,
          monto: ventaHydrex.monto_total,
          venta: {
            producto_id: ventaHydrex.producto_id,
            cliente_id: ventaHydrex.cliente_id,
            canal: ventaHydrex.canal,
            cantidad: ventaHydrex.cantidad,
            precio_venta_unitario: ventaHydrex.precio_venta_unitario,
            incluye_envio: ventaHydrex.incluye_envio,
            valor_envio: ventaHydrex.valor_envio,
            componentes_activos: ventaHydrex.componentes_activos,
            costo_producto_unitario: calc.costoProductoTotal! / ventaHydrex.cantidad,
            componentes_aplicados: calc.componentesAplicados,
            costo_total: calc.costoTotal!,
            ganancia: calc.gananciaTotal!,
            margen_pct: calc.margenPct!,
            calificacion: calc.calificacion!,
          },
        })
      } else {
        await createTransaccionManual({
          ...base,
          tipo: fd.get('tipo') as TipoTransaccionManual,
          monto: Number(fd.get('monto')),
        })
      }
      router.push('/contabilidad/transacciones')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Negocio</span>
        <select
          name="negocio_id"
          required
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={negocioId}
          onChange={(e) => setNegocioId(e.target.value)}
        >
          <option value="">Seleccionar…</option>
          {negocios.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Cuenta bancaria</span>
        <select name="cuenta_id" required className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="">Seleccionar…</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Tipo</span>
        <select
          name="tipo"
          required
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoTransaccionManual)}
        >
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
      </label>

      {esHydrexIngreso && hydrexCatalog ? (
        <VentaHydrexFormExtension
          productos={hydrexCatalog.productos}
          preciosMap={hydrexCatalog.preciosMap}
          recetaMap={hydrexCatalog.recetaMap}
          stockMap={hydrexCatalog.stockMap}
          componentes={hydrexCatalog.componentes}
          envioTarifas={hydrexCatalog.envioTarifas}
          clientes={hydrexCatalog.clientes}
          onVentaChange={setVentaHydrex}
        />
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Categoría</span>
        <input
          name="categoria"
          list="categorias-sugeridas"
          required
          placeholder="Ej: venta web, insumos…"
          defaultValue={esHydrexIngreso ? 'venta_hydrex' : undefined}
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
        <datalist id="categorias-sugeridas">
          {categoriasSugeridas.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      {!esHydrexIngreso && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Monto</span>
          <input
            name="monto"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>
      )}

      {esHydrexIngreso && ventaHydrex && (
        <input type="hidden" name="monto" value={ventaHydrex.monto_total} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Fecha</span>
          <input
            name="fecha"
            type="date"
            required
            defaultValue={hoy}
            className="rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Nombre interno</span>
        <input
          name="nombre_interno"
          required
          className="rounded-md border border-zinc-300 px-3 py-2"
          placeholder={esHydrexIngreso ? 'Ej: Venta ML — impermeable reflectivo' : undefined}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Observaciones</span>
        <textarea
          name="observaciones"
          rows={3}
          className="rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={
            loading ||
            (esHydrexIngreso &&
              (!ventaHydrex?.producto_id || !ventaHydrex.costo_disponible))
          }
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? 'Guardando…' : esHydrexIngreso ? 'Guardar venta HYDREX' : 'Guardar transacción'}
        </button>
      </div>
    </form>
  )
}
