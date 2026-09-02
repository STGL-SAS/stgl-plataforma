import { ClientesShell } from '@/modules/clientes/components/ClientesShell'

export default function ClientesLayout({ children }: { children: React.ReactNode }) {
  return <ClientesShell>{children}</ClientesShell>
}
