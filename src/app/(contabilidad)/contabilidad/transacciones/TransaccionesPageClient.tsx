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
        <div>
          <h2 className="text-base font-semibold text-[var(--cmd-text)]">Transacciones</h2>
          <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
            Ledger central de ingresos y egresos clasificados.
          </p>
        </div>
        <Link
          href="/contabilidad/transacciones/nueva"
          className="inline-flex rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)] px-4 py-2 text-sm font-medium text-[var(--cmd-text)] transition-colors hover:border-[var(--cmd-stgl)]"
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

      {loading && <p className="text-sm text-[var(--cmd-text-dim)]">Cargando…</p>}
      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
      {!loading && !error && (
        <TransaccionesTable transacciones={data} onClasificar={setClasificarTarget} />
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
