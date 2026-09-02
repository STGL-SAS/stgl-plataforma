'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getHardtechNegocioId } from '../lib/queries'
import type { HardtechEstadoVenta, HardtechGastoExtraTipo, HardtechMoneda, HardtechPagoSocioTipo } from '../lib/tipos'

export async function upsertClienteHardtech(input: {
  id?: string
  nombre: string
  contacto?: Record<string, unknown>
  notas?: string | null
}) {
  const supabase = createAdminClient()
  const negocioId = await getHardtechNegocioId()
  const row = {
    negocio_id: negocioId,
    nombre: input.nombre.trim(),
    contacto: input.contacto ?? {},
    notas: input.notas ?? null,
  }
  if (input.id) {
    const { error } = await supabase.from('clientes').update(row).eq('id', input.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('clientes').insert(row)
    if (error) throw new Error(error.message)
  }
}

export async function deleteClienteHardtech(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export type UpsertVentaInput = {
  id?: string
  cliente_id: string
  titulo: string
  descripcion?: string | null
  estado?: HardtechEstadoVenta
  fecha_cotizacion?: string | null
  documento_cotizacion?: string | null
  anticipo_monto?: number | null
  anticipo_fecha?: string | null
  anticipo_comprobante?: string | null
  anticipo_nota?: string | null
  valor_venta_final?: number | null
  propina?: number | null
  pago_final_fecha?: string | null
  pago_final_comprobante?: string | null
  comision_terceros_pct?: number | null
  comision_terceros_destinatario?: string | null
  comision_terceros_monto?: number | null
}

export async function upsertVentaHardtech(input: UpsertVentaInput) {
  const supabase = createAdminClient()
  const row = {
    cliente_id: input.cliente_id,
    titulo: input.titulo.trim(),
    descripcion: input.descripcion ?? null,
    estado: input.estado ?? 'pendiente_compra',
    fecha_cotizacion: input.fecha_cotizacion ?? null,
    documento_cotizacion: input.documento_cotizacion ?? null,
    anticipo_monto: input.anticipo_monto ?? null,
    anticipo_fecha: input.anticipo_fecha ?? null,
    anticipo_comprobante: input.anticipo_comprobante ?? null,
    anticipo_nota: input.anticipo_nota ?? null,
    valor_venta_final: input.valor_venta_final ?? null,
    propina: input.propina ?? 0,
    pago_final_fecha: input.pago_final_fecha ?? null,
    pago_final_comprobante: input.pago_final_comprobante ?? null,
    comision_terceros_pct: input.comision_terceros_pct ?? null,
    comision_terceros_destinatario: input.comision_terceros_destinatario ?? null,
    comision_terceros_monto: input.comision_terceros_monto ?? null,
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('hardtech_ventas')
      .update(row)
      .eq('id', input.id)
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return data.id as string
  }

  const { data, error } = await supabase.from('hardtech_ventas').insert(row).select('id').single()
  if (error) throw new Error(error.message)
  return data.id as string
}

export async function deleteVentaHardtech(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hardtech_ventas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function crearCompraHardtech(input: {
  venta_id: string
  lugar_compra: string
  metodo_pago: string
  moneda: HardtechMoneda
  monto: number
  tasa_cambio?: number | null
  fecha_compra: string
  comprobante?: string | null
  agrupada_con?: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hardtech_compras').insert({
    venta_id: input.venta_id,
    lugar_compra: input.lugar_compra.trim(),
    metodo_pago: input.metodo_pago.trim(),
    moneda: input.moneda,
    monto: input.monto,
    tasa_cambio: input.moneda === 'USD' ? input.tasa_cambio : null,
    fecha_compra: input.fecha_compra,
    comprobante: input.comprobante ?? null,
    agrupada_con: input.agrupada_con ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function deleteCompraHardtech(id: string) {
  const supabase = createAdminClient()
  const { data: compra } = await supabase
    .from('hardtech_compras')
    .select('transaccion_divisas_id')
    .eq('id', id)
    .maybeSingle()
  if (compra?.transaccion_divisas_id) {
    await supabase.from('transacciones').delete().eq('id', compra.transaccion_divisas_id)
  }
  const { error } = await supabase.from('hardtech_compras').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function crearGastoExtraHardtech(input: {
  venta_id: string
  tipo: HardtechGastoExtraTipo
  monto: number
  moneda?: HardtechMoneda
  tasa_cambio?: number | null
  fecha: string
  comprobante?: string | null
  nota?: string | null
}) {
  const supabase = createAdminClient()
  const moneda = input.moneda ?? 'COP'
  const { error } = await supabase.from('hardtech_gastos_extra').insert({
    venta_id: input.venta_id,
    tipo: input.tipo,
    monto: input.monto,
    moneda,
    tasa_cambio: moneda === 'USD' ? input.tasa_cambio : null,
    fecha: input.fecha,
    comprobante: input.comprobante ?? null,
    nota: input.nota ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function deleteGastoExtraHardtech(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hardtech_gastos_extra').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function upsertMantenimientoHardtech(input: {
  id?: string
  cliente_id: string
  titulo: string
  descripcion?: string | null
  fecha: string
  anticipo_monto?: number | null
  anticipo_fecha?: string | null
  pago_final_monto?: number | null
  pago_final_fecha?: string | null
  honorarios_monto?: number | null
  honorarios_destinatario?: string | null
  insumos_monto?: number | null
  insumos_detalle?: unknown
  domicilio_monto?: number | null
}) {
  const supabase = createAdminClient()
  const row = {
    cliente_id: input.cliente_id,
    titulo: input.titulo.trim(),
    descripcion: input.descripcion ?? null,
    fecha: input.fecha,
    anticipo_monto: input.anticipo_monto ?? null,
    anticipo_fecha: input.anticipo_fecha ?? null,
    pago_final_monto: input.pago_final_monto ?? null,
    pago_final_fecha: input.pago_final_fecha ?? null,
    honorarios_monto: input.honorarios_monto ?? 0,
    honorarios_destinatario: input.honorarios_destinatario ?? null,
    insumos_monto: input.insumos_monto ?? 0,
    insumos_detalle: input.insumos_detalle ?? [],
    domicilio_monto: input.domicilio_monto ?? 0,
  }

  if (input.id) {
    const { error } = await supabase.from('hardtech_mantenimientos').update(row).eq('id', input.id)
    if (error) throw new Error(error.message)
    return input.id
  }
  const { data, error } = await supabase
    .from('hardtech_mantenimientos')
    .insert(row)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id as string
}

export async function deleteMantenimientoHardtech(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hardtech_mantenimientos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function crearPagoSocioHardtech(input: {
  socio_id: string
  tipo: HardtechPagoSocioTipo
  monto: number
  fecha: string
  nota?: string | null
  venta_id?: string | null
  mantenimiento_id?: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hardtech_pagos_socios').insert({
    socio_id: input.socio_id,
    tipo: input.tipo,
    monto: input.monto,
    fecha: input.fecha,
    nota: input.nota ?? null,
    venta_id: input.venta_id ?? null,
    mantenimiento_id: input.mantenimiento_id ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function deletePagoSocioHardtech(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hardtech_pagos_socios').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Recarga manual de saldo USD (ingreso en cuenta divisas) */
export async function registrarIngresoDivisas(input: {
  monto: number
  fecha: string
  nombre_interno: string
  observaciones?: string
}) {
  const supabase = createAdminClient()
  const negocioId = await getHardtechNegocioId()
  const { data: cuenta } = await supabase
    .from('cuentas_bancarias')
    .select('id')
    .eq('tipo', 'divisas')
    .eq('moneda', 'USD')
    .single()
  if (!cuenta) throw new Error('Cuenta de divisas no encontrada')

  const { error } = await supabase.from('transacciones').insert({
    negocio_id: negocioId,
    cuenta_id: cuenta.id,
    tipo: 'ingreso',
    categoria: 'recarga_divisas',
    monto: input.monto,
    fecha: input.fecha,
    nombre_interno: input.nombre_interno,
    observaciones: input.observaciones ?? null,
    estado: 'clasificada',
    origen: 'manual',
  })
  if (error) throw new Error(error.message)
}

export async function upsertGastoFijoNegocio(input: {
  id?: string
  negocio_id: string
  concepto: string
  monto: number
  periodicidad: 'mensual' | 'anual' | 'unico'
  fecha?: string
  activo?: boolean
  notas?: string | null
  pagado_por_socio_id?: string | null
}) {
  const supabase = createAdminClient()
  const row = {
    negocio_id: input.negocio_id,
    concepto: input.concepto.trim(),
    monto: input.monto,
    periodicidad: input.periodicidad,
    fecha: input.fecha ?? new Date().toISOString().slice(0, 10),
    activo: input.activo ?? true,
    notas: input.notas ?? null,
    pagado_por_socio_id: input.pagado_por_socio_id || null,
  }
  if (input.id) {
    const { error } = await supabase.from('gastos_fijos').update(row).eq('id', input.id)
    if (error) throw new Error(error.message)
    return input.id
  }
  const { data, error } = await supabase.from('gastos_fijos').insert(row).select('id').single()
  if (error) throw new Error(error.message)
  return data.id as string
}

export async function deleteGastoFijoNegocio(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('gastos_fijos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function upsertGastoOcasional(input: {
  id?: string
  negocio_id: string
  concepto: string
  monto: number
  fecha: string
  comprobante?: string | null
  pagado_por_socio_id?: string | null
}) {
  const supabase = createAdminClient()
  const row = {
    negocio_id: input.negocio_id,
    concepto: input.concepto.trim(),
    monto: input.monto,
    fecha: input.fecha,
    comprobante: input.comprobante ?? null,
    pagado_por_socio_id: input.pagado_por_socio_id || null,
  }
  if (input.id) {
    const { error } = await supabase.from('gastos_ocasionales').update(row).eq('id', input.id)
    if (error) throw new Error(error.message)
    return input.id
  }
  const { data, error } = await supabase
    .from('gastos_ocasionales')
    .insert(row)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id as string
}

export async function deleteGastoOcasional(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('gastos_ocasionales').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function upsertGastoFijoHardtech(
  input: Omit<Parameters<typeof upsertGastoFijoNegocio>[0], 'negocio_id'>
) {
  return upsertGastoFijoNegocio({ ...input, negocio_id: await getHardtechNegocioId() })
}

export async function upsertGastoOcasionalHardtech(
  input: Omit<Parameters<typeof upsertGastoOcasional>[0], 'negocio_id'>
) {
  return upsertGastoOcasional({ ...input, negocio_id: await getHardtechNegocioId() })
}
