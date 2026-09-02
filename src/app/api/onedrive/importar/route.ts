import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listChildren, type GraphDriveItem } from '@/lib/msgraph'
import { assertCanManageOneDrive } from '@/modules/documentos/lib/auth-gate'

function fechaFromGraph(item: GraphDriveItem): string {
  const raw = item.createdDateTime || item.lastModifiedDateTime
  if (!raw) return new Date().toISOString().slice(0, 10)
  return raw.slice(0, 10)
}

async function importSubtree(
  folderId: string,
  negocioId: string,
  userId: string | null,
  existingIds: Set<string>,
  counters: { documentos: number; carpetas: number }
) {
  const children = await listChildren(folderId)
  const supabase = createAdminClient()

  for (const item of children) {
    const esCarpeta = Boolean(item.folder)
    if (!existingIds.has(item.id)) {
      const { error } = await supabase.from('documentos').insert({
        negocio_id: negocioId,
        nombre: item.name,
        categoria: 'Sin categorizar',
        tipo_documento: null,
        es_carpeta: esCarpeta,
        onedrive_item_id: item.id,
        onedrive_parent_id: item.parentReference?.id ?? folderId,
        onedrive_path: item.parentReference?.path ?? null,
        onedrive_web_url: item.webUrl ?? null,
        fecha: fechaFromGraph(item),
        creado_por: userId,
        metadata: {
          mime_type: item.file?.mimeType ?? null,
          size_bytes: item.size ?? null,
        },
      })
      if (error) {
        // Carrera / unique: tratar como ya existente
        if (!error.message.includes('duplicate') && !error.code?.includes('23505')) {
          throw new Error(error.message)
        }
      } else {
        existingIds.add(item.id)
        if (esCarpeta) counters.carpetas += 1
        else counters.documentos += 1
      }
    }

    if (esCarpeta) {
      await importSubtree(item.id, negocioId, userId, existingIds, counters)
    }
  }
}

export async function POST() {
  try {
    const { userId } = await assertCanManageOneDrive()
    const supabase = createAdminClient()

    const { data: negocios, error: negError } = await supabase
      .from('negocios')
      .select('id, codigo, nombre, onedrive_root_folder_id')
    if (negError) throw new Error(negError.message)

    const porCodigo = new Map(
      (negocios ?? []).map((n) => [String(n.codigo).toUpperCase(), n])
    )

    const rootChildren = await listChildren()
    let negocios_mapeados = 0
    const counters = { documentos: 0, carpetas: 0 }
    const mappedRoots = new Map<string, string>()

    const { data: existentes } = await supabase.from('documentos').select('onedrive_item_id')
    const existingIds = new Set((existentes ?? []).map((r) => r.onedrive_item_id as string))

    for (const item of rootChildren) {
      if (!item.folder) continue
      const negocio = porCodigo.get(item.name.toUpperCase())
      if (!negocio) continue

      const { error: mapError } = await supabase
        .from('negocios')
        .update({ onedrive_root_folder_id: item.id })
        .eq('id', negocio.id)
      if (mapError) throw new Error(mapError.message)
      negocios_mapeados += 1
      mappedRoots.set(negocio.id as string, item.id)

      // Carpeta raíz del negocio: parent null en BD para que aparezca en "Inicio" (Todos)
      if (!existingIds.has(item.id)) {
        const { error: rootInsError } = await supabase.from('documentos').insert({
          negocio_id: negocio.id,
          nombre: item.name,
          categoria: 'Sin categorizar',
          tipo_documento: null,
          es_carpeta: true,
          onedrive_item_id: item.id,
          onedrive_parent_id: null,
          onedrive_path: item.parentReference?.path ?? null,
          onedrive_web_url: item.webUrl ?? null,
          fecha: fechaFromGraph(item),
          creado_por: userId,
        })
        if (!rootInsError) {
          existingIds.add(item.id)
          counters.carpetas += 1
        }
      }

      await importSubtree(item.id, negocio.id as string, userId, existingIds, counters)
    }

    return NextResponse.json({
      negocios_mapeados,
      documentos_importados: counters.documentos,
      carpetas_importadas: counters.carpetas,
      roots: [...mappedRoots.entries()].map(([id, onedrive_root_folder_id]) => ({
        id,
        onedrive_root_folder_id,
      })),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al importar desde OneDrive'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
