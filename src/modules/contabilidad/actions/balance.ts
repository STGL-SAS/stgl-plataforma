'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUtilidadHardtechCalculada } from '@/modules/hardtech/lib/queries'

export interface BalanceNegocio {
  negocio_id: string
  negocio_codigo: string
  negocio_nombre: string
  ingresos: number
  egresos: number
  utilidad: number
  /** HARDTECH: utilidad calculada por ganancia neta; otros: ingresos − egresos */
  origen: 'transacciones' | 'ganancia_calculada'
}

export interface UtilidadSocio {
  socio_id: string
  socio_nombre: string
  negocio_codigo: string
  negocio_nombre: string
  porcentaje: number
  utilidad_negocio: number
  utilidad_teorica: number
}

export interface BalanceConsolidado {
  por_negocio: BalanceNegocio[]
  total_consolidado: number
  utilidad_por_socio: UtilidadSocio[]
}

async function utilidadDesdeTransacciones(negocioId: string): Promise<{
  ingresos: number
  egresos: number
  utilidad: number
}> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transacciones')
    .select('tipo, monto')
    .eq('negocio_id', negocioId)
    .eq('estado', 'clasificada')
    .in('tipo', ['ingreso', 'egreso'])

  if (error) throw new Error(error.message)

  let ingresos = 0
  let egresos = 0
  for (const t of data ?? []) {
    const m = Number(t.monto)
    if (t.tipo === 'ingreso') ingresos += m
    else if (t.tipo === 'egreso') egresos += m
  }
  return { ingresos, egresos, utilidad: ingresos - egresos }
}

export async function getBalanceConsolidado(): Promise<BalanceConsolidado> {
  const supabase = createAdminClient()

  const [{ data: negocios, error: negError }, { data: participaciones, error: partError }] =
    await Promise.all([
      supabase
        .from('negocios')
        .select('id, codigo, nombre')
        .neq('codigo', 'STGL')
        .order('codigo'),
      supabase
        .from('socios_participacion')
        .select('negocio_id, socio_id, porcentaje, socios(nombre), negocios(codigo, nombre)'),
    ])

  if (negError) throw new Error(negError.message)
  if (partError) throw new Error(partError.message)

  const hardtechUtilidad = await getUtilidadHardtechCalculada()

  const por_negocio: BalanceNegocio[] = []

  for (const n of negocios ?? []) {
    if (n.codigo === 'HARDTECH') {
      // HARDTECH no tiene cuenta bancaria propia: la utilidad no sale de
      // ingresos−egresos en `transacciones`, sino de ganancia neta de ventas/
      // mantenimientos menos gastos fijos y ocasionales (ver getUtilidadHardtechCalculada).
      // En HYDREX/HANGARC/VirtualWaiter los gastos_fijos son solo referenciales
      // (punto de equilibrio) y NO restan aquí — el egreso real ya está en el ledger.
      por_negocio.push({
        negocio_id: n.id,
        negocio_codigo: n.codigo,
        negocio_nombre: n.nombre,
        ingresos: 0,
        egresos: 0,
        utilidad: hardtechUtilidad,
        origen: 'ganancia_calculada',
      })
    } else {
      const tx = await utilidadDesdeTransacciones(n.id)
      por_negocio.push({
        negocio_id: n.id,
        negocio_codigo: n.codigo,
        negocio_nombre: n.nombre,
        ...tx,
        origen: 'transacciones',
      })
    }
  }

  const total_consolidado = por_negocio.reduce((s, b) => s + b.utilidad, 0)

  const utilidad_por_socio: UtilidadSocio[] = []
  const utilidadMap = new Map(por_negocio.map((b) => [b.negocio_id, b.utilidad]))

  for (const p of participaciones ?? []) {
    const negJoined = p.negocios as unknown
    const negRaw = (Array.isArray(negJoined) ? negJoined[0] : negJoined) as {
      codigo: string
      nombre: string
    } | null
    const socioJoined = p.socios as unknown
    const socioRaw = (Array.isArray(socioJoined) ? socioJoined[0] : socioJoined) as {
      nombre: string
    } | null
    const utilidadNegocio = utilidadMap.get(p.negocio_id) ?? 0
    utilidad_por_socio.push({
      socio_id: p.socio_id,
      socio_nombre: socioRaw?.nombre ?? '',
      negocio_codigo: negRaw?.codigo ?? '',
      negocio_nombre: negRaw?.nombre ?? '',
      porcentaje: Number(p.porcentaje),
      utilidad_negocio: utilidadNegocio,
      utilidad_teorica: utilidadNegocio * (Number(p.porcentaje) / 100),
    })
  }

  return { por_negocio, total_consolidado, utilidad_por_socio }
}
