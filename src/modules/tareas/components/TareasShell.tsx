'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'

export function TareasShell({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      title="Tareas y casos"
      subtitle="Seguimiento con historial automático por negocio"
      accent="#94A3B8"
    >
      {children}
    </ModuleShell>
  )
}
