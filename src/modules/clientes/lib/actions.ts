'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { CLIENTES_NEGOCIO_CODIGOS } from './constants'

export async function getNegociosConClientes() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('negocios')
    .select('id, codigo, nombre')
    .in('codigo', [...CLIENTES_NEGOCIO_CODIGOS])
    .order('codigo')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getClientesByNegocio(negocioId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('nombre')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function upsertClienteNegocio(input: {
  id?: string
  negocio_id: string
  nombre: string
  contacto?: Record<string, unknown>
  notas?: string | null
}) {
  const supabase = createAdminClient()
  const row = {
    negocio_id: input.negocio_id,
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

export async function deleteClienteNegocio(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
