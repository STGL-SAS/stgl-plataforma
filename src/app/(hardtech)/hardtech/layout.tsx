import { Suspense } from 'react'
import { HardtechShell } from '@/modules/hardtech/components/HardtechShell'
import { BusinessAlertsBell } from '@/components/ui/BusinessAlertsBell'
import { AlertsBellSkeleton } from '@/components/ui/AlertsBellSkeleton'

export const dynamic = 'force-dynamic'

export default function HardtechLayout({ children }: { children: React.ReactNode }) {
  return (
    <HardtechShell
      headerActions={
        <Suspense fallback={<AlertsBellSkeleton />}>
          <BusinessAlertsBell negocioCodigo="HARDTECH" />
        </Suspense>
      }
    >
      {children}
    </HardtechShell>
  )
}
