import { notFound } from 'next/navigation'
import { TareasNegocio } from '@/modules/negocios/components/TareasNegocio'
import { getNegocioContextByCodigo } from '@/modules/negocios/lib/page-data'

export const dynamic = 'force-dynamic'

export default async function HydrexTareasPage() {
  const ctx = await getNegocioContextByCodigo('HYDREX')
  if (!ctx) notFound()

  return (
    <TareasNegocio
      negocioId={ctx.negocio.id}
      negocios={ctx.negociosTareas}
      socios={ctx.sociosTareas}
    />
  )
}
