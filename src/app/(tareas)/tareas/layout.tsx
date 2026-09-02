import { TareasShell } from '@/modules/tareas/components/TareasShell'

export default function TareasLayout({ children }: { children: React.ReactNode }) {
  return <TareasShell>{children}</TareasShell>
}
