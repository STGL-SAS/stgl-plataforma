'use client'

import { useEffect, useMemo, useState } from 'react'
import { calcularVenta, formatCOP, formatCostoDisplay, productoCostoDisponible, resolverPrecioVenta } from '../lib/motor-calculo'
import type {
  Canal,
  ComponenteCosto,
  HydrexProducto,
  HydrexProductoInsumo,
  PrecioRow,
  TipoPrecio,
} from '../lib/tipos'
import { formatRecetaLinea } from '../lib/format-receta'
import { mensajeStockInsuficiente } from '../lib/stock-producto'
import { CANALES } from '../lib/tipos'
import { CalculoVentaPanel } from './CalculoVentaPanel'
import { CurrencyInput } from './CurrencyInput'
import { NumberInput } from '@/components/NumberInput'

interface EnvioTarifa {
  id: string
  nombre: string
  valor_referencia: number
}

export interface CalculadoraState {
  canal: Canal
  productoId: string
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  incluyeEnvio: boolean
  valorEnvio: number
  componentesActivos: Record<string, boolean>
}

interface Props {
  productos: HydrexProducto[]
  preciosMap: Record<string, PrecioRow[]>
  recetaMap?: Record<string, HydrexProductoInsumo[]>
  stockMap?: Record<string, number>
  componentes: ComponenteCosto[]
  envioTarifas: EnvioTarifa[]
  /** Modo controlado opcional para compartir estado con form de contabilidad */
  state?: Partial<CalculadoraState>
  onStateChange?: (state: CalculadoraState) => void
  hideTitle?: boolean
}

export function CalculadoraVenta({
  productos,
  preciosMap,
  recetaMap = {},
  stockMap = {},
  componentes,
  envioTarifas,
  state: externalState,
  onStateChange,
  hideTitle,
}: Props) {
  const [canal, setCanal] = useState<Canal>(externalState?.canal ?? 'web')
  const [productoId, setProductoId] = useState(externalState?.productoId ?? '')
  const [cantidad, setCantidad] = useState(externalState?.cantidad ?? 1)
  const [tipoPrecio, setTipoPrecio] = useState<TipoPrecio>(
    externalState?.tipoPrecio ?? 'individual'
  )
  const [precioUnitario, setPrecioUnitario] = useState(externalState?.precioUnitario ?? 0)
  const [precioManual, setPrecioManual] = useState(false)
  const [incluyeEnvio, setIncluyeEnvio] = useState(externalState?.incluyeEnvio ?? false)
  const [valorEnvio, setValorEnvio] = useState(externalState?.valorEnvio ?? 0)
  const [componentesActivos, setComponentesActivos] = useState<Record<string, boolean>>(
    externalState?.componentesActivos ?? {}
  )

  const producto = productos.find((p) => p.id === productoId)
  const precios = productoId ? preciosMap[productoId] ?? [] : []
  const avisoStock = mensajeStockInsuficiente(stockMap, productoId, cantidad)
  const componentesCanal = useMemo(
    () =>
      componentes.filter(
        (c) => !c.canales_aplica?.length || c.canales_aplica.includes(canal)
      ),
    [componentes, canal]
  )

  useEffect(() => {
    if (precioManual || !precios.length) return
    const p = resolverPrecioVenta(precios, tipoPrecio, cantidad)
    setPrecioUnitario(p)
  }, [productoId, tipoPrecio, cantidad, precios, precioManual])

  useEffect(() => {
    if (producto?.tipo_producto === 'caja' && tipoPrecio === 'individual') {
      setTipoPrecio('caja')
    }
  }, [producto, tipoPrecio])

  const resultado = useMemo(() => {
    if (!producto) return null
    return calcularVenta({
      costoProductoUnitario: producto.costo_por_unidad,
      precioVentaUnitario: precioUnitario,
      cantidad,
      canal,
      componentesDisponibles: componentesCanal,
      componentesActivos,
      incluyeEnvio,
      valorEnvio,
    })
  }, [
    producto,
    precioUnitario,
    cantidad,
    canal,
    componentesCanal,
    componentesActivos,
    incluyeEnvio,
    valorEnvio,
  ])

  useEffect(() => {
    onStateChange?.({
      canal,
      productoId,
      cantidad,
      tipoPrecio,
      precioUnitario,
      incluyeEnvio,
      valorEnvio,
      componentesActivos,
    })
  }, [
    canal,
    productoId,
    cantidad,
    tipoPrecio,
    precioUnitario,
    incluyeEnvio,
    valorEnvio,
    componentesActivos,
    onStateChange,
  ])

  function toggleComponente(id: string, checked: boolean) {
    setComponentesActivos((prev) => ({ ...prev, [id]: checked }))
  }

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <p className="text-sm text-zinc-600">
          Selecciona canal, producto y cantidad. El motor calcula en vivo.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Canal</span>
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={canal}
            onChange={(e) => setCanal(e.target.value as Canal)}
          >
            {CANALES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Producto</span>
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={productoId}
            onChange={(e) => {
              setProductoId(e.target.value)
              setPrecioManual(false)
            }}
          >
            <option value="">Seleccionar…</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({formatCostoDisplay(p.costo_por_unidad)}/u)
              </option>
            ))}
          </select>
        </label>
      </div>

      {avisoStock && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {avisoStock}
        </div>
      )}

      {productoId && (recetaMap[productoId]?.length ?? 0) > 0 && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="mb-2 text-sm font-medium text-zinc-800">Receta por unidad vendida</p>
          <ul className="text-sm text-zinc-600 space-y-1">
            {(recetaMap[productoId] ?? []).map((l) => (
              <li key={l.id ?? `${l.insumo_id}-${l.cantidad}`}>{formatRecetaLinea(l)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2 lg:col-span-1">
          <span className="font-medium">Cantidad</span>
          <NumberInput
            integer
            min={1}
            emptyWhenZero={false}
            value={cantidad}
            onChange={(v) => setCantidad(v ?? 1)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tipo de precio</span>
          <select
            className="rounded-md border border-zinc-300 px-3 py-2"
            value={tipoPrecio}
            onChange={(e) => {
              setTipoPrecio(e.target.value as TipoPrecio)
              setPrecioManual(false)
            }}
          >
            <option value="individual">Individual</option>
            <option value="caja">Caja</option>
            <option value="distribuidor">Distribuidor</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Precio unitario</span>
          <CurrencyInput
            value={precioUnitario || null}
            onChange={(v) => {
              setPrecioManual(true)
              setPrecioUnitario(v ?? 0)
            }}
          />
        </label>
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 space-y-3">
        <p className="text-sm font-medium">Componentes de costo</p>
        {componentesCanal.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin componentes para este canal.</p>
        ) : (
          <ul className="space-y-2">
            {componentesCanal.map((c) => {
              const defaultOn = c.premarcado_canales.includes(canal)
              const checked =
                c.id in componentesActivos ? componentesActivos[c.id] : defaultOn
              return (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleComponente(c.id, e.target.checked)}
                  />
                  <span>{c.nombre}</span>
                  <span className="text-zinc-400 text-xs">({c.tipo_calculo})</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="incluye-envio"
            checked={incluyeEnvio}
            onChange={(e) => setIncluyeEnvio(e.target.checked)}
          />
          <label htmlFor="incluye-envio" className="text-sm font-medium">
            Incluir envío
          </label>
        </div>
        {incluyeEnvio && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Tarifa de referencia</span>
              <select
                className="rounded-md border border-zinc-300 px-3 py-2"
                onChange={(e) => {
                  const t = envioTarifas.find((x) => x.id === e.target.value)
                  if (t) setValorEnvio(t.valor_referencia)
                }}
              >
                <option value="">Manual…</option>
                {envioTarifas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} — {formatCOP(t.valor_referencia)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Valor envío (editable)</span>
              <CurrencyInput
                value={valorEnvio || null}
                onChange={(v) => setValorEnvio(v ?? 0)}
              />
            </label>
          </>
        )}
      </div>

      <CalculoVentaPanel resultado={resultado} />
    </div>
  )
}

export function useCalculadoraResultado(
  productos: HydrexProducto[],
  state: CalculadoraState,
  componentes: ComponenteCosto[]
) {
  return useMemo(() => {
    const producto = productos.find((p) => p.id === state.productoId)
    if (!producto || !productoCostoDisponible(producto)) return null
    const componentesCanal = componentes.filter(
      (c) => !c.canales_aplica?.length || c.canales_aplica.includes(state.canal)
    )
    return calcularVenta({
      costoProductoUnitario: producto.costo_por_unidad,
      precioVentaUnitario: state.precioUnitario,
      cantidad: state.cantidad,
      canal: state.canal,
      componentesDisponibles: componentesCanal,
      componentesActivos: state.componentesActivos,
      incluyeEnvio: state.incluyeEnvio,
      valorEnvio: state.valorEnvio,
    })
  }, [productos, state, componentes])
}
