import { createAdminClient } from '@/lib/supabase/admin'
import { deleteDriveItem, GraphRequestError } from '@/lib/msgraph'
import type { EliminacionPreview, TareaAfectadaEliminacion } from './tipos'

export type { EliminacionPreview, TareaAfectadaEliminacion }

type DocRow = {
  id: string
  negocio_id: string
  nombre: string
  es_carpeta: boolean
  onedrive_item_id: string
  onedrive_parent_id: string | null
}

function formatFechaHora(now = new Date()) {
  return now.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

async function resolveSocioNombre(userId: string | null): Promise<string> {
  if (!userId) return 'un usuario'
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('socios')
    .select('nombre')
    .eq('user_id', userId)
    .maybeSingle()
  return (data?.nombre as string | undefined) ?? 'un usuario'
}

/** Recolecta el ítem raíz y todos los descendientes en BD (por onedrive_parent_id). */
export async function collectDocumentoSubtree(documentoId: string): Promise<DocRow[]> {
  const supabase = createAdminClient()
  const { data: root, error: rootError } = await supabase
    .from('documentos')
    .select('id, negocio_id, nombre, es_carpeta, onedrive_item_id, onedrive_parent_id')
    .eq('id', documentoId)
    .maybeSingle()
  if (rootError) throw new Error(rootError.message)
  if (!root) return []

  const { data: all, error: allError } = await supabase
    .from('documentos')
    .select('id, negocio_id, nombre, es_carpeta, onedrive_item_id, onedrive_parent_id')
    .eq('negocio_id', root.negocio_id)
  if (allError) throw new Error(allError.message)

  const rows = (all ?? []) as DocRow[]
  const result: DocRow[] = [root as DocRow]
  const seen = new Set([root.id as string])
  const queue = [root.onedrive_item_id as string]

  while (queue.length > 0) {
    const parentOdId = queue.shift()!
    for (const row of rows) {
      if (seen.has(row.id)) continue
      if (row.onedrive_parent_id === parentOdId) {
        result.push(row)
        seen.add(row.id)
        if (row.es_carpeta) queue.push(row.onedrive_item_id)
      }
    }
  }

  return result
}

export async function getTareasAfectadasPorDocumentos(
  documentoIds: string[]
): Promise<TareaAfectadaEliminacion[]> {
  if (documentoIds.length === 0) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tareas_historial')
    .select('documento_id, tareas(id, titulo, negocios(nombre)), documentos(nombre)')
    .eq('tipo_evento', 'documento_adjunto')
    .in('documento_id', documentoIds)

  if (error) throw new Error(error.message)

  const byTarea = new Map<string, TareaAfectadaEliminacion>()

  for (const row of data ?? []) {
    const tareaJoined = row.tareas as unknown
    const tarea = (Array.isArray(tareaJoined) ? tareaJoined[0] : tareaJoined) as {
      id: string
      titulo: string
      negocios: { nombre: string } | { nombre: string }[] | null
    } | null
    if (!tarea?.id) continue

    const negJoined = tarea.negocios
    const neg = (Array.isArray(negJoined) ? negJoined[0] : negJoined) as { nombre: string } | null

    const docJoined = row.documentos as unknown
    const doc = (Array.isArray(docJoined) ? docJoined[0] : docJoined) as { nombre: string } | null
    const docNombre = doc?.nombre ?? 'Documento'

    const prev = byTarea.get(tarea.id)
    if (prev) {
      if (!prev.documentos_nombres.includes(docNombre)) {
        prev.documentos_nombres.push(docNombre)
      }
    } else {
      byTarea.set(tarea.id, {
        id: tarea.id,
        titulo: tarea.titulo,
        negocio_nombre: neg?.nombre ?? '—',
        documentos_nombres: [docNombre],
      })
    }
  }

  return [...byTarea.values()].sort((a, b) => a.titulo.localeCompare(b.titulo))
}

export async function getEliminacionPreview(documentoId: string): Promise<EliminacionPreview | null> {
  const subtree = await collectDocumentoSubtree(documentoId)
  if (subtree.length === 0) return null

  const root = subtree[0]
  const ids = subtree.map((d) => d.id)
  const tareas = await getTareasAfectadasPorDocumentos(ids)

  return {
    documento_id: root.id,
    nombre: root.nombre,
    es_carpeta: root.es_carpeta,
    total_items: subtree.length,
    total_archivos: subtree.filter((d) => !d.es_carpeta).length,
    total_carpetas: subtree.filter((d) => d.es_carpeta).length,
    tareas,
  }
}

function buildComentarioEliminacion(
  nombres: string[],
  mode: 'manual' | 'sync',
  eliminadoPor: string
): string {
  const fecha = formatFechaHora()
  const lista =
    nombres.length === 1
      ? `'${nombres[0]}'`
      : nombres.map((n) => `'${n}'`).join(', ')

  if (mode === 'sync') {
    const sujeto = nombres.length === 1 ? 'El documento' : 'Los documentos'
    return `${sujeto} ${lista} fue eliminado directamente en OneDrive (detectado por sincronización el ${fecha}).`
  }

  const sujeto = nombres.length === 1 ? 'El documento' : 'Los documentos'
  return `${sujeto} ${lista} fue eliminado el ${fecha} por ${eliminadoPor}.`
}

/** Limpia historial y filas en BD (sin llamar a Graph). */
export async function purgeDocumentosFromDatabase(
  subtree: DocRow[],
  mode: 'manual' | 'sync',
  eliminadoPor = 'Sistema'
): Promise<{ tareas_actualizadas: number }> {
  if (subtree.length === 0) return { tareas_actualizadas: 0 }

  const supabase = createAdminClient()
  const documentoIds = subtree.map((d) => d.id)
  const tareas = await getTareasAfectadasPorDocumentos(documentoIds)

  for (const tarea of tareas) {
    const nombresEnTarea = tarea.documentos_nombres
    const comentario = buildComentarioEliminacion(nombresEnTarea, mode, eliminadoPor)
    const { error: comError } = await supabase.from('tareas_historial').insert({
      tarea_id: tarea.id,
      tipo_evento: 'comentario',
      comentario,
    })
    if (comError) throw new Error(comError.message)
  }

  const { error: histError } = await supabase
    .from('tareas_historial')
    .delete()
    .eq('tipo_evento', 'documento_adjunto')
    .in('documento_id', documentoIds)
  if (histError) throw new Error(histError.message)

  const { error: delError } = await supabase.from('documentos').delete().in('id', documentoIds)
  if (delError) throw new Error(delError.message)

  return { tareas_actualizadas: tareas.length }
}

/** Eliminación manual: Graph primero; si falla (≠404), no toca BD. */
export async function eliminarDocumentoManual(
  documentoId: string,
  userId: string | null
): Promise<{ eliminados: number; tareas_actualizadas: number }> {
  const subtree = await collectDocumentoSubtree(documentoId)
  if (subtree.length === 0) {
    throw new Error('Documento no encontrado')
  }

  const root = subtree[0]
  try {
    await deleteDriveItem(root.onedrive_item_id)
  } catch (e) {
    if (e instanceof GraphRequestError) {
      throw new Error(`No se pudo eliminar en OneDrive (${e.status}). No se modificó la base de datos.`)
    }
    throw e
  }

  const eliminadoPor = await resolveSocioNombre(userId)
  const { tareas_actualizadas } = await purgeDocumentosFromDatabase(subtree, 'manual', eliminadoPor)

  return { eliminados: subtree.length, tareas_actualizadas }
}

export async function findDocumentoByOnedriveId(onedriveItemId: string): Promise<DocRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('documentos')
    .select('id, negocio_id, nombre, es_carpeta, onedrive_item_id, onedrive_parent_id')
    .eq('onedrive_item_id', onedriveItemId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as DocRow | null
}

/** Procesa eliminaciones detectadas por delta (OneDrive ya borró el ítem). */
export async function procesarEliminacionesSync(
  deletedOnedriveIds: string[]
): Promise<{
  documentos_eliminados: number
  tareas_actualizadas: number
  omitidos: number
}> {
  const processedOd = new Set<string>()
  let documentos_eliminados = 0
  let tareas_actualizadas = 0
  let omitidos = 0

  for (const odId of deletedOnedriveIds) {
    if (processedOd.has(odId)) continue

    const doc = await findDocumentoByOnedriveId(odId)
    if (!doc) {
      omitidos += 1
      continue
    }

    const subtree = await collectDocumentoSubtree(doc.id)
    for (const d of subtree) {
      processedOd.add(d.onedrive_item_id)
    }

    const { tareas_actualizadas: tareas } = await purgeDocumentosFromDatabase(subtree, 'sync')
    documentos_eliminados += subtree.length
    tareas_actualizadas += tareas
  }

  return { documentos_eliminados, tareas_actualizadas, omitidos }
}

export type { DocRow as DocumentoSubtreeRow }
