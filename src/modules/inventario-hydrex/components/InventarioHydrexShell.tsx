'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'
import { HYDREX_LINKS } from '@/lib/navigation'

export function InventarioHydrexShell({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      title="HYDREX"
      subtitle="Impermeables — costeo, inventario y ventas"
      accent="var(--cmd-hydrex)"
      businessCodigo="HYDREX"
      links={HYDREX_LINKS}
    >
      {children}
    </ModuleShell>
  )
}
