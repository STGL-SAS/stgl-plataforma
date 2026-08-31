import Link from 'next/link'

const links = [
  { href: '/contabilidad', label: 'Resumen', exact: true },
  { href: '/contabilidad/transacciones', label: 'Transacciones' },
  { href: '/contabilidad/bold-pendientes', label: 'Bold pendientes' },
  { href: '/contabilidad/socios', label: 'Socios' },
  { href: '/contabilidad/intercompania', label: 'Intercompañía' },
]

export function ContabilidadNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-zinc-200 pb-4">
      {links.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
