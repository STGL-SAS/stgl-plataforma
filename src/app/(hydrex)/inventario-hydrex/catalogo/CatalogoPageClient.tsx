'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CatalogoInsumos } from '@/modules/inventario-hydrex/components/CatalogoInsumos'
import { CatalogoProductos } from '@/modules/inventario-hydrex/components/CatalogoProductos'
import { CatalogoTiposInsumo } from '@/modules/inventario-hydrex/components/CatalogoTiposInsumo'
import type { HydrexInsumo, HydrexProducto, HydrexProductoRecetaLinea, HydrexTipoInsumo, PrecioRow } from '@/modules/inventario-hydrex/lib/tipos'
import {
  getInsumos,
  getPreciosProducto,
  getProductosConCosto,
  getProductosFull,
  getProductoReceta,
  getStockProductos,
  getTiposInsumo,
} from '@/modules/inventario-hydrex/lib/queries'
import { stockProductosToMap } from '@/modules/inventario-hydrex/lib/stock-producto'

interface Props {
  initialTipos: HydrexTipoInsumo[]
  initialInsumos: HydrexInsumo[]
  initialProductos: HydrexProducto[]
  initialProductosCosto: HydrexProducto[]
  initialPreciosMap: Record<string, PrecioRow[]>
  initialRecetaMap: Record<string, HydrexProductoRecetaLinea[]>
  initialStockMap: Record<string, number>
}

export function CatalogoPageClient({
  initialTipos,
  initialInsumos,
  initialProductos,
  initialProductosCosto,
  initialPreciosMap,
  initialRecetaMap,
  initialStockMap,
}: Props) {
  const router = useRouter()
  const [tipos, setTipos] = useState(initialTipos)
  const [insumos, setInsumos] = useState(initialInsumos)
  const [productos, setProductos] = useState(initialProductos)
  const [productosCosto, setProductosCosto] = useState(initialProductosCosto)
  const [preciosMap, setPreciosMap] = useState(initialPreciosMap)
  const [recetaMap, setRecetaMap] = useState(initialRecetaMap)
  const [stockMap, setStockMap] = useState(initialStockMap)

  async function refresh() {
    const [t, i, p, pc, rm, sp] = await Promise.all([
      getTiposInsumo(),
      getInsumos(),
      getProductosFull(),
      getProductosConCosto(),
      getProductoReceta(),
      getStockProductos(),
    ])
    setTipos(t)
    setInsumos(i)
    setProductos(p)
    setProductosCosto(pc)
    setRecetaMap(rm)
    setStockMap(stockProductosToMap(sp))
    const map: Record<string, PrecioRow[]> = {}
    for (const prod of p) {
      map[prod.id] = await getPreciosProducto(prod.id)
    }
    setPreciosMap(map)
    router.refresh()
  }

  return (
    <div className="space-y-10">
      <section>
        <CatalogoTiposInsumo tipos={tipos} onRefresh={refresh} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Insumos</h2>
        <CatalogoInsumos insumos={insumos} tipos={tipos} onRefresh={refresh} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Productos</h2>
        <CatalogoProductos
          productos={productos}
          productosCosto={productosCosto}
          insumos={insumos}
          recetaMap={recetaMap}
          stockMap={stockMap}
          preciosMap={preciosMap}
          onRefresh={refresh}
        />
      </section>
    </div>
  )
}
