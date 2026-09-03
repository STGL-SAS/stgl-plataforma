'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'

export function DocumentosShell({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      title="Documentos"
      subtitle="Archivero conectado a OneDrive de STGL"
      accent="#94A3B8"
    >
      {children}
    </ModuleShell>
  )
}
