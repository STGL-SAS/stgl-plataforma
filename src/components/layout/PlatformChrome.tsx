'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  ListTodo,
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

const MAIN_NAV: NavItem[] = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/contabilidad', label: 'Contabilidad', icon: Wallet },
  { href: '/tareas', label: 'Tareas', icon: ListTodo },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/documentos', label: 'Documentos', icon: FolderOpen },
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

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isNavActive(pathname, item.href, item.exact)
  const Icon = item.icon
  const accent = item.color ?? 'var(--cmd-text)'

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
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

export function PlatformChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="command-app flex min-h-full">
      <aside
        className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-[var(--cmd-border)] bg-[var(--cmd-bg)] py-4"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          className="mx-3 mb-4 flex items-center gap-2 rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-panel)] px-3 py-2"
          title="STGL Plataforma"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--cmd-panel-hover)] text-xs font-bold text-[var(--cmd-text)]">
            ST
          </span>
          <span className="text-sm font-semibold text-[var(--cmd-text)]">STGL Plataforma</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {MAIN_NAV.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="mt-auto border-t border-[var(--cmd-border)] px-2 pt-3">
          <SidebarLink item={CONFIG_NAV} pathname={pathname} />
        </div>
      </aside>

      <div className="command-main min-w-0 flex-1">{children}</div>
    </div>
  )
}
