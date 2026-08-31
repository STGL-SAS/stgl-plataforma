'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BoldClasificarModal } from '@/modules/contabilidad/components/BoldClasificarModal'
import { TransaccionFiltros } from '@/modules/contabilidad/components/TransaccionFiltros'
import { TransaccionesTable } from '@/modules/contabilidad/components/TransaccionesTable'
import { useTransacciones } from '@/modules/contabilidad/hooks/useTransacciones'
import type { Negocio, Transaccion } from '@/modules/contabilidad/types'

interface Props {
  negocios: Negocio[]
  categorias: string[]
}

export function TransaccionesPageClient({ negocios, categorias }: Props) {
  const { data, loading, error, filtros, setFiltros, refetch } = useTransacciones()
  const [clasificarTarget, setClasificarTarget] = useState<Transaccion | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Transacciones</h2>
        <Link
          href="/contabilidad/transacciones/nueva"
          className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Nueva transacción
        </Link>
      </div>

      <TransaccionFiltros
        filtros={filtros}
        negocios={negocios}
        categorias={categorias}
        onChange={setFiltros}
      />

      {loading && <p className="text-sm text-zinc-500">Cargando…</p>}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!loading && !error && (
        <TransaccionesTable
          transacciones={data}
          onClasificar={setClasificarTarget}
        />
      )}

      <BoldClasificarModal
        transaccion={clasificarTarget}
        categoriasSugeridas={categorias}
        onClose={() => setClasificarTarget(null)}
        onSuccess={refetch}
      />
    </div>
  )
}
