import { calcularVenta } from './motor-calculo'
import type { Canal, ComponenteCosto, HydrexProducto, TipoPrecio } from './tipos'
import { CANALES } from './tipos'

export interface EstadoCalculoVenta {
  canal: Canal
  productoId: string
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  incluyeEnvio: boolean
  valorEnvio: number
  componentesActivos: Record<string, boolean>
}

export type ModoCanalEquilibrio = 'especifico' | 'peor_caso' | 'promedio'

export const MODOS_CANAL_EQUILIBRIO: { value: ModoCanalEquilibrio; label: string }[] = [
  { value: 'especifico', label: 'Canal específico' },
  { value: 'peor_caso', label: 'Peor caso (canal con más costos)' },
  { value: 'promedio', label: 'Promedio entre canales' },
]

export function cantidadEfectivaParaPrecio(tipoPrecio: TipoPrecio, cantidad: number): number {
  return tipoPrecio === 'distribuidor' ? cantidad : 1
}

export function calcularVentaParaCanal(
  costoProductoTotal: number | null,
  producto: HydrexProducto,
  state: EstadoCalculoVenta,
  componentes: ComponenteCosto[],
  canal: Canal
) {
  const componentesCanal = componentes.filter(
    (c) => !c.canales_aplica?.length || c.canales_aplica.includes(canal)
  )
  const cantidad = cantidadEfectivaParaPrecio(state.tipoPrecio, state.cantidad)
  return calcularVenta({
    costoProductoTotal,
    precioVentaUnitario: state.precioUnitario,
    cantidad,
    canal,
    componentesDisponibles: componentesCanal,
    componentesActivos: state.componentesActivos,
    incluyeEnvio: state.incluyeEnvio,
    valorEnvio: state.valorEnvio,
    unidadesEquivalentes: producto.unidades_equivalentes ?? 1,
  })
}

function esResultadoValido(resultado: ReturnType<typeof calcularVenta>): boolean {
  return resultado.costoDisponible && resultado.gananciaPorUnidad != null
}

export interface GananciaEquilibrioResultado {
  ok: true
  gananciaPorUnidad: number
  canalPeorCaso?: Canal
  canalesExcluidos: { canal: Canal; motivo: string }[]
}

export interface GananciaEquilibrioError {
  ok: false
  canalesExcluidos: { canal: Canal; motivo: string }[]
}

export function calcularGananciaEquilibrio(
  costoProductoTotal: number | null,
  producto: HydrexProducto,
  calcState: EstadoCalculoVenta,
  componentes: ComponenteCosto[],
  modoCanal: ModoCanalEquilibrio
): GananciaEquilibrioResultado | GananciaEquilibrioError {
  if (costoProductoTotal == null) {
    return { ok: false, canalesExcluidos: [] }
  }

  if (modoCanal === 'especifico') {
    const resultado = calcularVentaParaCanal(
      costoProductoTotal,
      producto,
      calcState,
      componentes,
      calcState.canal
    )
    if (!esResultadoValido(resultado)) {
      return {
        ok: false,
        canalesExcluidos: [{ canal: calcState.canal, motivo: 'sin cálculo disponible' }],
      }
    }
    return {
      ok: true,
      gananciaPorUnidad: resultado.gananciaPorUnidad!,
      canalesExcluidos: [],
    }
  }

  const porCanal = CANALES.map(({ value: canal }) => ({
    canal,
    resultado: calcularVentaParaCanal(
      costoProductoTotal,
      producto,
      calcState,
      componentes,
      canal
    ),
  }))

  const canalesExcluidos: { canal: Canal; motivo: string }[] = []
  const validos = porCanal.filter(({ canal, resultado }) => {
    if (esResultadoValido(resultado)) return true
    canalesExcluidos.push({ canal, motivo: 'sin cálculo disponible' })
    return false
  })

  if (validos.length === 0) {
    return { ok: false, canalesExcluidos }
  }

  if (modoCanal === 'peor_caso') {
    const peor = validos.reduce((min, cur) =>
      cur.resultado.gananciaPorUnidad! < min.resultado.gananciaPorUnidad! ? cur : min
    )
    return {
      ok: true,
      gananciaPorUnidad: peor.resultado.gananciaPorUnidad!,
      canalPeorCaso: peor.canal,
      canalesExcluidos,
    }
  }

  const promedio =
    validos.reduce((sum, v) => sum + v.resultado.gananciaPorUnidad!, 0) / validos.length
  return {
    ok: true,
    gananciaPorUnidad: promedio,
    canalesExcluidos,
  }
}
