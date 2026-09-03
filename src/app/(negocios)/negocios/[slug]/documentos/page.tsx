import { notFound } from 'next/navigation'
import { DocumentosNegocio } from '@/modules/negocios/components/DocumentosNegocio'
import { getNegocioPageContext } from '@/modules/negocios/lib/page-data'
import { isValidNegocioSlug } from '@/modules/negocios/lib/slugs'

export const dynamic = 'force-dynamic'

export default async function NegocioDocumentosPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isValidNegocioSlug(slug)) notFound()

  const ctx = await getNegocioPageContext(slug)
  if (!ctx) notFound()

  return (
    <DocumentosNegocio
      negocioId={ctx.negocio.id}
      negocioCodigo={ctx.negocio.codigo}
      negocios={ctx.negociosDocumentos}
      connected={ctx.documentosConnected}
      canImport={ctx.documentosCanImport}
      categoriasIniciales={ctx.categoriasDocumentos}
    />
  )
}
