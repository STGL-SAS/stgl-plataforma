export const NEGOCIO_SLUGS = ['hangarc', 'virtualwaiter', 'stgl'] as const

export type NegocioSlug = (typeof NEGOCIO_SLUGS)[number]

const SLUG_TO_CODIGO: Record<NegocioSlug, string> = {
  hangarc: 'HANGARC',
  virtualwaiter: 'VIRTUALWAITER',
  stgl: 'STGL',
}

export function slugToCodigo(slug: string): string | null {
  if (slug in SLUG_TO_CODIGO) return SLUG_TO_CODIGO[slug as NegocioSlug]
  return null
}

export function codigoToSlug(codigo: string): NegocioSlug | null {
  const entry = Object.entries(SLUG_TO_CODIGO).find(([, c]) => c === codigo)
  return entry ? (entry[0] as NegocioSlug) : null
}

export function negocioHref(codigo: string): string {
  const slug = codigoToSlug(codigo)
  return slug ? `/negocios/${slug}` : '/'
}

export function isValidNegocioSlug(slug: string): slug is NegocioSlug {
  return slugToCodigo(slug) != null
}

export function accentForNegocio(codigo: string): string {
  switch (codigo) {
    case 'HANGARC':
      return 'var(--cmd-hangarc)'
    case 'VIRTUALWAITER':
      return 'var(--cmd-vw)'
    case 'STGL':
      return 'var(--cmd-stgl)'
    default:
      return 'var(--cmd-text-muted)'
  }
}
