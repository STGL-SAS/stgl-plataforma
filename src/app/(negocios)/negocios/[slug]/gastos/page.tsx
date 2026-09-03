import { notFound } from 'next/navigation'
import { GastosNegocio } from '@/modules/negocios/components/GastosNegocio'
import { getNegocioPageContext } from '@/modules/negocios/lib/page-data'
import { isValidNegocioSlug } from '@/modules/negocios/lib/slugs'

export const dynamic = 'force-dynamic'

export default async function NegocioGastosPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isValidNegocioSlug(slug)) notFound()

  const ctx = await getNegocioPageContext(slug)
  if (!ctx) notFound()

  return <GastosNegocio negocioId={ctx.negocio.id} />
}
