import { NextRequest, NextResponse } from 'next/server'
import { sincronizarOneDrive } from '@/modules/documentos/lib/sincronizar-onedrive'

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await sincronizarOneDrive(null)
    console.info('[cron/sincronizar-onedrive] OK', {
      documentos_importados: result.documentos_importados,
      carpetas_importadas: result.carpetas_importadas,
      negocios_mapeados: result.negocios_mapeados,
      documentos_eliminados: result.documentos_eliminados,
      tareas_actualizadas: result.tareas_actualizadas,
      omitidos: result.omitidos,
      eliminaciones_detectadas: result.eliminaciones_detectadas,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al sincronizar con OneDrive'
    console.error('[cron/sincronizar-onedrive] Error', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
