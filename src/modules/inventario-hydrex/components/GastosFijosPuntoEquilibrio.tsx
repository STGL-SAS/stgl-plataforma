'use client'

import { useMemo, useState } from 'react'
import { deleteGastoFijo } from '../actions/deletes'
import { upsertGastoFijo } from '../actions/mutations'
import {
  formatCOP,
  mensajePrecioNoDisponible,
} from '../lib/motor-calculo'
import type { ComponenteCosto, HydrexProducto, PrecioRow } from '../lib/tipos'
import { CANALES } from '../lib/tipos'
import { useCostoProductoFifo } from '../hooks/useCostoProductoFifo'
import {
  MODOS_CANAL_EQUILIBRIO,
  calcularGananciaEquilibrio,
  type ModoCanalEquilibrio,
} from '../lib/punto-equilibrio'
import { TIPO_PRECIO_OPTIONS } from '../lib/validate-tipo-precio'
import { ConfirmDialog } from './ConfirmDialog'
import { CurrencyInput } from './CurrencyInput'
import { RowActions } from './RowActions'
import { CalculadoraVenta, type CalculadoraState } from './CalculadoraVenta'

interface Gasto {
  id: string
  concepto: string
  monto: number
  periodicidad: string
  activo: boolean
}

interface Props {
  gastos: Gasto[]
  totalMensual: number
  productos: HydrexProducto[]
  preciosMap: Record<string, PrecioRow[]>
  componentes: ComponenteCosto[]
  onRefresh: () => void
}

const CALC_STATE_INICIAL: CalculadoraState = {
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
}

export function GastosFijosPuntoEquilibrio({
  gastos,
  totalMensual,
  productos,
  preciosMap,
  componentes,
  onRefresh,
}: Props) {
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; nombre: string } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [calcState, setCalcState] = useState<CalculadoraState>(CALC_STATE_INICIAL)
  const [modoCanal, setModoCanal] = useState<ModoCanalEquilibrio>('especifico')

  const producto = productos.find((p) => p.id === calcState.productoId)
  const precios = calcState.productoId ? preciosMap[calcState.productoId] ?? [] : []
  const {
    costoProductoTotal,
    incompleto: costoFifoIncompleto,
    loading: costoFifoLoading,
    costoDisponible,
  } = useCostoProductoFifo(calcState.productoId, calcState.cantidad)

  const mensajeEquilibrio = useMemo(() => {
    if (!calcState.productoId) {
      return {
        tipo: 'info' as const,
        texto: 'Selecciona un producto, canal y tipo de precio para calcular.',
      }
    }
    const avisoPrecio = mensajePrecioNoDisponible(
      precios,
      calcState.tipoPrecio,
      calcState.cantidad
    )
    if (avisoPrecio) {
      return {
        tipo: 'warning' as const,
        texto: avisoPrecio,
      }
    }
    if (costoFifoLoading) {
      return {
        tipo: 'info' as const,
        texto: 'Calculando costo FIFO…',
      }
    }
    if (!producto || !costoDisponible || costoProductoTotal == null) {
      return {
        tipo: 'warning' as const,
        texto:
          'No hay stock de compras suficiente para calcular el costo FIFO de esta cantidad.',
      }
    }

    const gananciaRef = calcularGananciaEquilibrio(
      costoProductoTotal,
      producto,
      calcState,
      componentes,
      modoCanal
    )

    if (!gananciaRef.ok) {
      const excluidos =
        gananciaRef.canalesExcluidos.length > 0
          ? ` Canales excluidos: ${gananciaRef.canalesExcluidos
              .map(
                (e) =>
                  `${CANALES.find((c) => c.value === e.canal)?.label ?? e.canal} (${e.motivo})`
              )
              .join(', ')}.`
          : ''
      return {
        tipo: 'warning' as const,
        texto: `No se pudo calcular la ganancia de referencia.${excluidos}`,
      }
    }

    const { gananciaPorUnidad, canalPeorCaso, canalesExcluidos } = gananciaRef

    if (gananciaPorUnidad <= 0) {
      return {
        tipo: 'warning' as const,
        texto: 'La ganancia por unidad no es positiva con estos parámetros.',
        canalesExcluidos,
      }
    }

    const unidades = Math.ceil(totalMensual / gananciaPorUnidad)
    const tipoLabel =
      TIPO_PRECIO_OPTIONS.find((t) => t.value === calcState.tipoPrecio)?.label ??
      calcState.tipoPrecio
    const precioFmt = formatCOP(calcState.precioUnitario)

    let etiqueta: string
    if (modoCanal === 'peor_caso' && canalPeorCaso) {
      const canalLabel =
        CANALES.find((c) => c.value === canalPeorCaso)?.label ?? canalPeorCaso
      etiqueta = `Punto de equilibrio (ref. ${producto.nombre}, peor caso: canal ${canalLabel}, ${tipoLabel.toLowerCase()}, ${precioFmt})`
    } else if (modoCanal === 'promedio') {
      etiqueta = `Punto de equilibrio (ref. ${producto.nombre}, promedio entre los 4 canales, ${tipoLabel.toLowerCase()}, ${precioFmt})`
    } else {
      const canalLabel =
        CANALES.find((c) => c.value === calcState.canal)?.label ?? calcState.canal
      etiqueta = `Punto de equilibrio (ref. ${producto.nombre}, canal ${canalLabel}, ${tipoLabel.toLowerCase()}, ${precioFmt})`
    }

    return {
      tipo: 'resultado' as const,
      etiqueta,
      unidades,
      canalesExcluidos,
    }
  }, [
    calcState,
    precios,
    producto,
    componentes,
    modoCanal,
    totalMensual,
    costoProductoTotal,
    costoDisponible,
    costoFifoLoading,
  ])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!edit) return
    await upsertGastoFijo(edit)
    setEdit(null)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm) return
    setConfirming(true)
    try {
      await deleteGastoFijo(confirm.id, confirm.nombre)
      setConfirm(null)
      onRefresh()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-zinc-50 p-4 space-y-4">
        <div>
          <p className="text-sm text-zinc-600">Total gastos fijos mensuales (prorrateados)</p>
          <p className="text-2xl font-semibold">{formatCOP(totalMensual)}</p>
        </div>

        <div className="border-t border-zinc-200 pt-4">
          <p className="mb-3 text-sm font-medium text-zinc-800">
            Referencia para punto de equilibrio
          </p>

          <label className="mb-4 flex flex-col gap-1 text-sm max-w-sm">
            <span className="font-medium">Modo de canal</span>
            <select
              className="rounded-md border border-zinc-300 px-3 py-2"
              value={modoCanal}
              onChange={(e) => setModoCanal(e.target.value as ModoCanalEquilibrio)}
            >
              {MODOS_CANAL_EQUILIBRIO.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <CalculadoraVenta
            variant="parametros"
            hideTitle
            ocultarCanal={modoCanal !== 'especifico'}
            cantidadSoloDistribuidor
            productos={productos}
            preciosMap={preciosMap}
            componentes={componentes}
            onStateChange={setCalcState}
          />
        </div>

        <div className="space-y-1">
          <p
            className={
              mensajeEquilibrio.tipo === 'resultado'
                ? 'text-sm'
                : mensajeEquilibrio.tipo === 'warning'
                  ? 'text-sm text-amber-700'
                  : 'text-sm text-zinc-600'
            }
          >
            {mensajeEquilibrio.tipo === 'resultado' ? (
              <>
                {mensajeEquilibrio.etiqueta}:{' '}
                <strong>{mensajeEquilibrio.unidades} unidades/mes</strong>
              </>
            ) : (
              mensajeEquilibrio.texto
            )}
          </p>
          {mensajeEquilibrio.tipo === 'resultado' &&
            mensajeEquilibrio.canalesExcluidos.length > 0 && (
              <p className="text-xs text-amber-700">
                Canales excluidos del cálculo:{' '}
                {mensajeEquilibrio.canalesExcluidos
                  .map(
                    (e) =>
                      `${CANALES.find((c) => c.value === e.canal)?.label ?? e.canal} (${e.motivo})`
                  )
                  .join(', ')}
                .
              </p>
            )}
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          setEdit({ concepto: '', monto: 0, periodicidad: 'mensual', activo: true })
        }
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white"
      >
        + Gasto fijo
      </button>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2 text-left">Periodicidad</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {gastos.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="px-3 py-2">{g.concepto}</td>
                <td className="px-3 py-2 text-right">{formatCOP(g.monto)}</td>
                <td className="px-3 py-2 capitalize">{g.periodicidad}</td>
                <td className="px-3 py-2">
                  <RowActions
                    onEdit={() => setEdit(g as unknown as Record<string, unknown>)}
                    onDelete={() => setConfirm({ id: g.id, nombre: g.concepto })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <form onSubmit={save} className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Concepto</span>
            <input
              value={String(edit.concepto ?? '')}
              onChange={(e) => setEdit({ ...edit, concepto: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Monto</span>
            <CurrencyInput
              value={edit.monto != null ? Number(edit.monto) : null}
              onChange={(monto) => setEdit({ ...edit, monto: monto ?? 0 })}
              className="text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Periodicidad</span>
            <select
              value={String(edit.periodicidad ?? 'mensual')}
              onChange={(e) => setEdit({ ...edit, periodicidad: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
              <option value="unico">Único</option>
            </select>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEdit(null)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Eliminar gasto fijo"
        message={
          confirm
            ? `¿Seguro que quieres eliminar "${confirm.nombre}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirming={confirming}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
