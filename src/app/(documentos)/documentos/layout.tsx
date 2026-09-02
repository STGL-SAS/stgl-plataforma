import { DocumentosShell } from '@/modules/documentos/components/DocumentosShell'

export default function DocumentosLayout({ children }: { children: React.ReactNode }) {
  return <DocumentosShell>{children}</DocumentosShell>
}
