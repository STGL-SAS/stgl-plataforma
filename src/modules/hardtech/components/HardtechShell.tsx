'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'
import { HARDTECH_LINKS } from '@/lib/navigation'

export function HardtechShell({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      title="HARDTECH"
      subtitle="Ventas bajo pedido, mantenimientos y pagos entre socios"
      accent="var(--cmd-hardtech)"
      businessCodigo="HARDTECH"
      links={HARDTECH_LINKS}
    >
      {children}
    </ModuleShell>
  )
}
