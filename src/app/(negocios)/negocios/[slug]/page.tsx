import { ResumenNegocio } from '@/modules/negocios/components/ResumenNegocio'
import { getNegocioPageContext } from '@/modules/negocios/lib/page-data'
import { getResumenNegocioData } from '@/modules/negocios/lib/resumen-data'
import { isValidNegocioSlug } from '@/modules/negocios/lib/slugs'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NegocioResumenPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isValidNegocioSlug(slug)) notFound()

  const ctx = await getNegocioPageContext(slug)
  if (!ctx) notFound()

  const resumen = await getResumenNegocioData(ctx.negocio.id)

  return (
    <ResumenNegocio
      negocioId={ctx.negocio.id}
      baseHref={`/negocios/${slug}`}
      data={resumen}
    />
  )
}
