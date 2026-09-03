'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Building2,
  FolderOpen,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  Wallet,
  ListTodo,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { commandColors } from '@/styles/command-tokens'
import { isNavActive } from '@/lib/navigation'
import { BusinessLogo } from '@/components/ui/BusinessLogo'

type NavItem = {
  href: string
  label: string
  icon?: LucideIcon
  logoCodigo?: string
  color?: string
  exact?: boolean
}

const PLATFORM_NAV: NavItem[] = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/contabilidad', label: 'Contabilidad', icon: Wallet },
  { href: '/tareas', label: 'Tareas', icon: ListTodo },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/documentos', label: 'Documentos', icon: FolderOpen },
]

const BUSINESS_NAV: NavItem[] = [
  { href: '/hardtech/resumen', label: 'HARDTECH', logoCodigo: 'HARDTECH', color: commandColors.businesses.HARDTECH },
  { href: '/inventario-hydrex', label: 'HYDREX', logoCodigo: 'HYDREX', color: commandColors.businesses.HYDREX },
  { href: '/negocios/hangarc', label: 'HANGARC', logoCodigo: 'HANGARC', color: commandColors.businesses.HANGARC },
  {
    href: '/negocios/virtualwaiter',
    label: 'VirtualWaiter',
    logoCodigo: 'VIRTUALWAITER',
    color: commandColors.businesses.VIRTUALWAITER,
  },
  { href: '/negocios/stgl', label: 'STGL / General', icon: Building2, color: 'var(--cmd-stgl)' },
]

const CONFIG_NAV: NavItem = {
  href: '/configuracion',
  label: 'Configuración',
  icon: Settings,
}

function SidebarLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
}) {
  const active = isNavActive(pathname, item.href, item.exact)
  const Icon = item.icon
  const accent = item.color ?? 'var(--cmd-text)'

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--cmd-panel-hover)] text-[var(--cmd-text)]'
          : 'text-[var(--cmd-text-muted)] hover:bg-[var(--cmd-panel-hover)] hover:text-[var(--cmd-text)]'
      )}
      style={
        active && item.color
          ? ({ boxShadow: `inset 3px 0 0 0 ${accent}` } as React.CSSProperties)
          : active
            ? ({ boxShadow: 'inset 3px 0 0 0 var(--cmd-text-muted)' } as React.CSSProperties)
            : undefined
      }
    >
      {item.logoCodigo ? (
        <BusinessLogo codigo={item.logoCodigo} size={22} className="rounded-md" />
      ) : Icon ? (
        <Icon className="h-[18px] w-[18px] shrink-0" />
      ) : null}
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        className="mx-3 mb-4 flex items-center gap-2 rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-panel)] px-3 py-2"
        title="STGL Plataforma"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--cmd-panel-hover)] text-[var(--cmd-text)]">
          <Building2 className="h-4 w-4" aria-hidden />
        </span>
        <span className="text-sm font-semibold text-[var(--cmd-text)]">STGL Plataforma</span>
      </Link>

      <nav className="flex flex-1 flex-col overflow-y-auto px-2">
        <div className="flex flex-col gap-0.5">
          {PLATFORM_NAV.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-0.5 border-t border-[var(--cmd-border)] pt-4">
          {BUSINESS_NAV.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="mt-auto shrink-0 border-t border-[var(--cmd-border)] px-2 pt-3">
        <SidebarLink item={CONFIG_NAV} pathname={pathname} onNavigate={onNavigate} />
      </div>
    </>
  )
}

function useIsLgUp() {
  const [isLgUp, setIsLgUp] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsLgUp(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isLgUp
}

export function PlatformChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isLgUp = useIsLgUp()

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileNavOpen || isLgUp) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen, isLgUp])

  const closeMobileNav = () => setMobileNavOpen(false)
  const sidebarOffScreen = !isLgUp && !mobileNavOpen

  return (
    <div className="command-app flex min-h-full flex-col lg:flex-row">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--cmd-border)] bg-[var(--cmd-bg)]/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menú de navegación"
          aria-expanded={mobileNavOpen}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-panel)] text-[var(--cmd-text-muted)] hover:bg-[var(--cmd-panel-hover)] hover:text-[var(--cmd-text)]"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        <Link href="/" className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--cmd-text)]">
          STGL Plataforma
        </Link>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Cerrar menú"
          onClick={closeMobileNav}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col border-r border-[var(--cmd-border)] bg-[var(--cmd-bg)] py-4 transition-transform duration-200 ease-out lg:static lg:z-auto lg:h-screen lg:w-[220px] lg:shrink-0 lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navegación principal"
        aria-hidden={sidebarOffScreen || undefined}
      >
        <div className="flex items-center justify-end px-3 pb-2 lg:hidden">
          <button
            type="button"
            onClick={closeMobileNav}
            aria-label="Cerrar menú"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-panel)] text-[var(--cmd-text-muted)] hover:bg-[var(--cmd-panel-hover)] hover:text-[var(--cmd-text)]"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        <SidebarNav pathname={pathname} onNavigate={closeMobileNav} />
      </aside>

      <div className="command-main min-h-0 min-w-0 flex-1">{children}</div>
    </div>
  )
}
