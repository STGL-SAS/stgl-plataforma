import { getComprasHydrex, getInsumos, getProveedoresHydrex, getTiposInsumo } from '@/modules/inventario-hydrex/lib/queries'
import { ProveedoresPageClient } from './ProveedoresPageClient'

export const dynamic = 'force-dynamic'

export default async function ProveedoresPage() {
  const [proveedores, insumos, tipos, compras] = await Promise.all([
    getProveedoresHydrex(),
    getInsumos(),
    getTiposInsumo(),
    getComprasHydrex(),
  ])
  return (
    <ProveedoresPageClient
      initialProveedores={proveedores}
      initialInsumos={insumos}
      initialTipos={tipos}
      initialCompras={compras}
    />
  )
}
