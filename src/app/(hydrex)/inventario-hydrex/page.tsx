import Link from 'next/link'

const sections = [
  { href: '/inventario-hydrex/catalogo', title: 'Catálogo', desc: 'Insumos y productos vendibles' },
  { href: '/inventario-hydrex/calculadora', title: 'Calculadora', desc: 'Simula costo, ganancia y margen por canal' },
  { href: '/inventario-hydrex/stock', title: 'Stock', desc: 'Inventario actual y movimientos' },
  { href: '/inventario-hydrex/proveedores', title: 'Proveedores', desc: 'Compras y actualización de costos' },
]

export default function InventarioHydrexHomePage() {
  return (
    <div className="space-y-6">
      <p className="text-zinc-600">
        Motor de costeo e inventario exclusivo de HYDREX. Aislado del ledger general y de otros negocios.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
            <h2 className="font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
