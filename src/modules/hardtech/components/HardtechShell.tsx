'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'
import { HARDTECH_LINKS } from '@/lib/navigation'

export function HardtechShell({
  children,
  headerActions,
}: {
  children: React.ReactNode
  headerActions?: React.ReactNode
}) {
  return (
    <ModuleShell
      title="HARDTECH"
      subtitle="Ventas bajo pedido, mantenimientos y pagos entre socios"
      accent="var(--cmd-hardtech)"
      businessCodigo="HARDTECH"
      links={HARDTECH_LINKS}
      headerActions={headerActions}
    >
      {children}
    </ModuleShell>
  )
}
