'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import type { NavLink } from '@/lib/navigation-types'
import { isNavActive } from '@/lib/navigation'
import { BusinessLogo } from '@/components/ui/BusinessLogo'

function ScrollableModuleNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname()

  return (
    <nav className="cmd-module-nav cmd-module-nav-scroll -mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="flex w-max min-w-full flex-nowrap gap-1 border-b border-[var(--cmd-border)] sm:w-auto sm:flex-wrap">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            data-active={isNavActive(pathname, link.href, link.exact)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function ModuleShell({
  title,
  subtitle,
  accent,
  businessCodigo,
  links,
  headerActions,
  children,
}: {
  title: string
  subtitle?: string
  accent?: string
  businessCodigo?: string
  links?: NavLink[]
  headerActions?: React.ReactNode
  children: React.ReactNode
}) {
  const moduleAccent = accent ?? 'var(--cmd-hydrex)'

  return (
    <div
      className="mx-auto max-w-6xl px-4 py-4 sm:px-5 sm:py-6"
      style={{ '--module-accent': moduleAccent } as React.CSSProperties}
    >
      <header className="mb-5 border-b border-[var(--cmd-border)] pb-4 sm:mb-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
            {businessCodigo && (
              <BusinessLogo codigo={businessCodigo} size={36} className="rounded-md" />
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-[var(--cmd-text)] sm:text-xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-xs text-[var(--cmd-text-muted)] sm:text-sm">{subtitle}</p>
              )}
            </div>
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
        {links && links.length > 0 && <ScrollableModuleNav links={links} />}
      </header>
      <main className="min-w-0">{children}</main>
    </div>
  )
}

export function ModuleNav({ links }: { links: NavLink[] }) {
  return <ScrollableModuleNav links={links} />
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
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {kicker && <p className="font-label-mono text-[var(--cmd-text-muted)]">{kicker}</p>}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--cmd-text)] sm:text-3xl">
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
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
      className={cn('cmd-panel cmd-panel-glow p-4 sm:p-5', className)}
      style={{ '--glow-color': glowColor } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
