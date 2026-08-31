'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { MovimientoIntercompania, MovimientoIntercompaniaInput } from '../types'

function mapMovimiento(row: Record<string, unknown>): MovimientoIntercompania {
  const origen = row.negocio_origen as { codigo: string; nombre: string } | null
  const destino = row.negocio_destino as { codigo: string; nombre: string } | null

  return {
    id: row.id as string,
    negocio_origen_id: row.negocio_origen_id as string,
    negocio_destino_id: row.negocio_destino_id as string,
    monto: Number(row.monto),
    fecha: row.fecha as string,
    concepto: row.concepto as string,
    observaciones: (row.observaciones as string | null) ?? null,
    estado: (row.estado as MovimientoIntercompania['estado']) ?? 'pendiente',
    negocio_origen: origen ?? undefined,
    negocio_destino: destino ?? undefined,
  }
}

export async function getMovimientosIntercompania(): Promise<MovimientoIntercompania[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('movimientos_intercompania')
    .select(
      '*, negocio_origen:negocios!movimientos_intercompania_negocio_origen_id_fkey(codigo, nombre), negocio_destino:negocios!movimientos_intercompania_negocio_destino_id_fkey(codigo, nombre)'
    )
    .order('fecha', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapMovimiento)
}

export async function createMovimientoIntercompania(
  input: MovimientoIntercompaniaInput
): Promise<MovimientoIntercompania> {
  if (input.negocio_origen_id === input.negocio_destino_id) {
    throw new Error('El negocio origen y destino deben ser distintos')
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('movimientos_intercompania')
    .insert({
      negocio_origen_id: input.negocio_origen_id,
      negocio_destino_id: input.negocio_destino_id,
      monto: input.monto,
      fecha: input.fecha,
      concepto: input.concepto,
      observaciones: input.observaciones ?? null,
      estado: 'pendiente',
    })
    .select(
      '*, negocio_origen:negocios!movimientos_intercompania_negocio_origen_id_fkey(codigo, nombre), negocio_destino:negocios!movimientos_intercompania_negocio_destino_id_fkey(codigo, nombre)'
    )
    .single()

  if (error) throw new Error(error.message)
  return mapMovimiento(data)
}

export async function marcarIntercompaniaSaldado(
  id: string
): Promise<MovimientoIntercompania> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('movimientos_intercompania')
    .update({ estado: 'saldado' })
    .eq('id', id)
    .select(
      '*, negocio_origen:negocios!movimientos_intercompania_negocio_origen_id_fkey(codigo, nombre), negocio_destino:negocios!movimientos_intercompania_negocio_destino_id_fkey(codigo, nombre)'
    )
    .single()

  if (error) throw new Error(error.message)
  return mapMovimiento(data)
}
