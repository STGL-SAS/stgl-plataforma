import { notFound } from 'next/navigation'
import { DocumentosNegocio } from '@/modules/negocios/components/DocumentosNegocio'
import { getNegocioContextByCodigo } from '@/modules/negocios/lib/page-data'

export const dynamic = 'force-dynamic'

export default async function HydrexDocumentosPage() {
  const ctx = await getNegocioContextByCodigo('HYDREX')
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
