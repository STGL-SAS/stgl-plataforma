'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  AporteSocio,
  AporteSocioInput,
  EstadoCuentaNegocio,
  EstadoCuentaSocio,
} from '../types'
import { getNegocios } from './transacciones'

function mapAporte(
  row: Record<string, unknown>,
  transaccion: Record<string, unknown>
): AporteSocio {
  const negocio = row.negocios as { codigo: string; nombre: string } | null
  return {
    id: row.id as string,
    transaccion_id: row.transaccion_id as string,
    negocio_id: row.negocio_id as string,
    socio_id: row.socio_id as string,
    monto: Number(transaccion.monto),
    fecha: transaccion.fecha as string,
    clasificacion: row.clasificacion as AporteSocio['clasificacion'],
    observaciones: (transaccion.observaciones as string | null) ?? null,
    negocio: negocio ?? undefined,
  }
}

export async function getAportesSocio(socio_id: string): Promise<AporteSocio[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('aportes_socios')
    .select('*, negocios(codigo, nombre), transacciones(monto, fecha, observaciones)')
    .eq('socio_id', socio_id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) =>
    mapAporte(row as Record<string, unknown>, row.transacciones as Record<string, unknown>)
  )
}

export async function getEstadoCuentaSocio(
  socio_id: string
): Promise<EstadoCuentaSocio> {
  const aportes = await getAportesSocio(socio_id)
  const negocios = await getNegocios()
  const porNegocioMap = new Map<string, EstadoCuentaNegocio>()

  for (const negocio of negocios) {
    porNegocioMap.set(negocio.id, {
      negocio_id: negocio.id,
      negocio_codigo: negocio.codigo,
      negocio_nombre: negocio.nombre,
      total: 0,
      capital: 0,
      prestamo: 0,
      sin_definir: 0,
    })
  }

  for (const aporte of aportes) {
    const entry = porNegocioMap.get(aporte.negocio_id)
    if (!entry) continue

    entry.total += aporte.monto
    if (aporte.clasificacion === 'capital') entry.capital += aporte.monto
    else if (aporte.clasificacion === 'prestamo') entry.prestamo += aporte.monto
    else entry.sin_definir += aporte.monto
  }

  const por_negocio = [...porNegocioMap.values()].filter((n) => n.total > 0)
  const total_general = por_negocio.reduce((sum, n) => sum + n.total, 0)

  return { socio_id, por_negocio, total_general }
}

export async function createAporteSocio(
  input: AporteSocioInput
): Promise<AporteSocio> {
  const supabase = createAdminClient()

  const { data: transaccion, error: txError } = await supabase
    .from('transacciones')
    .insert({
      negocio_id: input.negocio_id,
      tipo: 'aporte',
      categoria: 'aporte_socio',
      monto: input.monto,
      fecha: input.fecha,
      nombre_interno: `Aporte socio`,
      observaciones: input.observaciones ?? null,
      estado: 'clasificada',
      origen: 'manual',
    })
    .select()
    .single()

  if (txError) throw new Error(txError.message)

  const { data: aporte, error: aporteError } = await supabase
    .from('aportes_socios')
    .insert({
      transaccion_id: transaccion.id,
      socio_id: input.socio_id,
      negocio_id: input.negocio_id,
      clasificacion: input.clasificacion,
    })
    .select('*, negocios(codigo, nombre)')
    .single()

  if (aporteError) throw new Error(aporteError.message)

  return mapAporte(
    aporte as Record<string, unknown>,
    transaccion as Record<string, unknown>
  )
}
