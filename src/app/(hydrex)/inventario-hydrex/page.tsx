import { ResumenNegocio } from '@/modules/negocios/components/ResumenNegocio'
import { getNegocioByCodigo } from '@/modules/negocios/lib/page-data'
import { getResumenNegocioData } from '@/modules/negocios/lib/resumen-data'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InventarioHydrexResumenPage() {
  const negocio = await getNegocioByCodigo('HYDREX')
  if (!negocio) notFound()

  const resumen = await getResumenNegocioData(negocio.id)

  return (
    <ResumenNegocio
      negocioId={negocio.id}
      baseHref="/inventario-hydrex"
      data={resumen}
      showTareas
      sectionLinks={{
        gastos: '/inventario-hydrex/gastos-fijos',
        tareas: '/inventario-hydrex/tareas',
        documentos: '/inventario-hydrex/documentos',
      }}
    />
  )
}
