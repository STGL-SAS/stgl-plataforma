import { formatCOP } from '@/modules/contabilidad/utils'

export { formatCOP }

export function formatMesLabel(mesIso: string): string {
  const d = new Date(mesIso + 'T12:00:00')
  return d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
}

export const NEGOCIOS_DASHBOARD = ['HYDREX', 'HANGARC', 'VIRTUALWAITER', 'HARDTECH'] as const
