'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'

export function ClientesShell({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      title="Clientes"
      subtitle="Base de clientes por negocio (HYDREX, HANGARC, VirtualWaiter, HARDTECH)"
      accent="#94A3B8"
    >
      {children}
    </ModuleShell>
  )
}
