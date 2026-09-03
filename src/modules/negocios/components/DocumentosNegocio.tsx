'use client'

import { CommandPanel } from '@/components/layout/ModuleShell'
import { DocumentosExplorer } from '@/modules/documentos/components/DocumentosExplorer'
import type { NegocioOption } from '@/modules/documentos/lib/tipos'

export function DocumentosNegocio({
  negocioId,
  negocioCodigo,
  negocios,
  connected,
  canImport,
  categoriasIniciales,
}: {
  negocioId: string
  negocioCodigo: string
  negocios: NegocioOption[]
  connected: boolean
  canImport: boolean
  categoriasIniciales: string[]
}) {
  const cats =
    negocioCodigo === 'STGL' && !categoriasIniciales.includes('STGL / general')
      ? [...categoriasIniciales, 'STGL / general'].sort()
      : categoriasIniciales

  return (
    <CommandPanel>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--cmd-text)]">Documentos</h2>
        {negocioCodigo === 'STGL' && (
          <p className="mt-0.5 text-xs text-[var(--cmd-text-dim)]">
            Documentos de la sociedad, incluyendo categoría «STGL / general».
          </p>
        )}
      </div>
      <DocumentosExplorer
        negocios={negocios}
        connected={connected}
        canImport={canImport}
        categoriasIniciales={cats}
        lockedNegocioId={negocioId}
        soloCarpetaNegocio
        variant="dark"
        compact
      />
    </CommandPanel>
  )
}
