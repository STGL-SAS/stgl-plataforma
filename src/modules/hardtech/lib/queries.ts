'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { calcularGananciaMantenimiento, calcularGananciaVenta } from '../motor-calculo'
import type {
  HardtechCompra,
  HardtechEstadoVenta,
  HardtechGastoExtra,
  HardtechMantenimiento,
  HardtechPagoSocio,
  HardtechVenta,
  SaldoSocioResultado,
} from './tipos'

export async function getHardtechNegocioId(): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('negocios')
    .select('id')
    .eq('codigo', 'HARDTECH')
    .single()
  if (error || !data) throw new Error('Negocio HARDTECH no encontrado')
  return data.id
}

export async function getClientesHardtech() {
  const negocioId = await getHardtechNegocioId()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('nombre')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSocios() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('socios').select('id, nombre').order('nombre')
  if (error) throw new Error(error.message)
  return data ?? []
}

function mapVenta(row: Record<string, unknown>): HardtechVenta {
  const clientes = row.clientes as { nombre: string } | { nombre: string }[] | null
  return {
    ...(row as unknown as HardtechVenta),
    propina: row.propina != null ? Number(row.propina) : 0,
    valor_venta_final: row.valor_venta_final != null ? Number(row.valor_venta_final) : null,
    anticipo_monto: row.anticipo_monto != null ? Number(row.anticipo_monto) : null,
    comision_terceros_pct:
      row.comision_terceros_pct != null ? Number(row.comision_terceros_pct) : null,
    comision_terceros_monto:
      row.comision_terceros_monto != null ? Number(row.comision_terceros_monto) : null,
    clientes: Array.isArray(clientes) ? clientes[0] : clientes,
  }
}

export async function getVentasHardtech(filtros?: {
  estado?: HardtechEstadoVenta
  cliente_id?: string
  desde?: string
  hasta?: string
}): Promise<HardtechVenta[]> {
  const supabase = createAdminClient()
  let q = supabase
    .from('hardtech_ventas')
    .select('*, clientes(nombre)')
    .order('created_at', { ascending: false })

  if (filtros?.estado) q = q.eq('estado', filtros.estado)
  if (filtros?.cliente_id) q = q.eq('cliente_id', filtros.cliente_id)
  if (filtros?.desde) q = q.gte('fecha_cotizacion', filtros.desde)
  if (filtros?.hasta) q = q.lte('fecha_cotizacion', filtros.hasta)

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => mapVenta(r as Record<string, unknown>))
}

export async function getVentaHardtech(id: string): Promise<HardtechVenta | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hardtech_ventas')
    .select('*, clientes(nombre)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapVenta(data as Record<string, unknown>) : null
}

export async function getComprasVenta(ventaId: string): Promise<HardtechCompra[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hardtech_compras')
    .select('*')
    .eq('venta_id', ventaId)
    .order('fecha_compra')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    ...r,
    monto: Number(r.monto),
    tasa_cambio: r.tasa_cambio != null ? Number(r.tasa_cambio) : null,
    monto_cop_equivalente: Number(r.monto_cop_equivalente),
  })) as HardtechCompra[]
}

export async function getGastosExtraVenta(ventaId: string): Promise<HardtechGastoExtra[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hardtech_gastos_extra')
    .select('*')
    .eq('venta_id', ventaId)
    .order('fecha')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    ...r,
    monto: Number(r.monto),
    tasa_cambio: r.tasa_cambio != null ? Number(r.tasa_cambio) : null,
    monto_cop_equivalente: Number(r.monto_cop_equivalente),
  })) as HardtechGastoExtra[]
}

export async function getMantenimientosHardtech(): Promise<HardtechMantenimiento[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hardtech_mantenimientos')
    .select('*, clientes(nombre)')
    .order('fecha', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => {
    const clientes = r.clientes as { nombre: string } | { nombre: string }[] | null
    return {
      ...r,
      anticipo_monto: r.anticipo_monto != null ? Number(r.anticipo_monto) : null,
      pago_final_monto: r.pago_final_monto != null ? Number(r.pago_final_monto) : null,
      honorarios_monto: r.honorarios_monto != null ? Number(r.honorarios_monto) : null,
      insumos_monto: r.insumos_monto != null ? Number(r.insumos_monto) : null,
      domicilio_monto: r.domicilio_monto != null ? Number(r.domicilio_monto) : null,
      clientes: Array.isArray(clientes) ? clientes[0] : clientes,
    }
  }) as HardtechMantenimiento[]
}

export async function getPagosSociosHardtech(): Promise<HardtechPagoSocio[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hardtech_pagos_socios')
    .select('*, socios(nombre)')
    .order('fecha', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => {
    const socios = r.socios as { nombre: string } | { nombre: string }[] | null
    return {
      ...r,
      monto: Number(r.monto),
      socios: Array.isArray(socios) ? socios[0] : socios,
    }
  }) as HardtechPagoSocio[]
}

export async function getSaldoSociosHardtech(): Promise<SaldoSocioResultado[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('hardtech_saldo_socios').select('*')
  if (error) throw new Error(error.message)
  return (data ?? [])
    .filter((r) => Number(r.total_puesto) > 0 || Number(r.total_recibido) > 0)
    .map((r) => ({
      socio_id: r.socio_id as string,
      socio_nombre: r.socio_nombre as string,
      total_puesto: Number(r.total_puesto),
      total_recibido: Number(r.total_recibido),
      saldo_neto: Number(r.saldo_neto),
    }))
}

export async function getCuentaDivisas() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cuentas_bancarias')
    .select('*')
    .eq('tipo', 'divisas')
    .eq('moneda', 'USD')
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getSaldoDivisasUsd(): Promise<number> {
  const cuenta = await getCuentaDivisas()
  if (!cuenta) return 0
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transacciones')
    .select('tipo, monto')
    .eq('cuenta_id', cuenta.id)
    .eq('estado', 'clasificada')
  if (error) throw new Error(error.message)
  return (data ?? []).reduce((sum, t) => {
    const m = Number(t.monto)
    return t.tipo === 'ingreso' ? sum + m : t.tipo === 'egreso' ? sum - m : sum
  }, 0)
}

export async function getMovimientosDivisas(limit = 50) {
  const cuenta = await getCuentaDivisas()
  if (!cuenta) return []
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transacciones')
    .select('id, tipo, monto, fecha, nombre_interno, categoria, observaciones')
    .eq('cuenta_id', cuenta.id)
    .order('fecha', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ ...r, monto: Number(r.monto) }))
}

export async function getUltimaTasaCambio(): Promise<number | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hardtech_compras')
    .select('tasa_cambio')
    .eq('moneda', 'USD')
    .not('tasa_cambio', 'is', null)
    .order('fecha_compra', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.tasa_cambio != null ? Number(data.tasa_cambio) : null
}

/** Ganancia neta HARDTECH para balance consolidado.
 *  = ventas cerradas + mantenimientos − gastos fijos activos − gastos ocasionales.
 *  HARDTECH no tiene cuenta bancaria: estos gastos no aparecen en `transacciones`,
 *  así que hay que restarlos aquí. HYDREX/etc. NO restan gastos_fijos en balance
 *  (allí el egreso real ya vive en el ledger). */
export async function getUtilidadHardtechCalculada(): Promise<number> {
  const negocioId = await getHardtechNegocioId()
  const ventas = await getVentasHardtech({ estado: 'cerrada' })
  let total = 0
  for (const v of ventas) {
    const [compras, gastos] = await Promise.all([
      getComprasVenta(v.id),
      getGastosExtraVenta(v.id),
    ])
    const calc = calcularGananciaVenta(v, compras, gastos)
    total += calc.gananciaNeta
  }
  const mantenimientos = await getMantenimientosHardtech()
  for (const m of mantenimientos) {
    total += calcularGananciaMantenimiento(m).ganancia
  }

  const supabase = createAdminClient()
  const [{ data: fijos, error: fijosError }, { data: ocasionales, error: ocError }] =
    await Promise.all([
      supabase
        .from('gastos_fijos')
        .select('monto, periodicidad')
        .eq('negocio_id', negocioId)
        .eq('activo', true),
      supabase.from('gastos_ocasionales').select('monto').eq('negocio_id', negocioId),
    ])
  if (fijosError) throw new Error(fijosError.message)
  if (ocError) throw new Error(ocError.message)

  // Fijos: equivalente mensual (anual/12) + únicos a monto completo; ocasionales: suma total.
  const gastosFijos = (fijos ?? []).reduce((sum, g) => {
    const m = Number(g.monto)
    if (g.periodicidad === 'anual') return sum + m / 12
    return sum + m
  }, 0)
  const gastosOcasionales = (ocasionales ?? []).reduce((sum, g) => sum + Number(g.monto), 0)

  return total - gastosFijos - gastosOcasionales
}

export async function getGastosFijosNegocio(negocioId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('gastos_fijos')
    .select('*, socios:pagado_por_socio_id(id, nombre)')
    .eq('negocio_id', negocioId)
    .order('concepto')
  if (error) throw new Error(error.message)
  return (data ?? []).map((g) => {
    const socioJoined = g.socios as unknown
    const socio = (Array.isArray(socioJoined) ? socioJoined[0] : socioJoined) as {
      id: string
      nombre: string
    } | null
    return {
      id: g.id as string,
      negocio_id: g.negocio_id as string,
      concepto: g.concepto as string,
      monto: Number(g.monto),
      periodicidad: g.periodicidad as string,
      fecha: g.fecha as string,
      activo: Boolean(g.activo),
      notas: (g.notas as string | null) ?? null,
      pagado_por_socio_id: (g.pagado_por_socio_id as string | null) ?? null,
      socio_nombre: socio?.nombre ?? null,
    }
  })
}

export async function getGastosOcasionalesNegocio(negocioId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('gastos_ocasionales')
    .select('*, socios:pagado_por_socio_id(id, nombre)')
    .eq('negocio_id', negocioId)
    .order('fecha', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((g) => {
    const socioJoined = g.socios as unknown
    const socio = (Array.isArray(socioJoined) ? socioJoined[0] : socioJoined) as {
      id: string
      nombre: string
    } | null
    return {
      id: g.id as string,
      negocio_id: g.negocio_id as string,
      concepto: g.concepto as string,
      monto: Number(g.monto),
      fecha: g.fecha as string,
      comprobante: (g.comprobante as string | null) ?? null,
      pagado_por_socio_id: (g.pagado_por_socio_id as string | null) ?? null,
      socio_nombre: socio?.nombre ?? null,
    }
  })
}

export async function getGastosFijosHardtech() {
  return getGastosFijosNegocio(await getHardtechNegocioId())
}

export async function getGastosOcasionalesHardtech() {
  return getGastosOcasionalesNegocio(await getHardtechNegocioId())
}

export async function getComprasParaAgrupar(excluirVentaId?: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hardtech_compras')
    .select('id, venta_id, lugar_compra, monto, moneda, fecha_compra, hardtech_ventas(titulo)')
    .is('agrupada_con', null)
    .order('fecha_compra', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []).filter((c) => !excluirVentaId || c.venta_id !== excluirVentaId)
}
