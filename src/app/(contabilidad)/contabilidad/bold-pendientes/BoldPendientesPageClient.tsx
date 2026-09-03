'use client'

import { useState } from 'react'
import { BoldClasificarModal } from '@/modules/contabilidad/components/BoldClasificarModal'
import { BoldPendientesList } from '@/modules/contabilidad/components/BoldPendientesList'
import { useBoldPendientes } from '@/modules/contabilidad/hooks/useBoldPendientes'
import type { Transaccion } from '@/modules/contabilidad/types'

interface Props {
  categorias: string[]
}

export function BoldPendientesPageClient({ categorias }: Props) {
  const { data, loading, error, refetch } = useBoldPendientes()
  const [target, setTarget] = useState<Transaccion | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--cmd-text)]">
          Bold pendientes de clasificar
        </h2>
        <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
          Transacciones recibidas por webhook. Deben clasificarse manualmente antes de contar en
          reportes.
        </p>
      </div>

      {loading && <p className="text-sm text-[var(--cmd-text-dim)]">Cargando…</p>}
      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
      {!loading && !error && (
        <BoldPendientesList transacciones={data} onClasificar={setTarget} />
      )}

      <BoldClasificarModal
        transaccion={target}
        categoriasSugeridas={categorias}
        onClose={() => setTarget(null)}
        onSuccess={refetch}
      />
    </div>
  )
}
