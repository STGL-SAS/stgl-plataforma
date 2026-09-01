import Link from 'next/link'

const links = [
  { href: '/inventario-hydrex/catalogo', label: 'Catálogo' },
  { href: '/inventario-hydrex/componentes-costo', label: 'Componentes' },
  { href: '/inventario-hydrex/calculadora', label: 'Calculadora' },
  { href: '/inventario-hydrex/stock', label: 'Stock' },
  { href: '/inventario-hydrex/proveedores', label: 'Proveedores' },
  { href: '/inventario-hydrex/gastos-fijos', label: 'Gastos fijos' },
  { href: '/inventario-hydrex/clientes', label: 'Clientes' },
]

export function InventarioHydrexNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-zinc-200 pb-4">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
