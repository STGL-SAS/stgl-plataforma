import Image from 'next/image'
import { cn } from '@/lib/cn'
import { businessMeta } from '@/styles/command-tokens'

const FALLBACK: Record<string, string> = {
  HYDREX: '/logos/hydrex.jpg',
  HANGARC: '/logos/hangarc.png',
  VIRTUALWAITER: '/logos/virtual.png',
  HARDTECH: '/logos/hardtech.jpg',
}

export function BusinessLogo({
  codigo,
  size = 32,
  className,
}: {
  codigo: string
  size?: number
  className?: string
}) {
  const meta = businessMeta[codigo]
  const src = meta?.logo || FALLBACK[codigo]

  if (!src) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-panel)] text-[10px] font-bold text-[var(--cmd-text-muted)]',
          className
        )}
        style={{ width: size, height: size }}
        title={meta?.nombre ?? codigo}
      >
        ST
      </div>
    )
  }

  const pad = codigo === 'VIRTUALWAITER' ? 'p-1.5' : 'p-0.5'

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-panel)]',
        pad,
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={meta?.nombre ?? codigo} fill className="object-contain" sizes={`${size}px`} />
    </div>
  )
}
