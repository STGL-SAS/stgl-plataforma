import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createFolder } from '@/lib/msgraph'
import { assertCanManageOneDrive } from '@/modules/documentos/lib/auth-gate'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await assertCanManageOneDrive()
    const body = (await req.json()) as {
      negocio_id?: string
      categoria?: string
      nombre?: string
      parent_onedrive_id?: string | null
    }

    if (!body.negocio_id || !body.categoria?.trim() || !body.nombre?.trim()) {
      return NextResponse.json(
        { error: 'negocio_id, categoria y nombre son obligatorios' },
        { status: 400 }
      )
    }

    const parentId = body.parent_onedrive_id?.trim() || 'root'
    const item = await createFolder(parentId, body.nombre.trim())

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('documentos')
      .insert({
        negocio_id: body.negocio_id,
        nombre: item.name,
        categoria: body.categoria.trim(),
        tipo_documento: 'carpeta',
        es_carpeta: true,
        onedrive_item_id: item.id,
        onedrive_parent_id: parentId === 'root' ? null : parentId,
        onedrive_path: item.parentReference?.path ?? null,
        onedrive_web_url: item.webUrl ?? null,
        creado_por: userId,
      })
      .select('*, negocios(codigo, nombre)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ documento: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al crear carpeta'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
