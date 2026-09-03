'use client'

import { ModuleShell } from '@/components/layout/ModuleShell'
import { negocioLinks } from '@/lib/navigation'
import type { NegocioRecord } from '../lib/queries'
import { accentForNegocio } from '../lib/slugs'

const SUBTITLES: Record<string, string> = {
  HANGARC: 'Aeromodelismo y experiencias de vuelo',
  VIRTUALWAITER: 'Software para restaurantes',
  STGL: 'Gastos, documentos y tareas de la sociedad',
}

export function NegocioShell({
  negocio,
  slug,
  children,
  headerActions,
}: {
  negocio: NegocioRecord
  slug: string
  children: React.ReactNode
  headerActions?: React.ReactNode
}) {
  const title = negocio.codigo === 'STGL' ? 'STGL / General' : negocio.nombre

  return (
    <ModuleShell
      title={title}
      subtitle={SUBTITLES[negocio.codigo] ?? 'Vista por negocio'}
      accent={accentForNegocio(negocio.codigo)}
      businessCodigo={negocio.codigo}
      links={negocioLinks(slug)}
      headerActions={headerActions}
    >
      {children}
    </ModuleShell>
  )
}
