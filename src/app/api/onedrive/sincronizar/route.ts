import { NextResponse } from 'next/server'
import { assertCanManageOneDrive } from '@/modules/documentos/lib/auth-gate'
import { sincronizarOneDrive } from '@/modules/documentos/lib/sincronizar-onedrive'

export async function POST() {
  try {
    const { userId } = await assertCanManageOneDrive()
    const result = await sincronizarOneDrive(userId)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al sincronizar con OneDrive'
    const status = msg.includes('superadmin') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
