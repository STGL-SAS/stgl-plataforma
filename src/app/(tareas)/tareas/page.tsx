import { getNegociosTareas, getSociosTareas } from '@/modules/tareas/lib/actions'
import { TareasPageClient } from '@/modules/tareas/components/TareasPageClient'
import type { NegocioOption, SocioOption } from '@/modules/tareas/types'

export const dynamic = 'force-dynamic'

export default async function TareasPage() {
  let negocios: NegocioOption[] = []
  let socios: SocioOption[] = []

  try {
    const [neg, soc] = await Promise.all([getNegociosTareas(), getSociosTareas()])
    negocios = neg as NegocioOption[]
    socios = soc as SocioOption[]
  } catch {
    // Migración aún no aplicada
  }

  return <TareasPageClient negocios={negocios} socios={socios} />
}
