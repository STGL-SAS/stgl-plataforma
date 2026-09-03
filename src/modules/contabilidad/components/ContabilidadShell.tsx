'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'
import { CONTABILIDAD_LINKS } from '@/lib/navigation'

export function ContabilidadShell({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      title="Contabilidad"
      subtitle="Ledger, transacciones y socios STGL"
      accent="#94A3B8"
      links={CONTABILIDAD_LINKS}
    >
      {children}
    </ModuleShell>
  )
}
