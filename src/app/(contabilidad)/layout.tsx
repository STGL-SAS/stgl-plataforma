import { ContabilidadShell } from '@/modules/contabilidad/components/ContabilidadShell'

export default function ContabilidadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ContabilidadShell>{children}</ContabilidadShell>
}
