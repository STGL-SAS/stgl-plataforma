import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadSmallFile } from '@/lib/msgraph'
import { assertCanManageOneDrive } from '@/modules/documentos/lib/auth-gate'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await assertCanManageOneDrive()
    const form = await req.formData()
    const file = form.get('archivo')
    const negocio_id = String(form.get('negocio_id') ?? '')
    const categoria = String(form.get('categoria') ?? '').trim()
    const tipo_documento = String(form.get('tipo_documento') ?? '').trim() || null
    const parentRaw = form.get('parent_onedrive_id')
    const parent_onedrive_id =
      parentRaw != null && String(parentRaw).trim() !== ''
        ? String(parentRaw).trim()
        : null

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    }
    if (!negocio_id || !categoria) {
      return NextResponse.json(
        { error: 'negocio_id y categoria son obligatorios' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parentId = parent_onedrive_id ?? 'root'
    const item = await uploadSmallFile(parentId, file.name, buffer)

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('documentos')
      .insert({
        negocio_id,
        nombre: item.name,
        categoria,
        tipo_documento,
        es_carpeta: false,
        onedrive_item_id: item.id,
        onedrive_parent_id: parent_onedrive_id,
        onedrive_path: item.parentReference?.path ?? null,
        onedrive_web_url: item.webUrl ?? null,
        metadata: {
          mime_type: item.file?.mimeType ?? file.type ?? null,
          size_bytes: item.size ?? buffer.byteLength,
        },
        creado_por: userId,
      })
      .select('*, negocios(codigo, nombre)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ documento: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al subir archivo'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
