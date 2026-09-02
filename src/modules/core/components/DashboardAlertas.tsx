'use client'

import Link from 'next/link'
import type { AlertaDashboard } from '../lib/dashboard'
import { formatCOP } from '../lib/format'

const ALERTA_META: Record<
  AlertaDashboard['tipo'],
  { titulo: (n: number) => string; href: string }
> = {
  bold_pendiente: {
    titulo: (n) =>
      n === 1
        ? '1 transacción Bold por clasificar'
        : `${n} transacciones Bold por clasificar`,
    href: '/contabilidad/bold-pendientes',
  },
  documento_sin_categorizar: {
    titulo: (n) =>
      n === 1 ? '1 documento sin categorizar' : `${n} documentos sin categorizar`,
    href: '/documentos',
  },
  tarea_vencida: {
    titulo: (n) => (n === 1 ? '1 tarea vencida' : `${n} tareas vencidas`),
    href: '/tareas',
  },
}

export function DashboardAlertas({ alertas }: { alertas: AlertaDashboard[] }) {
  if (alertas.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-800">Alertas</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {alertas.map((a) => {
          const meta = ALERTA_META[a.tipo]
          return (
            <Link
              key={a.tipo}
              href={meta.href}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 hover:border-amber-400"
            >
              {meta.titulo(a.cantidad)}
              <span className="mt-1 block text-xs text-amber-800/80">Ver detalle →</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function DashboardBalanceCards({
  balances,
}: {
  balances: {
    negocio_id: string
    negocio_codigo: string
    negocio_nombre: string
    ingresos: number
    egresos: number
    balance: number
    ingresos_mes: number
    egresos_mes: number
    balance_mes: number
    utilidad_hardtech?: number
  }[]
}) {
  const hrefFor = (codigo: string) => {
    if (codigo === 'HYDREX') return '/inventario-hydrex'
    if (codigo === 'HARDTECH') return '/hardtech/ventas'
    if (codigo === 'HANGARC' || codigo === 'VIRTUALWAITER') return `/clientes?negocio=${codigo}`
    return '/contabilidad'
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-800">Balance por negocio</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {balances.map((b) => {
          const isHt = b.negocio_codigo === 'HARDTECH'
          return (
            <Link
              key={b.negocio_id}
              href={hrefFor(b.negocio_codigo)}
              className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400"
            >
              <p className="font-semibold text-zinc-900">{b.negocio_nombre}</p>
              {isHt ? (
                <>
                  <p className="mt-2 text-2xl font-semibold">{formatCOP(b.utilidad_hardtech ?? 0)}</p>
                  <p className="text-xs text-zinc-500">Utilidad operativa (acumulada)</p>
                  <p className="mt-2 text-xs text-zinc-600">
                    Ledger mes: {formatCOP(b.ingresos_mes)} − {formatCOP(b.egresos_mes)} ={' '}
                    {formatCOP(b.balance_mes)}
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-zinc-500">Mes actual</p>
                      <p className="font-medium">{formatCOP(b.balance_mes)}</p>
                      <p className="text-xs text-zinc-500">
                        {formatCOP(b.ingresos_mes)} / {formatCOP(b.egresos_mes)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Acumulado</p>
                      <p className="font-medium">{formatCOP(b.balance)}</p>
                      <p className="text-xs text-zinc-500">
                        {formatCOP(b.ingresos)} / {formatCOP(b.egresos)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
