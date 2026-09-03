'use client'

import { CommandPanel } from '@/components/layout/ModuleShell'
import { TareasPageClient } from '@/modules/tareas/components/TareasPageClient'
import type { NegocioOption, SocioOption } from '@/modules/tareas/types'

export function TareasNegocio({
  negocioId,
  negocios,
  socios,
}: {
  negocioId: string
  negocios: NegocioOption[]
  socios: SocioOption[]
}) {
  return (
    <CommandPanel>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--cmd-text)]">Tareas</h2>
        <p className="mt-0.5 text-xs text-[var(--cmd-text-dim)]">
          Pendientes, en curso y en espera. Puedes ver todas desde el toggle.
        </p>
      </div>
      <TareasPageClient
        negocios={negocios}
        socios={socios}
        lockedNegocioId={negocioId}
        defaultSoloAbiertas
      />
    </CommandPanel>
  )
}
