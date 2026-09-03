'use client'

import Link from 'next/link'
import type { AlertaDashboard } from '@/modules/core/lib/dashboard'

const ALERTA_META: Record<
  AlertaDashboard['tipo'],
  { titulo: (n: number) => string; href: string; tone: 'alert' | 'warn' }
> = {
  bold_pendiente: {
    titulo: (n) =>
      n === 1 ? '1 transacción Bold por clasificar' : `${n} transacciones Bold por clasificar`,
    href: '/contabilidad/bold-pendientes',
    tone: 'alert',
  },
  documento_sin_categorizar: {
    titulo: (n) =>
      n === 1 ? '1 documento sin categorizar' : `${n} documentos sin categorizar`,
    href: '/documentos',
    tone: 'warn',
  },
  tarea_vencida: {
    titulo: (n) =>
      n === 1 ? '1 tarea vencida o que vence hoy' : `${n} tareas vencidas o que vencen hoy`,
    href: '/tareas',
    tone: 'alert',
  },
}

export function DashboardAlertasStrip({ alertas }: { alertas: AlertaDashboard[] }) {
  if (alertas.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-[var(--cmd-text)]">Requiere atención</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {alertas.map((a) => {
          const meta = ALERTA_META[a.tipo]
          const isAlert = meta.tone === 'alert'
          return (
            <Link
              key={a.tipo}
              href={meta.href}
              className={
                isAlert
                  ? 'rounded-lg border border-[var(--cmd-decline)]/30 bg-[var(--cmd-decline)]/10 px-4 py-3 text-sm text-[var(--cmd-text)] hover:border-[var(--cmd-decline)]/50'
                  : 'rounded-lg border border-[var(--cmd-hangarc)]/30 bg-[var(--cmd-hangarc)]/10 px-4 py-3 text-sm text-[var(--cmd-text)] hover:border-[var(--cmd-hangarc)]/50'
              }
            >
              {meta.titulo(a.cantidad)}
              <span className="mt-1 block text-xs text-[var(--cmd-text-muted)]">Ver detalle →</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
