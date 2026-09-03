'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { isMsGraphConnected } from '@/lib/msgraph'
import { canManageOneDriveUi } from '@/modules/documentos/lib/auth-gate'
import type { NegocioOption } from '@/modules/documentos/lib/tipos'
import { getNegociosTareas, getSociosTareas } from '@/modules/tareas/lib/actions'
import type { NegocioOption as TareaNegocioOption, SocioOption } from '@/modules/tareas/types'
import { getNegocioBySlug, type NegocioRecord } from './queries'

export type NegocioPageContext = {
  negocio: NegocioRecord
  negociosTareas: TareaNegocioOption[]
  sociosTareas: SocioOption[]
  negociosDocumentos: NegocioOption[]
  documentosConnected: boolean
  documentosCanImport: boolean
  categoriasDocumentos: string[]
}

export async function getNegocioByCodigo(codigo: string): Promise<NegocioRecord | null> {
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

export async function getDocumentosContext(): Promise<{
  negociosDocumentos: NegocioOption[]
  documentosConnected: boolean
  documentosCanImport: boolean
  categoriasDocumentos: string[]
}> {
  let documentosConnected = false
  try {
    documentosConnected = await isMsGraphConnected()
  } catch {
    documentosConnected = false
  }

  const documentosCanImport = await canManageOneDriveUi()
  let negociosDocumentos: NegocioOption[] = []
  let categoriasDocumentos: string[] = ['general', 'STGL / general']

  try {
    const supabase = createAdminClient()
    const [{ data: negD }, { data: catRows }] = await Promise.all([
      supabase
        .from('negocios')
        .select('id, codigo, nombre, onedrive_root_folder_id')
        .order('codigo'),
      supabase.from('documentos').select('categoria').limit(200),
    ])
    negociosDocumentos = (negD ?? []).map((n) => ({
      id: n.id as string,
      codigo: n.codigo as string,
      nombre: n.nombre as string,
      onedrive_root_folder_id: (n.onedrive_root_folder_id as string | null) ?? null,
    }))
    const cats = [
      ...new Set((catRows ?? []).map((r) => r.categoria as string).filter(Boolean)),
    ].sort()
    if (cats.length > 0) categoriasDocumentos = cats
  } catch {
    // Migraciones pendientes
  }

  return { negociosDocumentos, documentosConnected, documentosCanImport, categoriasDocumentos }
}

export async function getNegocioPageContext(slug: string): Promise<NegocioPageContext | null> {
  const negocio = await getNegocioBySlug(slug)
  if (!negocio) return null

  const [tareasCtx, docsCtx] = await Promise.all([
    (async () => {
      try {
        const [neg, soc] = await Promise.all([getNegociosTareas(), getSociosTareas()])
        return {
          negociosTareas: neg as TareaNegocioOption[],
          sociosTareas: soc as SocioOption[],
        }
      } catch {
        return { negociosTareas: [] as TareaNegocioOption[], sociosTareas: [] as SocioOption[] }
      }
    })(),
    getDocumentosContext(),
  ])

  return { negocio, ...tareasCtx, ...docsCtx }
}

export async function getNegocioContextByCodigo(
  codigo: string
): Promise<(NegocioPageContext & { negocio: NegocioRecord }) | null> {
  const negocio = await getNegocioByCodigo(codigo)
  if (!negocio) return null

  const [tareasCtx, docsCtx] = await Promise.all([
    (async () => {
      try {
        const [neg, soc] = await Promise.all([getNegociosTareas(), getSociosTareas()])
        return {
          negociosTareas: neg as TareaNegocioOption[],
          sociosTareas: soc as SocioOption[],
        }
      } catch {
        return { negociosTareas: [] as TareaNegocioOption[], sociosTareas: [] as SocioOption[] }
      }
    })(),
    getDocumentosContext(),
  ])

  return { negocio, ...tareasCtx, ...docsCtx }
}
