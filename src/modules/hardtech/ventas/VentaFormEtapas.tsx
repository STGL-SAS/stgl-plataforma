'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  crearCompraHardtech,
  crearGastoExtraHardtech,
  deleteCompraHardtech,
  deleteGastoExtraHardtech,
  upsertVentaHardtech,
} from '../actions/mutations'
import { GananciaVentaResumen } from '../components/GananciaVentaResumen'
import type {
  HardtechCompra,
  HardtechEstadoVenta,
  HardtechGastoExtra,
  HardtechGastoExtraTipo,
  HardtechMoneda,
  HardtechVenta,
} from '../lib/tipos'
import { ESTADOS_VENTA, TIPOS_GASTO_EXTRA } from '../lib/tipos'

interface Cliente { id: string; nombre: string }
interface CompraAgrupable { id: string; lugar_compra: string; hardtech_ventas: { titulo: string } | null }

interface Props {
  venta?: HardtechVenta
  compras: HardtechCompra[]
  gastos: HardtechGastoExtra[]
  clientes: Cliente[]
  comprasAgrupables: CompraAgrupable[]
}

const hoy = () => new Date().toISOString().slice(0, 10)

export function VentaFormEtapas({
  venta,
  compras: comprasIniciales,
  gastos: gastosIniciales,
  clientes,
  comprasAgrupables,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    cliente_id: venta?.cliente_id ?? '',
    titulo: venta?.titulo ?? '',
    descripcion: venta?.descripcion ?? '',
    estado: (venta?.estado ?? 'pendiente_compra') as HardtechEstadoVenta,
    fecha_cotizacion: venta?.fecha_cotizacion ?? hoy(),
    documento_cotizacion: venta?.documento_cotizacion ?? '',
    anticipo_monto: venta?.anticipo_monto?.toString() ?? '',
    anticipo_fecha: venta?.anticipo_fecha ?? '',
    anticipo_comprobante: venta?.anticipo_comprobante ?? '',
    anticipo_nota: venta?.anticipo_nota ?? '',
    valor_venta_final: venta?.valor_venta_final?.toString() ?? '',
    propina: venta?.propina?.toString() ?? '0',
    pago_final_fecha: venta?.pago_final_fecha ?? '',
    pago_final_comprobante: venta?.pago_final_comprobante ?? '',
    comision_terceros_pct: venta?.comision_terceros_pct != null ? String(Number(venta.comision_terceros_pct) * 100) : '',
    comision_terceros_destinatario: venta?.comision_terceros_destinatario ?? '',
    comision_terceros_monto: venta?.comision_terceros_monto?.toString() ?? '',
  })

  const [nuevaCompra, setNuevaCompra] = useState({
    lugar_compra: '',
    metodo_pago: '',
    moneda: 'COP' as HardtechMoneda,
    monto: '',
    tasa_cambio: '',
    fecha_compra: hoy(),
    comprobante: '',
    agrupada_con: '',
  })

  const [nuevoGasto, setNuevoGasto] = useState({
    tipo: 'envio_internacional' as HardtechGastoExtraTipo,
    monto: '',
    moneda: 'COP' as HardtechMoneda,
    tasa_cambio: '',
    fecha: hoy(),
    comprobante: '',
    nota: '',
  })

  const ventaId = venta?.id
  const etapa1Ok = Boolean(form.cliente_id && form.titulo.trim())

  async function guardarVenta(partial?: Partial<typeof form>) {
    setLoading(true)
    setError(null)
    const f = { ...form, ...partial }
    try {
      const id = await upsertVentaHardtech({
        id: ventaId,
        cliente_id: f.cliente_id,
        titulo: f.titulo,
        descripcion: f.descripcion || null,
        estado: f.estado,
        fecha_cotizacion: f.fecha_cotizacion || null,
        documento_cotizacion: f.documento_cotizacion || null,
        anticipo_monto: f.anticipo_monto ? Number(f.anticipo_monto) : null,
        anticipo_fecha: f.anticipo_fecha || null,
        anticipo_comprobante: f.anticipo_comprobante || null,
        anticipo_nota: f.anticipo_nota || null,
        valor_venta_final: f.valor_venta_final ? Number(f.valor_venta_final) : null,
        propina: f.propina ? Number(f.propina) : 0,
        pago_final_fecha: f.pago_final_fecha || null,
        pago_final_comprobante: f.pago_final_comprobante || null,
        comision_terceros_pct: f.comision_terceros_pct
          ? Number(f.comision_terceros_pct) / 100
          : null,
        comision_terceros_destinatario: f.comision_terceros_destinatario || null,
        comision_terceros_monto: f.comision_terceros_monto ? Number(f.comision_terceros_monto) : null,
      })
      if (!ventaId) {
        router.push(`/hardtech/ventas/${id}`)
        router.refresh()
      } else {
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  async function agregarCompra(e: React.FormEvent) {
    e.preventDefault()
    if (!ventaId) return
    setLoading(true)
    try {
      await crearCompraHardtech({
        venta_id: ventaId,
        lugar_compra: nuevaCompra.lugar_compra,
        metodo_pago: nuevaCompra.metodo_pago,
        moneda: nuevaCompra.moneda,
        monto: Number(nuevaCompra.monto),
        tasa_cambio: nuevaCompra.moneda === 'USD' ? Number(nuevaCompra.tasa_cambio) : null,
        fecha_compra: nuevaCompra.fecha_compra,
        comprobante: nuevaCompra.comprobante || null,
        agrupada_con: nuevaCompra.agrupada_con || null,
      })
      setNuevaCompra({
        lugar_compra: '',
        metodo_pago: '',
        moneda: 'COP',
        monto: '',
        tasa_cambio: '',
        fecha_compra: hoy(),
        comprobante: '',
        agrupada_con: '',
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function agregarGasto(e: React.FormEvent) {
    e.preventDefault()
    if (!ventaId) return
    setLoading(true)
    try {
      await crearGastoExtraHardtech({
        venta_id: ventaId,
        tipo: nuevoGasto.tipo,
        monto: Number(nuevoGasto.monto),
        moneda: nuevoGasto.moneda,
        tasa_cambio: nuevoGasto.moneda === 'USD' ? Number(nuevoGasto.tasa_cambio) : null,
        fecha: nuevoGasto.fecha,
        comprobante: nuevoGasto.comprobante || null,
        nota: nuevoGasto.nota || null,
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const ventaCalc = {
    valor_venta_final: form.valor_venta_final ? Number(form.valor_venta_final) : null,
    propina: form.propina ? Number(form.propina) : 0,
    comision_terceros_pct: form.comision_terceros_pct ? Number(form.comision_terceros_pct) / 100 : null,
    comision_terceros_monto: form.comision_terceros_monto ? Number(form.comision_terceros_monto) : null,
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Etapa 1: Cotización */}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold">1. Cotización</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Cliente</span>
            <select
              required
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.cliente_id}
              onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
            >
              <option value="">Seleccionar…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Título</span>
            <input
              required
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Descripción</span>
            <textarea
              rows={3}
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Fecha cotización</span>
            <input
              type="date"
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={form.fecha_cotizacion}
              onChange={(e) => setForm({ ...form, fecha_cotizacion: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Documento (link OneDrive)</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2"
              placeholder="https://…"
              value={form.documento_cotizacion}
              onChange={(e) => setForm({ ...form, documento_cotizacion: e.target.value })}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={loading || !etapa1Ok}
          onClick={() => guardarVenta()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {ventaId ? 'Guardar cotización' : 'Crear venta y continuar'}
        </button>
      </section>

      {ventaId && (
        <>
          {/* Etapa 2: Anticipo */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold">2. Anticipo (opcional)</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Monto</span>
                <input type="number" className="rounded-md border px-3 py-2" value={form.anticipo_monto} onChange={(e) => setForm({ ...form, anticipo_monto: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Fecha</span>
                <input type="date" className="rounded-md border px-3 py-2" value={form.anticipo_fecha} onChange={(e) => setForm({ ...form, anticipo_fecha: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium">Comprobante (link)</span>
                <input className="rounded-md border px-3 py-2" value={form.anticipo_comprobante} onChange={(e) => setForm({ ...form, anticipo_comprobante: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium">Nota</span>
                <input className="rounded-md border px-3 py-2" value={form.anticipo_nota} onChange={(e) => setForm({ ...form, anticipo_nota: e.target.value })} />
              </label>
            </div>
            <button type="button" disabled={loading} onClick={() => guardarVenta()} className="text-sm text-zinc-700 underline">Guardar anticipo</button>
          </section>

          {/* Etapa 3: Compra */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold">3. Compra del producto</h2>
            {comprasIniciales.length > 0 && (
              <ul className="text-sm space-y-2">
                {comprasIniciales.map((c) => (
                  <li key={c.id} className="flex justify-between border-b pb-2">
                    <span>{c.lugar_compra} — {c.moneda} {c.monto} ({c.monto_cop_equivalente.toLocaleString('es-CO')} COP)</span>
                    <button type="button" className="text-red-600 text-xs" onClick={async () => { await deleteCompraHardtech(c.id); router.refresh() }}>Eliminar</button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={agregarCompra} className="grid gap-3 sm:grid-cols-2 text-sm">
              <input required placeholder="Lugar de compra" className="rounded-md border px-3 py-2 sm:col-span-2" value={nuevaCompra.lugar_compra} onChange={(e) => setNuevaCompra({ ...nuevaCompra, lugar_compra: e.target.value })} />
              <input required placeholder="Método de pago" className="rounded-md border px-3 py-2" value={nuevaCompra.metodo_pago} onChange={(e) => setNuevaCompra({ ...nuevaCompra, metodo_pago: e.target.value })} />
              <select className="rounded-md border px-3 py-2" value={nuevaCompra.moneda} onChange={(e) => setNuevaCompra({ ...nuevaCompra, moneda: e.target.value as HardtechMoneda })}>
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>
              <input required type="number" placeholder="Monto" className="rounded-md border px-3 py-2" value={nuevaCompra.monto} onChange={(e) => setNuevaCompra({ ...nuevaCompra, monto: e.target.value })} />
              {nuevaCompra.moneda === 'USD' && (
                <input required type="number" step="0.01" placeholder="Tasa cambio COP/USD" className="rounded-md border px-3 py-2" value={nuevaCompra.tasa_cambio} onChange={(e) => setNuevaCompra({ ...nuevaCompra, tasa_cambio: e.target.value })} />
              )}
              <input type="date" className="rounded-md border px-3 py-2" value={nuevaCompra.fecha_compra} onChange={(e) => setNuevaCompra({ ...nuevaCompra, fecha_compra: e.target.value })} />
              <select className="rounded-md border px-3 py-2 sm:col-span-2" value={nuevaCompra.agrupada_con} onChange={(e) => setNuevaCompra({ ...nuevaCompra, agrupada_con: e.target.value })}>
                <option value="">Sin agrupar envío</option>
                {comprasAgrupables.map((c) => (
                  <option key={c.id} value={c.id}>{c.hardtech_ventas?.titulo ?? c.lugar_compra}</option>
                ))}
              </select>
              <button type="submit" disabled={loading} className="sm:col-span-2 rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-50">+ Agregar compra</button>
            </form>
          </section>

          {/* Etapa 4: Gastos extra */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold">4. Gastos extra</h2>
            {gastosIniciales.map((g) => (
              <div key={g.id} className="flex justify-between text-sm border-b pb-2">
                <span>{g.tipo}: {g.monto_cop_equivalente.toLocaleString('es-CO')} COP</span>
                <button type="button" className="text-red-600 text-xs" onClick={async () => { await deleteGastoExtraHardtech(g.id); router.refresh() }}>Eliminar</button>
              </div>
            ))}
            <form onSubmit={agregarGasto} className="grid gap-3 sm:grid-cols-2 text-sm">
              <select className="rounded-md border px-3 py-2" value={nuevoGasto.tipo} onChange={(e) => setNuevoGasto({ ...nuevoGasto, tipo: e.target.value as HardtechGastoExtraTipo })}>
                {TIPOS_GASTO_EXTRA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input required type="number" placeholder="Monto" className="rounded-md border px-3 py-2" value={nuevoGasto.monto} onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })} />
              <button type="submit" disabled={loading} className="sm:col-span-2 rounded-md border px-4 py-2">+ Agregar gasto</button>
            </form>
          </section>

          {/* Etapa 5: Pago final */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold">5. Entrega y pago final</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <label className="flex flex-col gap-1">
                <span className="font-medium">Valor venta final</span>
                <input type="number" className="rounded-md border px-3 py-2" value={form.valor_venta_final} onChange={(e) => setForm({ ...form, valor_venta_final: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">Propina</span>
                <input type="number" className="rounded-md border px-3 py-2" value={form.propina} onChange={(e) => setForm({ ...form, propina: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">Fecha pago final</span>
                <input type="date" className="rounded-md border px-3 py-2" value={form.pago_final_fecha} onChange={(e) => setForm({ ...form, pago_final_fecha: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">Comprobante</span>
                <input className="rounded-md border px-3 py-2" value={form.pago_final_comprobante} onChange={(e) => setForm({ ...form, pago_final_comprobante: e.target.value })} />
              </label>
            </div>
          </section>

          {/* Etapa 6: Comisión */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold">6. Comisión a terceros (opcional)</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <label className="flex flex-col gap-1">
                <span className="font-medium">% comisión</span>
                <input type="number" step="0.1" className="rounded-md border px-3 py-2" value={form.comision_terceros_pct} onChange={(e) => setForm({ ...form, comision_terceros_pct: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">Monto fijo</span>
                <input type="number" className="rounded-md border px-3 py-2" value={form.comision_terceros_monto} onChange={(e) => setForm({ ...form, comision_terceros_monto: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="font-medium">Destinatario</span>
                <input className="rounded-md border px-3 py-2" value={form.comision_terceros_destinatario} onChange={(e) => setForm({ ...form, comision_terceros_destinatario: e.target.value })} />
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <label className="flex flex-col gap-1 text-sm max-w-xs">
              <span className="font-medium">Estado</span>
              <select className="rounded-md border px-3 py-2" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as HardtechEstadoVenta })}>
                {ESTADOS_VENTA.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <GananciaVentaResumen venta={ventaCalc} compras={comprasIniciales} gastos={gastosIniciales} />
            <button type="button" disabled={loading} onClick={() => guardarVenta()} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              Guardar venta completa
            </button>
          </section>
        </>
      )}
    </div>
  )
}
