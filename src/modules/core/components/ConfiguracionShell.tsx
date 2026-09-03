'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'

export function ConfiguracionShell({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      title="Configuración"
      subtitle="Parámetros, participación societaria y roles"
      accent="#94A3B8"
    >
      {children}
    </ModuleShell>
  )
}
