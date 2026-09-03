'use client'

import { cn } from '@/lib/cn'
import { CommandPanel } from '@/components/layout/ModuleShell'
import {
  deleteGastoFijoNegocio,
  deleteGastoOcasional,
  upsertGastoFijoNegocio,
  upsertGastoOcasional,
} from '@/modules/hardtech/actions/mutations'
import { GastosFijosLista } from '@/modules/hardtech/gastos/GastosFijosLista'
import { GastosOcasionalesLista } from '@/modules/hardtech/gastos/GastosOcasionalesLista'
import { useGastosFijos } from '../hooks/useGastosFijos'
import { useGastosOcasionales } from '../hooks/useGastosOcasionales'
import { useState } from 'react'

export function GastosNegocio({ negocioId }: { negocioId: string }) {
  const [tab, setTab] = useState<'fijos' | 'ocasionales'>('fijos')
  const fijos = useGastosFijos(negocioId)
  const ocasionales = useGastosOcasionales(negocioId)

  const loading = tab === 'fijos' ? fijos.loading : ocasionales.loading
  const error = tab === 'fijos' ? fijos.error : ocasionales.error

  return (
    <CommandPanel>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--cmd-text)]">Gastos</h2>
        <p className="mt-0.5 text-xs text-[var(--cmd-text-dim)]">
          Fijos y ocasionales — solo informativos; no afectan el balance automáticamente.
        </p>
      </div>

      <div className="mb-4 flex gap-1 border-b border-[var(--cmd-border)] pb-2">
        {(
          [
            { id: 'fijos' as const, label: 'Fijos' },
            { id: 'ocasionales' as const, label: 'Ocasionales' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-[var(--cmd-panel-hover)] text-[var(--cmd-text)]'
                : 'text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-[var(--cmd-text-muted)]">Cargando…</p>}
      {error && <p className="text-sm text-[var(--cmd-decline)]">{error}</p>}

      {!loading && !error && tab === 'fijos' && (
        <GastosFijosLista
          variant="dark"
          gastos={fijos.gastos}
          socios={[]}
          mostrarPagoPersonal={false}
          onSave={async (input) => {
            await upsertGastoFijoNegocio({ ...input, negocio_id: negocioId })
          }}
          onDelete={deleteGastoFijoNegocio}
          onRefresh={fijos.reload}
        />
      )}

      {!loading && !error && tab === 'ocasionales' && (
        <GastosOcasionalesLista
          variant="dark"
          gastos={ocasionales.gastos}
          socios={[]}
          mostrarPagoPersonal={false}
          onSave={async (input) => {
            await upsertGastoOcasional({ ...input, negocio_id: negocioId })
          }}
          onDelete={deleteGastoOcasional}
          onRefresh={ocasionales.reload}
        />
      )}
    </CommandPanel>
  )
}
