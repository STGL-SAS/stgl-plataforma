import { notFound } from 'next/navigation'
import { NegocioShell } from '@/modules/negocios/components/NegocioShell'
import { getNegocioPageContext } from '@/modules/negocios/lib/page-data'
import { isValidNegocioSlug } from '@/modules/negocios/lib/slugs'

export const dynamic = 'force-dynamic'

export default async function NegocioLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isValidNegocioSlug(slug)) notFound()

  const ctx = await getNegocioPageContext(slug)
  if (!ctx) notFound()

  return (
    <NegocioShell negocio={ctx.negocio} slug={slug}>
      {children}
    </NegocioShell>
  )
}
