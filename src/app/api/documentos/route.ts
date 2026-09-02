import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const negocio = searchParams.get('negocio')
    const categoria = searchParams.get('categoria')
    const q = searchParams.get('q')
    const parent = searchParams.get('parent')
    const scope = searchParams.get('scope')

    const supabase = createAdminClient()
    let query = supabase
      .from('documentos')
      .select('*, negocios(codigo, nombre)')
      .order('es_carpeta', { ascending: false })
      .order('nombre')

    if (q?.trim()) {
      // Búsqueda por nombre o categoría (no limitada a la carpeta actual)
      const term = q.trim().replace(/[%_,.()]/g, ' ').trim()
      if (term) {
        query = query.or(`nombre.ilike.%${term}%,categoria.ilike.%${term}%`)
      }
    } else if (scope === 'all') {
      // Todos los ítems del negocio (p. ej. picker de adjuntos)
    } else if (!parent || parent === 'root') {
      query = query.is('onedrive_parent_id', null)
    } else {
      query = query.eq('onedrive_parent_id', parent)
    }

    if (categoria?.trim()) {
      query = query.eq('categoria', categoria.trim())
    }

    if (negocio?.trim()) {
      const value = negocio.trim()
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
      if (isUuid) {
        query = query.eq('negocio_id', value)
      } else {
        const { data: neg } = await supabase
          .from('negocios')
          .select('id')
          .eq('codigo', value.toUpperCase())
          .maybeSingle()
        if (!neg) return NextResponse.json({ documentos: [] })
        query = query.eq('negocio_id', neg.id)
      }
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ documentos: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al listar documentos'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
