'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getNegocioOnedriveRoot(negocioId: string): Promise<string | null> {
  if (!negocioId.trim()) return null
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('negocios')
    .select('onedrive_root_folder_id')
    .eq('id', negocioId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.onedrive_root_folder_id as string | null) ?? null
}
