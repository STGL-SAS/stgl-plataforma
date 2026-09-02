import { createAdminClient } from '@/lib/supabase/admin'
import { isMsGraphConnected } from '@/lib/msgraph'
import { DocumentosExplorer } from '@/modules/documentos/components/DocumentosExplorer'
import { canManageOneDriveUi } from '@/modules/documentos/lib/auth-gate'
import type { NegocioOption } from '@/modules/documentos/lib/tipos'

export const dynamic = 'force-dynamic'

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; conectado?: string }>
}) {
  const sp = await searchParams

  let connected = false
  try {
    connected = await isMsGraphConnected()
  } catch {
    connected = false
  }

  const canImport = await canManageOneDriveUi()

  let negocios: NegocioOption[] = []
  let categorias: string[] = ['general']

  try {
    const supabase = createAdminClient()
    const [{ data: neg }, { data: catRows }] = await Promise.all([
      supabase
        .from('negocios')
        .select('id, codigo, nombre, onedrive_root_folder_id')
        .order('codigo'),
      supabase.from('documentos').select('categoria').limit(200),
    ])
    negocios = (neg ?? []).map((n) => ({
      id: n.id as string,
      codigo: n.codigo as string,
      nombre: n.nombre as string,
      onedrive_root_folder_id: (n.onedrive_root_folder_id as string | null) ?? null,
    }))
    const cats = [
      ...new Set((catRows ?? []).map((r) => r.categoria as string).filter(Boolean)),
    ].sort()
    if (cats.length > 0) categorias = cats
  } catch {
    // Tablas aún no migradas
  }

  return (
    <DocumentosExplorer
      negocios={negocios}
      connected={connected}
      canImport={canImport}
      categoriasIniciales={categorias}
      initialError={sp.error ? decodeURIComponent(sp.error) : null}
      justConnected={sp.conectado === '1'}
    />
  )
}
