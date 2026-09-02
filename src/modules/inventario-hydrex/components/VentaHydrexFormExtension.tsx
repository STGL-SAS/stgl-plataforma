'use client'

import { useCallback, useState } from 'react'
import { calcularVenta } from '../lib/motor-calculo'
import type { ComponenteCosto, HydrexProducto, HydrexProductoRecetaLinea, PrecioRow } from '../lib/tipos'
import { CalculadoraVenta, useCalculadoraResultado, type CalculadoraState } from './CalculadoraVenta'

export interface VentaHydrexPayload {
  producto_id: string
  cliente_id?: string
  canal: CalculadoraState['canal']
  cantidad: number
  precio_venta_unitario: number
  incluye_envio: boolean
  valor_envio: number
  componentes_activos: Record<string, boolean>
  monto_total: number
  venta_calculo: ReturnType<typeof calcularVenta>
  costo_disponible: boolean
}

interface Props {
  productos: HydrexProducto[]
  preciosMap: Record<string, PrecioRow[]>
  recetaMap?: Record<string, HydrexProductoRecetaLinea[]>
  stockMap?: Record<string, number>
  componentes: ComponenteCosto[]
  envioTarifas: { id: string; nombre: string; valor_referencia: number }[]
  clientes: { id: string; nombre: string }[]
  onVentaChange: (payload: VentaHydrexPayload | null) => void
}

export function VentaHydrexFormExtension({
  productos,
  preciosMap,
  recetaMap,
  stockMap,
  componentes,
  envioTarifas,
  clientes,
  onVentaChange,
}: Props) {
  const [clienteId, setClienteId] = useState('')
  const [calcState, setCalcState] = useState<CalculadoraState | null>(null)

  const resultado = useCalculadoraResultado(
    productos,
    calcState ?? {
      canal: 'web',
      productoId: '',
      cantidad: 1,
      tipoPrecio: 'individual',
      precioUnitario: 0,
      incluyeEnvio: false,
      valorEnvio: 0,
      componentesActivos: {},
      costoProductoTotal: null,
      costoFifoIncompleto: true,
    },
    componentes
  )

  const notifyParent = useCallback(
    (state: CalculadoraState) => {
      setCalcState(state)
      const producto = productos.find((p) => p.id === state.productoId)
      if (!producto || !state.productoId || state.costoFifoIncompleto || state.costoProductoTotal == null) {
        onVentaChange(null)
        return
      }
      const componentesCanal = componentes.filter(
        (c) => !c.canales_aplica?.length || c.canales_aplica.includes(state.canal)
      )
      const venta_calculo = calcularVenta({
        costoProductoTotal: state.costoProductoTotal,
        precioVentaUnitario: state.precioUnitario,
        cantidad: state.cantidad,
        canal: state.canal,
        componentesDisponibles: componentesCanal,
        componentesActivos: state.componentesActivos,
        incluyeEnvio: state.incluyeEnvio,
        valorEnvio: state.valorEnvio,
        unidadesEquivalentes: producto.unidades_equivalentes ?? 1,
      })
      onVentaChange({
        producto_id: state.productoId,
        cliente_id: clienteId || undefined,
        canal: state.canal,
        cantidad: state.cantidad,
        precio_venta_unitario: state.precioUnitario,
        incluye_envio: state.incluyeEnvio,
        valor_envio: state.valorEnvio,
        componentes_activos: state.componentesActivos,
        monto_total: state.precioUnitario * state.cantidad,
        venta_calculo,
        costo_disponible: venta_calculo.costoDisponible,
      })
    },
    [productos, componentes, clienteId, onVentaChange]
  )

  const productoSinCosto = Boolean(
    calcState?.productoId && (calcState.costoFifoIncompleto || calcState.costoProductoTotal == null)
  )

  return (
    <div className="mt-6 space-y-4 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <h3 className="font-medium text-blue-900">Detalle de venta HYDREX</h3>

      <label className="flex flex-col gap-1 text-sm max-w-xs">
        <span className="font-medium">Cliente (opcional)</span>
        <select
          className="rounded-md border border-zinc-300 px-3 py-2 bg-white"
          value={clienteId}
          onChange={(e) => {
            setClienteId(e.target.value)
            if (calcState) notifyParent(calcState)
          }}
        >
          <option value="">Sin cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </label>

      <CalculadoraVenta
        productos={productos}
        preciosMap={preciosMap}
        recetaMap={recetaMap}
        stockMap={stockMap}
        componentes={componentes}
        envioTarifas={envioTarifas}
        onStateChange={notifyParent}
        hideTitle
      />

      {productoSinCosto && (
        <p className="text-sm text-amber-800">
          No se puede guardar esta venta hasta que haya stock de compras suficiente para el costo FIFO de esta cantidad.
        </p>
      )}

      {resultado?.costoDisponible && (
        <p className="text-xs text-zinc-600">
          Monto sugerido para transacción:{' '}
          <strong>
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0,
            }).format((calcState?.precioUnitario ?? 0) * (calcState?.cantidad ?? 0))}
          </strong>
        </p>
      )}
    </div>
  )
}
