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
        <h2 className="text-lg font-semibold">Bold pendientes de clasificar</h2>
        <p className="text-sm text-zinc-600">
          Transacciones recibidas por webhook. Deben clasificarse manualmente antes de contar en reportes.
        </p>
      </div>

      {loading && <p className="text-sm text-zinc-500">Cargando…</p>}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
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
