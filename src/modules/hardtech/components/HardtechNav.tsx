'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/hardtech/ventas', label: 'Ventas' },
  { href: '/hardtech/mantenimientos', label: 'Mantenimientos' },
  { href: '/hardtech/gastos', label: 'Gastos' },
  { href: '/hardtech/pagos-socios', label: 'Pagos entre socios' },
  { href: '/hardtech/divisas', label: 'Cuenta USD' },
  { href: '/hardtech/clientes', label: 'Clientes' },
]

export function HardtechNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-wrap gap-1 border-b border-zinc-200 pb-4">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
