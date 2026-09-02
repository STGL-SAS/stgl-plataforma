'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/contabilidad', label: 'Contabilidad' },
  { href: '/tareas', label: 'Tareas' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/documentos', label: 'Documentos' },
  { href: '/hardtech/ventas', label: 'HARDTECH' },
  { href: '/inventario-hydrex', label: 'HYDREX' },
  { href: '/configuracion', label: 'Configuración' },
]

export function PlatformShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">STGL Plataforma</p>
          <h1 className="text-xl font-semibold">{title ?? 'Inicio'}</h1>
          {subtitle && <p className="text-sm text-zinc-600">{subtitle}</p>}
          <nav className="mt-4 flex flex-wrap gap-1 border-b border-zinc-100 pb-3">
            {links.map(({ href, label }) => {
              const active =
                href === '/'
                  ? pathname === '/'
                  : pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
