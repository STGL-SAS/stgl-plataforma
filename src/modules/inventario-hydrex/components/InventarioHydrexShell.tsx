'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import '../styles.css'
import { InventarioHydrexNav } from './InventarioHydrexNav'

export function InventarioHydrexShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="hydrex-root min-h-full bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">← STGL</Link>
          <h1 className="text-xl font-semibold text-zinc-900">HYDREX — Costeo e inventario</h1>
          <div className="mt-4">
            <InventarioHydrexNav pathname={pathname} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
