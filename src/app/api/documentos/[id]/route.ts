import { NextResponse } from 'next/server'
import { assertCanManageOneDrive } from '@/modules/documentos/lib/auth-gate'
import { eliminarDocumentoManual } from '@/modules/documentos/lib/delete-documento'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { userId } = await assertCanManageOneDrive()
    const { id } = await context.params
    const result = await eliminarDocumentoManual(id, userId)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al eliminar documento'
    const status = msg.includes('superadmin')
      ? 403
      : msg.includes('no encontrado')
        ? 404
        : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
