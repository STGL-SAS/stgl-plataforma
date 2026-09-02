'use client'

import Link from 'next/link'

export function DocumentosShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">
            ← STGL
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">Documentos</h1>
          <p className="text-sm text-zinc-600">Archivero conectado a OneDrive de STGL</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
