'use client'

import Link from 'next/link'

export function ClientesShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">
            ← STGL
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">Clientes</h1>
          <p className="text-sm text-zinc-600">
            Base de clientes por negocio (HYDREX, HANGARC, VirtualWaiter, HARDTECH)
          </p>
          <nav className="mt-3 flex gap-3 text-sm">
            <Link href="/clientes" className="font-medium text-zinc-900 hover:underline">
              Clientes
            </Link>
            <Link href="/tareas" className="text-zinc-600 hover:text-zinc-900 hover:underline">
              Tareas
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
