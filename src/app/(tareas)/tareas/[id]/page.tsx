import { notFound } from 'next/navigation'
import { TareaDetail } from '@/modules/tareas/components/TareaDetail'
import {
  getNegociosTareas,
  getSociosTareas,
  getTareaById,
} from '@/modules/tareas/lib/actions'
import type { NegocioOption, SocioOption, TareaRow } from '@/modules/tareas/types'

export const dynamic = 'force-dynamic'

export default async function TareaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let tarea: TareaRow | null = null
  let negocios: NegocioOption[] = []
  let socios: SocioOption[] = []

  try {
    const [row, neg, soc] = await Promise.all([
      getTareaById(id),
      getNegociosTareas(),
      getSociosTareas(),
    ])
    tarea = row as TareaRow | null
    negocios = neg as NegocioOption[]
    socios = soc as SocioOption[]
  } catch {
    notFound()
  }

  if (!tarea) notFound()

  return <TareaDetail initial={tarea} negocios={negocios} socios={socios} />
}
