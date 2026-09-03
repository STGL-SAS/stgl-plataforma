'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'
import { HYDREX_LINKS } from '@/lib/navigation'

export function InventarioHydrexShell({
  children,
  headerActions,
}: {
  children: React.ReactNode
  headerActions?: React.ReactNode
}) {
  return (
    <ModuleShell
      title="HYDREX"
      subtitle="Impermeables — costeo, inventario y ventas"
      accent="var(--cmd-hydrex)"
      businessCodigo="HYDREX"
      links={HYDREX_LINKS}
      headerActions={headerActions}
    >
      {children}
    </ModuleShell>
  )
}
