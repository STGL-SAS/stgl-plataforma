import { notFound } from 'next/navigation'
import { TareasNegocio } from '@/modules/negocios/components/TareasNegocio'
import { getNegocioPageContext } from '@/modules/negocios/lib/page-data'
import { isValidNegocioSlug } from '@/modules/negocios/lib/slugs'

export const dynamic = 'force-dynamic'

export default async function NegocioTareasPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isValidNegocioSlug(slug)) notFound()

  const ctx = await getNegocioPageContext(slug)
  if (!ctx) notFound()

  return (
    <TareasNegocio
      negocioId={ctx.negocio.id}
      negocios={ctx.negociosTareas}
      socios={ctx.sociosTareas}
    />
  )
}
