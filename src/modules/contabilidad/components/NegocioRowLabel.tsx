import { BusinessLogo } from '@/components/ui/BusinessLogo'
import { commandColors } from '@/styles/command-tokens'

export function NegocioRowLabel({
  codigo,
  nombre,
}: {
  codigo: string
  nombre: string
}) {
  const color = commandColors.businesses[codigo] ?? commandColors.businesses.STGL

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {codigo !== 'STGL' && (
        <BusinessLogo codigo={codigo} size={20} className="rounded-sm" />
      )}
      <span className="text-[var(--cmd-text)]">{nombre}</span>
    </span>
  )
}
