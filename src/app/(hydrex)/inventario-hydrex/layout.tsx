import { InventarioHydrexShell } from '@/modules/inventario-hydrex/components/InventarioHydrexShell'

export default function InventarioHydrexLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <InventarioHydrexShell>{children}</InventarioHydrexShell>
}
