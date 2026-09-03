import { NextResponse } from 'next/server'
import { assertCanManageOneDrive } from '@/modules/documentos/lib/auth-gate'
import { getEliminacionPreview } from '@/modules/documentos/lib/delete-documento'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, context: RouteContext) {
  try {
    await assertCanManageOneDrive()
    const { id } = await context.params
    const preview = await getEliminacionPreview(id)
    if (!preview) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ preview })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al preparar eliminación'
    const status = msg.includes('superadmin') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
