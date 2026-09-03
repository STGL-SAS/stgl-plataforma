import { formatCOP } from './format'
import type {
  AlertaDashboard,
  AporteResumen,
  LiveFeedItem,
  MovimientoMensual,
  NegocioCardData,
  TareasEstadoNegocio,
  UtilidadRepartible,
} from './dashboard'
import {
  balancePeriodLabel,
  dateInRange,
  monthOverlapsRange,
  periodSuffix,
  previousPeriodRange,
  type DateRange,
} from './dashboard-date-filter'

export type HydrexVentaRow = {
  cantidad: number
  margen_pct: number
  created_at: string
}

export type HardtechVentaRow = {
  id: string
  fecha_cotizacion: string | null
  estado: string
}

export type DashboardRawData = {
  alertas: AlertaDashboard[]
  movimientos: MovimientoMensual[]
  hydrexVentas: HydrexVentaRow[]
  hydrexStockTotal: number
  hardtechVentas: HardtechVentaRow[]
  hardtechSaldoPendiente: number
  aportes: AporteResumen[]
  utilidad: UtilidadRepartible[]
  tareas: TareasEstadoNegocio[]
  liveFeed: LiveFeedItem[]
  negocios: { id: string; codigo: string; nombre: string }[]
}

export type DashboardComputed = {
  summary: {
    consolidatedNav: number
    growthPct: number | null
    segmentWeights: { codigo: string; weight: number }[]
    growthLabel: string
    balanceLabel: string
  }
  movimientosFiltered: MovimientoMensual[]
  negocioCards: NegocioCardData[]
  balancesPeriod: { negocio_codigo: string; balance: number }[]
}

function num(v: unknown): number {
  return v != null && !Number.isNaN(Number(v)) ? Number(v) : 0
}

function formatCopPlain(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

function netMovimientosInRange(movimientos: MovimientoMensual[], range: DateRange): number {
  return movimientos
    .filter((m) => monthOverlapsRange(m.mes, range))
    .reduce((s, m) => s + m.ingresos - m.egresos, 0)
}

function netByNegocioInRange(
  movimientos: MovimientoMensual[],
  negocioId: string,
  range: DateRange
): number {
  return movimientos
    .filter((m) => m.negocio_id === negocioId && monthOverlapsRange(m.mes, range))
    .reduce((s, m) => s + m.ingresos - m.egresos, 0)
}

export function computeDashboardForRange(
  raw: DashboardRawData,
  range: DateRange
): DashboardComputed {
  const suffix = periodSuffix(range.preset)
  const tareasByCodigo = new Map(raw.tareas.map((t) => [t.negocio_codigo, t]))

  const hydrexVentas = raw.hydrexVentas.filter((v) => dateInRange(v.created_at, range))
  const hydrexUnidades = hydrexVentas.reduce((s, v) => s + num(v.cantidad), 0)
  const hydrexMargenProm =
    hydrexVentas.length > 0
      ? hydrexVentas.reduce((s, v) => s + num(v.margen_pct), 0) / hydrexVentas.length
      : null

  const hardtechCerradas = raw.hardtechVentas.filter(
    (v) =>
      v.estado === 'cerrada' &&
      v.fecha_cotizacion &&
      dateInRange(v.fecha_cotizacion, range)
  ).length

  const balancesPeriod = raw.negocios.map((n) => ({
    negocio_codigo: n.codigo,
    balance: netByNegocioInRange(raw.movimientos, n.id, range),
  }))

  const negocioCards: NegocioCardData[] = raw.negocios.map((n) => {
    const codigo = n.codigo

    if (codigo === 'HYDREX') {
      return {
        negocio_codigo: codigo,
        estado: 'ACTIVO',
        metric1: {
          label: `Unidades vendidas (${suffix})`,
          value: String(hydrexUnidades),
          empty: false,
        },
        metric2:
          hydrexMargenProm != null
            ? {
                label: `Margen promedio (${suffix})`,
                value: `${(hydrexMargenProm * 100).toFixed(1)}%`,
                empty: false,
              }
            : {
                label: 'Stock disponible',
                value: String(Math.round(raw.hydrexStockTotal)),
                empty: false,
                hint:
                  hydrexUnidades === 0
                    ? 'Sin ventas en el período — stock actual'
                    : undefined,
              },
      }
    }

    if (codigo === 'HARDTECH') {
      return {
        negocio_codigo: codigo,
        estado: 'ACTIVO',
        metric1: {
          label: `Ventas cerradas (${suffix})`,
          value: String(hardtechCerradas),
          empty: false,
        },
        metric2: {
          label: 'Saldo pendiente socios',
          value: formatCopPlain(raw.hardtechSaldoPendiente),
          empty: false,
          hint: 'Acumulado — no filtra por fecha',
        },
      }
    }

    const tarea = tareasByCodigo.get(codigo)
    const abiertas = tarea?.abiertas ?? 0
    const resueltas = tarea?.resueltas ?? 0
    const total = abiertas + resueltas
    const avancePct = total > 0 ? Math.round((resueltas / total) * 100) : 0

    return {
      negocio_codigo: codigo,
      estado: 'EN DESARROLLO',
      metric1: {
        label: 'Tareas abiertas',
        value: String(abiertas),
        empty: false,
      },
      metric2: {
        label: 'Avance tareas',
        value: `${avancePct}%`,
        empty: false,
        hint: total === 0 ? 'Sin tareas registradas' : undefined,
      },
    }
  })

  const consolidatedNav = balancesPeriod.reduce((s, b) => s + b.balance, 0)
  const prevRange = previousPeriodRange(range)
  const netActual = netMovimientosInRange(raw.movimientos, range)
  const netPrev = prevRange ? netMovimientosInRange(raw.movimientos, prevRange) : 0
  const growthPct =
    prevRange == null
      ? null
      : netPrev !== 0
        ? ((netActual - netPrev) / Math.abs(netPrev)) * 100
        : netActual !== 0
          ? 100
          : 0

  const growthLabel =
    growthPct == null
      ? 'Sin base comparativa'
      : `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%`

  const segmentRaw = balancesPeriod.map((b) => ({
    codigo: b.negocio_codigo,
    weight: Math.max(0, Math.abs(b.balance)),
  }))
  const segmentTotal = segmentRaw.reduce((s, x) => s + x.weight, 0) || 1

  const movimientosFiltered = raw.movimientos.filter((m) => monthOverlapsRange(m.mes, range))

  return {
    summary: {
      consolidatedNav,
      growthPct,
      segmentWeights: segmentRaw.map((x) => ({
        codigo: x.codigo,
        weight: x.weight / segmentTotal,
      })),
      growthLabel,
      balanceLabel: balancePeriodLabel(range.preset),
    },
    movimientosFiltered,
    negocioCards,
    balancesPeriod,
  }
}

export { formatCOP }
