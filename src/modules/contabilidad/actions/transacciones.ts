'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CuentaBancaria,
  Negocio,
  Socio,
  Transaccion,
  TransaccionFiltros,
  TransaccionManualInput,
} from '../types'

function mapTransaccion(row: Record<string, unknown>): Transaccion {
  const negocio = row.negocios as { codigo: string; nombre: string } | null
  return {
    id: row.id as string,
    negocio_id: row.negocio_id as string,
    cuenta_id: (row.cuenta_id as string | null) ?? null,
    tipo: row.tipo as Transaccion['tipo'],
    categoria: (row.categoria as string | null) ?? null,
    monto: Number(row.monto),
    fecha: row.fecha as string,
    estado: row.estado as Transaccion['estado'],
    origen: row.origen as Transaccion['origen'],
    nombre_original: (row.nombre_original as string | null) ?? null,
    nombre_interno: (row.nombre_interno as string | null) ?? null,
    observaciones: (row.observaciones as string | null) ?? null,
    origen_referencia_id: (row.origen_referencia_id as string | null) ?? null,
    created_at: row.created_at as string,
    negocio: negocio ?? undefined,
  }
}

export async function getNegocios(): Promise<Negocio[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('negocios')
    .select('id, codigo, nombre')
    .order('codigo')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getCuentasBancarias(): Promise<CuentaBancaria[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cuentas_bancarias')
    .select('id, nombre, tipo')
    .order('nombre')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSocios(): Promise<Socio[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('socios')
    .select('id, nombre')
    .order('nombre')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getCategoriasSugeridas(): Promise<string[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transacciones')
    .select('categoria')
    .not('categoria', 'is', null)
    .order('categoria')

  if (error) throw new Error(error.message)

  const unicas = [...new Set((data ?? []).map((r) => r.categoria as string))]
  return unicas.filter(Boolean)
}

export async function getTransacciones(
  filtros: TransaccionFiltros = {}
): Promise<Transaccion[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('transacciones')
    .select('*, negocios(codigo, nombre)')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (filtros.estado) query = query.eq('estado', filtros.estado)
  if (filtros.negocio_id) query = query.eq('negocio_id', filtros.negocio_id)
  if (filtros.categoria) query = query.eq('categoria', filtros.categoria)
  if (filtros.fecha_desde) query = query.gte('fecha', filtros.fecha_desde)
  if (filtros.fecha_hasta) query = query.lte('fecha', filtros.fecha_hasta)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapTransaccion)
}

export async function getBoldPendientes(): Promise<Transaccion[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transacciones')
    .select('*, negocios(codigo, nombre)')
    .eq('origen', 'bold')
    .eq('estado', 'pendiente_revision')
    .order('fecha', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapTransaccion)
}

export async function createTransaccionManual(
  input: TransaccionManualInput
): Promise<Transaccion> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transacciones')
    .insert({
      negocio_id: input.negocio_id,
      cuenta_id: input.cuenta_id,
      tipo: input.tipo,
      categoria: input.categoria,
      monto: input.monto,
      fecha: input.fecha,
      nombre_interno: input.nombre_interno,
      observaciones: input.observaciones ?? null,
      estado: 'clasificada',
      origen: 'manual',
    })
    .select('*, negocios(codigo, nombre)')
    .single()

  if (error) throw new Error(error.message)
  return mapTransaccion(data)
}

export async function clasificarTransaccionBold(
  id: string,
  nombre_interno: string,
  categoria: string,
  observaciones?: string
): Promise<Transaccion> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transacciones')
    .update({
      nombre_interno,
      categoria,
      observaciones: observaciones ?? null,
      estado: 'clasificada',
    })
    .eq('id', id)
    .eq('origen', 'bold')
    .select('*, negocios(codigo, nombre)')
    .single()

  if (error) throw new Error(error.message)
  return mapTransaccion(data)
}
