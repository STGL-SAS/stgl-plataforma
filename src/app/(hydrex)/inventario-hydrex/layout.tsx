import { Suspense } from 'react'
import { InventarioHydrexShell } from '@/modules/inventario-hydrex/components/InventarioHydrexShell'
import { BusinessAlertsBell } from '@/components/ui/BusinessAlertsBell'
import { AlertsBellSkeleton } from '@/components/ui/AlertsBellSkeleton'

export const dynamic = 'force-dynamic'

export default function InventarioHydrexLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InventarioHydrexShell
      headerActions={
        <Suspense fallback={<AlertsBellSkeleton />}>
          <BusinessAlertsBell negocioCodigo="HYDREX" />
        </Suspense>
      }
    >
      {children}
    </InventarioHydrexShell>
  )
}
