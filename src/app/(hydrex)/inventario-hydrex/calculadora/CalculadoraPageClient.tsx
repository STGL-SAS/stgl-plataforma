'use client'

import { CalculadoraVenta } from '@/modules/inventario-hydrex/components/CalculadoraVenta'
import type { ComponenteCosto, HydrexProducto, HydrexProductoInsumo, PrecioRow } from '@/modules/inventario-hydrex/lib/tipos'

export function CalculadoraPageClient({
  productos,
  preciosMap,
  recetaMap,
  stockMap,
  componentes,
  envioTarifas,
}: {
  productos: HydrexProducto[]
  preciosMap: Record<string, PrecioRow[]>
  recetaMap: Record<string, HydrexProductoInsumo[]>
  stockMap: Record<string, number>
  componentes: ComponenteCosto[]
  envioTarifas: { id: string; nombre: string; valor_referencia: number }[]
}) {
  return (
    <CalculadoraVenta
      productos={productos}
      preciosMap={preciosMap}
      recetaMap={recetaMap}
      stockMap={stockMap}
      componentes={componentes}
      envioTarifas={envioTarifas}
    />
  )
}
