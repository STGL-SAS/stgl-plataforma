'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NEGOCIOS_DASHBOARD } from './format'

export type AlertaDashboard = {
  tipo: 'bold_pendiente' | 'documento_sin_categorizar' | 'tarea_vencida'
  cantidad: number
}

export type BalanceNegocio = {
  negocio_id: string
  negocio_codigo: string
  negocio_nombre: string
  ingresos: number
  egresos: number
  balance: number
  ingresos_mes: number
  egresos_mes: number
  balance_mes: number
  /** Solo HARDTECH: utilidad operativa del módulo */
  utilidad_hardtech?: number
}

export type MovimientoMensual = {
  negocio_id: string
  negocio_codigo: string
  negocio_nombre: string
  mes: string
  ingresos: number
  egresos: number
}

export type AporteResumen = {
  socio_id: string
  socio_nombre: string
  total: number
}

export type UtilidadRepartible = {
  negocio_nombre: string
  socio_nombre: string
  porcentaje: number
  utilidad_teorica: number
}

export type TareasEstadoNegocio = {
  negocio_id: string
  negocio_codigo: string
  negocio_nombre: string
  abiertas: number
  resueltas: number
}

export type NegocioCardMetric = {
  label: string
  value: string
  empty?: boolean
  hint?: string
}

export type NegocioCardData = {
  negocio_codigo: string
  estado: 'ACTIVO' | 'EN DESARROLLO'
  metric1: NegocioCardMetric
  metric2: NegocioCardMetric
}

export type LiveFeedItem = {
  id: string
  at: string
  text: string
  tone: 'alert' | 'neutral' | 'hydrex' | 'hangarc' | 'virtualwaiter' | 'hardtech' | 'contabilidad'
  href?: string
}

export type DashboardSummary = {
  consolidatedNav: number
  growthPct: number | null
  segmentWeights: { codigo: string; weight: number }[]
}

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

export type DashboardData = {
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

function num(v: unknown): number {
  return v != null && !Number.isNaN(Number(v)) ? Number(v) : 0
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createAdminClient()
  const fetchFrom = monthsAgoIso(35)

  const [
    alertasRes,
    movimientosRes,
    aportesRes,
    utilidadRes,
    tareasRes,
    negociosRes,
    hydrexVentasRes,
    hydrexStockRes,
    hardtechVentasRes,
    hardtechSaldoRes,
  ] = await Promise.all([
    supabase.from('v_alertas_dashboard').select('*'),
    supabase.from('v_movimientos_mensuales').select('*').gte('mes', fetchFrom),
    supabase.from('v_aportes_por_socio').select('*'),
    supabase.from('v_utilidad_repartible').select('*'),
    supabase.from('v_tareas_estado_por_negocio').select('*'),
    supabase.from('negocios').select('id, codigo, nombre').in('codigo', [...NEGOCIOS_DASHBOARD]),
    supabase
      .from('hydrex_ventas_detalle')
      .select('cantidad, margen_pct, created_at')
      .gte('created_at', `${fetchFrom}T00:00:00`),
    supabase.from('hydrex_stock_productos').select('stock_disponible'),
    supabase.from('hardtech_ventas').select('id, fecha_cotizacion, estado'),
    supabase.from('hardtech_saldo_socios').select('saldo_neto'),
  ])

  const errors = [
    alertasRes.error,
    movimientosRes.error,
    aportesRes.error,
    utilidadRes.error,
    tareasRes.error,
    negociosRes.error,
    hydrexVentasRes.error,
    hydrexStockRes.error,
    hardtechVentasRes.error,
    hardtechSaldoRes.error,
  ].filter(Boolean)
  if (errors.length) {
    throw new Error(errors[0]!.message)
  }

  const alertas: AlertaDashboard[] = (alertasRes.data ?? [])
    .map((r) => ({
      tipo: r.tipo as AlertaDashboard['tipo'],
      cantidad: Number(r.cantidad) || 0,
    }))
    .filter((a) => a.cantidad > 0)

  const movimientos: MovimientoMensual[] = (movimientosRes.data ?? []).map((m) => ({
    negocio_id: m.negocio_id as string,
    negocio_codigo: m.negocio_codigo as string,
    negocio_nombre: m.negocio_nombre as string,
    mes: String(m.mes).slice(0, 10),
    ingresos: num(m.ingresos),
    egresos: num(m.egresos),
  }))

  const aportesMap = new Map<string, AporteResumen>()
  for (const row of aportesRes.data ?? []) {
    const id = row.socio_id as string
    const prev = aportesMap.get(id)
    const add = num(row.total_aportado)
    if (prev) prev.total += add
    else
      aportesMap.set(id, {
        socio_id: id,
        socio_nombre: row.socio_nombre as string,
        total: add,
      })
  }

  const utilidad: UtilidadRepartible[] = (utilidadRes.data ?? []).map((u) => ({
    negocio_nombre: u.negocio_nombre as string,
    socio_nombre: u.socio_nombre as string,
    porcentaje: num(u.porcentaje),
    utilidad_teorica: num(u.utilidad_teorica),
  }))

  const tareas: TareasEstadoNegocio[] = (tareasRes.data ?? []).map((t) => ({
    negocio_id: t.negocio_id as string,
    negocio_codigo: t.negocio_codigo as string,
    negocio_nombre: t.negocio_nombre as string,
    abiertas: Number(t.abiertas) || 0,
    resueltas: Number(t.resueltas) || 0,
  }))

  const negocios = (negociosRes.data ?? [])
    .map((n) => ({
      id: n.id as string,
      codigo: n.codigo as string,
      nombre: n.nombre as string,
    }))
    .sort(
      (a, b) =>
        NEGOCIOS_DASHBOARD.indexOf(a.codigo as (typeof NEGOCIOS_DASHBOARD)[number]) -
        NEGOCIOS_DASHBOARD.indexOf(b.codigo as (typeof NEGOCIOS_DASHBOARD)[number])
    )

  const hydrexVentas: HydrexVentaRow[] = (hydrexVentasRes.data ?? []).map((v) => ({
    cantidad: num(v.cantidad),
    margen_pct: num(v.margen_pct),
    created_at: String(v.created_at),
  }))

  const hydrexStockTotal = (hydrexStockRes.data ?? []).reduce(
    (s, r) => s + num(r.stock_disponible),
    0
  )

  const hardtechVentas: HardtechVentaRow[] = (hardtechVentasRes.data ?? []).map((v) => ({
    id: v.id as string,
    fecha_cotizacion: v.fecha_cotizacion ? String(v.fecha_cotizacion).slice(0, 10) : null,
    estado: String(v.estado),
  }))

  const hardtechSaldoPendiente = (hardtechSaldoRes.data ?? []).reduce(
    (s, r) => s + Math.abs(num(r.saldo_neto)),
    0
  )

  const liveFeed = buildLiveFeed(alertas, aportesMap, tareas)

  return {
    alertas,
    movimientos,
    hydrexVentas,
    hydrexStockTotal,
    hardtechVentas,
    hardtechSaldoPendiente,
    aportes: [...aportesMap.values()].sort((a, b) => a.socio_nombre.localeCompare(b.socio_nombre)),
    utilidad,
    tareas,
    liveFeed,
    negocios,
  }
}

function formatCopPlain(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

function buildLiveFeed(
  alertas: AlertaDashboard[],
  aportes: Map<string, AporteResumen>,
  tareas: TareasEstadoNegocio[]
): LiveFeedItem[] {
  const now = new Date()
  const ts = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
  const items: LiveFeedItem[] = []

  for (const a of alertas) {
    if (a.tipo === 'bold_pendiente') {
      items.push({
        id: `bold-${a.cantidad}`,
        at: ts,
        text:
          a.cantidad === 1
            ? '1 transacción Bold pendiente por clasificar'
            : `${a.cantidad} transacciones Bold pendientes por clasificar`,
        tone: 'alert',
        href: '/contabilidad/bold-pendientes',
      })
    } else if (a.tipo === 'documento_sin_categorizar') {
      items.push({
        id: `doc-${a.cantidad}`,
        at: ts,
        text:
          a.cantidad === 1
            ? '1 documento sin categorizar'
            : `${a.cantidad} documentos sin categorizar`,
        tone: 'neutral',
        href: '/documentos',
      })
    } else if (a.tipo === 'tarea_vencida') {
      items.push({
        id: `tarea-${a.cantidad}`,
        at: ts,
        text: a.cantidad === 1 ? '1 tarea vencida' : `${a.cantidad} tareas vencidas`,
        tone: 'alert',
        href: '/tareas',
      })
    }
  }

  for (const t of tareas.filter((x) => x.abiertas > 0)) {
    const tone =
      t.negocio_codigo === 'HYDREX'
        ? 'hydrex'
        : t.negocio_codigo === 'HARDTECH'
          ? 'hardtech'
          : t.negocio_codigo === 'HANGARC'
            ? 'hangarc'
            : t.negocio_codigo === 'VIRTUALWAITER'
              ? 'virtualwaiter'
              : 'neutral'
    items.push({
      id: `tareas-${t.negocio_id}`,
      at: ts,
      text: `${t.negocio_nombre}: ${t.abiertas} tarea${t.abiertas === 1 ? '' : 's'} abierta${t.abiertas === 1 ? '' : 's'}`,
      tone,
      href: '/tareas',
    })
  }

  const aportesList = [...aportes.values()].filter((a) => a.total > 0)
  if (aportesList.length > 0) {
    const top = aportesList.sort((a, b) => b.total - a.total)[0]
    items.push({
      id: `aporte-${top.socio_id}`,
      at: ts,
      text: `Aportes registrados — ${top.socio_nombre}: ${formatCopPlain(top.total)} acumulado`,
      tone: 'contabilidad',
      href: '/contabilidad/socios',
    })
  }

  if (items.length === 0) {
    items.push({
      id: 'idle',
      at: ts,
      text: 'Sin alertas activas. Plataforma al día.',
      tone: 'neutral',
    })
  }

  return items.slice(0, 12)
}

function monthsAgoIso(n: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/** ¿Puede editar Configuración? Sin sesión (auth aún no cableada) se permite, como el resto de la app. */
export async function getConfigAuth(): Promise<{
  isSuperadmin: boolean
  userId: string | null
  email: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { isSuperadmin: true, userId: null, email: null }
    }

    const admin = createAdminClient()
    const { data: ur } = await admin
      .from('usuarios_roles')
      .select('rol')
      .eq('user_id', user.id)
      .maybeSingle()

    if (ur?.rol === 'superadmin') {
      return { isSuperadmin: true, userId: user.id, email: user.email ?? null }
    }

    const { data: socio } = await admin
      .from('socios')
      .select('rol')
      .eq('user_id', user.id)
      .maybeSingle()

    if (socio?.rol === 'superadmin') {
      return { isSuperadmin: true, userId: user.id, email: user.email ?? null }
    }

    return { isSuperadmin: false, userId: user.id, email: user.email ?? null }
  } catch {
    return { isSuperadmin: true, userId: null, email: null }
  }
}

export async function assertConfigSuperadmin() {
  const auth = await getConfigAuth()
  if (!auth.isSuperadmin) {
    throw new Error('Solo un superadmin puede realizar esta acción.')
  }
  return auth
}
