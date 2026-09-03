'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import type { NavLink } from '@/lib/navigation-types'
import { isNavActive } from '@/lib/navigation'
import { BusinessLogo } from '@/components/ui/BusinessLogo'

export function ModuleShell({
  title,
  subtitle,
  accent,
  businessCodigo,
  links,
  children,
}: {
  title: string
  subtitle?: string
  accent?: string
  businessCodigo?: string
  links?: NavLink[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const moduleAccent = accent ?? 'var(--cmd-hydrex)'

  return (
    <div
      className="mx-auto max-w-6xl px-5 py-6"
      style={{ '--module-accent': moduleAccent } as React.CSSProperties}
    >
      <header className="mb-6 border-b border-[var(--cmd-border)] pb-4">
        <div className="flex items-start gap-3">
          {businessCodigo && <BusinessLogo codigo={businessCodigo} size={40} />}
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--cmd-text)]">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-[var(--cmd-text-muted)]">{subtitle}</p>}
          </div>
        </div>
        {links && links.length > 0 && (
          <nav className="cmd-module-nav mt-4 flex flex-wrap gap-1 border-b border-[var(--cmd-border)] pb-0">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-active={isNavActive(pathname, link.href, link.exact)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  )
}

export function ModuleNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname()
  return (
    <nav className="cmd-module-nav flex flex-wrap gap-1 border-b border-[var(--cmd-border)] pb-0">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          data-active={isNavActive(pathname, link.href, link.exact)}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

export function PageHeader({
  kicker,
  title,
  actions,
}: {
  kicker?: string
  title: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <p className="font-label-mono text-[var(--cmd-text-muted)]">{kicker}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--cmd-text)]">
          {title}
        </h1>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function CommandPanel({
  className,
  glowColor,
  children,
}: {
  className?: string
  glowColor?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn('cmd-panel cmd-panel-glow p-5', className)}
      style={{ '--glow-color': glowColor } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
