import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Auth de usuarios aún no está cableada en la app (Fase 8/10).
 * Si hay sesión Supabase, exige usuario; si no hay sesión (estado actual
 * del producto), permite la operación igual que el resto de módulos
 * internos que usan service role.
 */
export async function assertCanManageOneDrive(): Promise<{ userId: string | null }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const admin = createAdminClient()
      const { data: socio } = await admin
        .from('socios')
        .select('id, rol')
        .eq('user_id', user.id)
        .maybeSingle()
      if (socio && socio.rol !== 'superadmin') {
        throw new Error('Solo superadmin puede conectar o administrar OneDrive.')
      }
      return { userId: user.id }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('superadmin')) throw e
  }
  return { userId: null }
}

/** Mismo criterio que assertCanManageOneDrive, para ocultar acciones en UI. */
export async function canManageOneDriveUi(): Promise<boolean> {
  try {
    await assertCanManageOneDrive()
    return true
  } catch {
    return false
  }
}
