'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { slugToCodigo } from './slugs'

export type NegocioRecord = {
  id: string
  codigo: string
  nombre: string
  estado: string
}

export async function getNegocioBySlug(slug: string): Promise<NegocioRecord | null> {
  const codigo = slugToCodigo(slug)
  if (!codigo) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('negocios')
    .select('id, codigo, nombre, estado')
    .eq('codigo', codigo)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    id: data.id as string,
    codigo: data.codigo as string,
    nombre: data.nombre as string,
    estado: data.estado as string,
  }
}

export async function assertNegocioSlug(slug: string): Promise<NegocioRecord> {
  const negocio = await getNegocioBySlug(slug)
  if (!negocio) throw new Error(`Negocio no encontrado: ${slug}`)
  return negocio
}
