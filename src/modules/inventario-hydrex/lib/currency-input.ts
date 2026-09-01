const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatCOPInput(
  value: number | null | undefined,
  options?: { emptyWhenZero?: boolean }
): string {
  const emptyWhenZero = options?.emptyWhenZero ?? true
  if (value == null || (emptyWhenZero && value === 0)) return ''
  return copFormatter.format(value)
}

export function parseCOPInput(text: string): number | null {
  const digits = text.replace(/\D/g, '')
  if (!digits) return null
  return Number(digits)
}
