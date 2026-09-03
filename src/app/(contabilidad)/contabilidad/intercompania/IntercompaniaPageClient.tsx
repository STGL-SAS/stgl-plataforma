'use client'

import { IntercompaniaTable } from '@/modules/contabilidad/components/IntercompaniaTable'
import { useIntercompania } from '@/modules/contabilidad/hooks/useIntercompania'
import type { Negocio } from '@/modules/contabilidad/types'

export function IntercompaniaPageClient({ negocios }: { negocios: Negocio[] }) {
  const { data, loading, error, refetch } = useIntercompania()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--cmd-text)]">Movimientos intercompañía</h2>
        <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">
          Préstamos y transferencias entre negocios. No genera transacciones espejo automáticas.
        </p>
      </div>

      {loading && <p className="text-sm text-[var(--cmd-text-dim)]">Cargando…</p>}
      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
      {!loading && !error && (
        <IntercompaniaTable movimientos={data} negocios={negocios} onRefresh={refetch} />
      )}
    </div>
  )
}
