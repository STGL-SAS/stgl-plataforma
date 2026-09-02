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

function num(v: unknown): number {
  return v != null && !Number.isNaN(Number(v)) ? Number(v) : 0
}

export async function getDashboardData() {
  const supabase = createAdminClient()
  const mesActual = new Date()
  const mesIso = `${mesActual.getFullYear()}-${String(mesActual.getMonth() + 1).padStart(2, '0')}-01`

  const [
    alertasRes,
    balanceRes,
    movimientosRes,
    aportesRes,
    utilidadRes,
    tareasRes,
    hardtechRes,
    negociosRes,
  ] = await Promise.all([
    supabase.from('v_alertas_dashboard').select('*'),
    supabase.from('v_balance_por_negocio').select('*'),
    supabase.from('v_movimientos_mensuales').select('*').gte('mes', monthsAgoIso(11)),
    supabase.from('v_aportes_por_socio').select('*'),
    supabase.from('v_utilidad_repartible').select('*'),
    supabase.from('v_tareas_estado_por_negocio').select('*'),
    supabase.from('v_utilidad_hardtech').select('*').maybeSingle(),
    supabase.from('negocios').select('id, codigo, nombre').in('codigo', [...NEGOCIOS_DASHBOARD]),
  ])

  const errors = [
    alertasRes.error,
    balanceRes.error,
    movimientosRes.error,
    aportesRes.error,
    utilidadRes.error,
    tareasRes.error,
    hardtechRes.error,
    negociosRes.error,
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

  const movMes = (movimientosRes.data ?? []).filter((m) => String(m.mes).startsWith(mesIso.slice(0, 7)))
  const utilidadHt = num(hardtechRes.data?.utilidad_neta)

  const byCodigo = new Map(
    (balanceRes.data ?? []).map((b) => [String(b.negocio_codigo), b])
  )

  const balances: BalanceNegocio[] = (negociosRes.data ?? [])
    .map((n) => {
      const b = byCodigo.get(n.codigo as string)
      const mes = movMes.find((m) => m.negocio_id === n.id)
      const ingresos = num(b?.ingresos)
      const egresos = num(b?.egresos)
      const ingresos_mes = num(mes?.ingresos)
      const egresos_mes = num(mes?.egresos)
      const isHt = n.codigo === 'HARDTECH'
      return {
        negocio_id: n.id as string,
        negocio_codigo: n.codigo as string,
        negocio_nombre: n.nombre as string,
        ingresos,
        egresos,
        balance: isHt ? utilidadHt : ingresos - egresos,
        ingresos_mes,
        egresos_mes,
        balance_mes: ingresos_mes - egresos_mes,
        utilidad_hardtech: isHt ? utilidadHt : undefined,
      }
    })
    .sort(
      (a, b) =>
        NEGOCIOS_DASHBOARD.indexOf(a.negocio_codigo as (typeof NEGOCIOS_DASHBOARD)[number]) -
        NEGOCIOS_DASHBOARD.indexOf(b.negocio_codigo as (typeof NEGOCIOS_DASHBOARD)[number])
    )

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

  return {
    alertas,
    balances,
    movimientos,
    aportes: [...aportesMap.values()].sort((a, b) => a.socio_nombre.localeCompare(b.socio_nombre)),
    utilidad,
    tareas,
  }
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
