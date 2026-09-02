'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { TareaEstado, TareaTipo } from '../types'

export async function getNegociosTareas() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('negocios')
    .select('id, codigo, nombre')
    .order('codigo')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSociosTareas() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('socios').select('id, nombre').order('nombre')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getTareas(negocioId?: string | null) {
  const supabase = createAdminClient()
  let query = supabase
    .from('tareas')
    .select('*, negocios(codigo, nombre), socios:responsable_id(id, nombre)')
    .order('created_at', { ascending: false })

  if (negocioId?.trim()) {
    query = query.eq('negocio_id', negocioId.trim())
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getTareaById(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tareas')
    .select('*, negocios(codigo, nombre), socios:responsable_id(id, nombre)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getTareaHistorial(tareaId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tareas_historial')
    .select('*, documentos(id, nombre, onedrive_web_url)')
    .eq('tarea_id', tareaId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getDocumentosParaAdjuntar(negocioId?: string | null) {
  const supabase = createAdminClient()
  let query = supabase
    .from('documentos')
    .select('id, nombre, categoria, es_carpeta, negocio_id, onedrive_web_url')
    .eq('es_carpeta', false)
    .order('nombre')
    .limit(200)

  if (negocioId?.trim()) {
    query = query.eq('negocio_id', negocioId.trim())
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export type UpsertTareaInput = {
  id?: string
  negocio_id: string
  titulo: string
  descripcion?: string | null
  tipo: TareaTipo
  responsable_id?: string | null
  estado?: TareaEstado
  fecha_limite?: string | null
}

export async function upsertTarea(input: UpsertTareaInput) {
  const supabase = createAdminClient()
  const row = {
    negocio_id: input.negocio_id,
    titulo: input.titulo.trim(),
    descripcion: input.descripcion?.trim() || null,
    tipo: input.tipo,
    responsable_id: input.responsable_id || null,
    estado: input.estado ?? 'pendiente',
    fecha_limite: input.fecha_limite || null,
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('tareas')
      .update(row)
      .eq('id', input.id)
      .select('*, negocios(codigo, nombre), socios:responsable_id(id, nombre)')
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await supabase
    .from('tareas')
    .insert(row)
    .select('*, negocios(codigo, nombre), socios:responsable_id(id, nombre)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateTareaCampos(
  id: string,
  patch: Partial<{
    titulo: string
    descripcion: string | null
    tipo: TareaTipo
    responsable_id: string | null
    estado: TareaEstado
    fecha_limite: string | null
    negocio_id: string
  }>
) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tareas')
    .update(patch)
    .eq('id', id)
    .select('*, negocios(codigo, nombre), socios:responsable_id(id, nombre)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function addComentarioTarea(tareaId: string, comentario: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tareas_historial')
    .insert({
      tarea_id: tareaId,
      tipo_evento: 'comentario',
      comentario: comentario.trim(),
    })
    .select('*, documentos(id, nombre, onedrive_web_url)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function adjuntarDocumentoTarea(tareaId: string, documentoId: string) {
  const supabase = createAdminClient()

  const { data: existente } = await supabase
    .from('tareas_historial')
    .select('id')
    .eq('tarea_id', tareaId)
    .eq('tipo_evento', 'documento_adjunto')
    .eq('documento_id', documentoId)
    .maybeSingle()
  if (existente) {
    throw new Error('Este documento ya está adjunto a la tarea')
  }

  const { data: doc, error: docError } = await supabase
    .from('documentos')
    .select('id, nombre')
    .eq('id', documentoId)
    .maybeSingle()
  if (docError) throw new Error(docError.message)
  if (!doc) throw new Error('Documento no encontrado')

  const { data, error } = await supabase
    .from('tareas_historial')
    .insert({
      tarea_id: tareaId,
      tipo_evento: 'documento_adjunto',
      documento_id: documentoId,
      valor_nuevo: doc.nombre,
    })
    .select('*, documentos(id, nombre, onedrive_web_url)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

/** Adjunta varios documentos; no revierte los que sí entraron si alguno falla. */
export async function adjuntarDocumentosTarea(tareaId: string, documentoIds: string[]) {
  const unique = [...new Set(documentoIds.filter(Boolean))]
  const attached: Awaited<ReturnType<typeof adjuntarDocumentoTarea>>[] = []
  const failed: string[] = []

  for (const documentoId of unique) {
    try {
      attached.push(await adjuntarDocumentoTarea(tareaId, documentoId))
    } catch {
      failed.push(documentoId)
    }
  }

  return { attached, failed }
}

export async function deleteTarea(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('tareas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
