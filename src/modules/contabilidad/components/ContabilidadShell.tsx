'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ContabilidadNav } from './ContabilidadNav'

export function ContabilidadShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">
                ← STGL
              </Link>
              <h1 className="text-xl font-semibold text-zinc-900">Contabilidad</h1>
            </div>
          </div>
          <div className="mt-4">
            <ContabilidadNav pathname={pathname} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
