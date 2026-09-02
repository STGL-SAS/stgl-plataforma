import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBalanceConsolidado } from '@/modules/contabilidad/actions/balance'
import { BalanceConsolidadoPanel } from '@/modules/contabilidad/components/BalanceConsolidadoPanel'

async function getResumen() {
  const supabase = createAdminClient()

  const [tx, bold, inter] = await Promise.all([
    supabase.from('transacciones').select('id', { count: 'exact', head: true }),
    supabase
      .from('transacciones')
      .select('id', { count: 'exact', head: true })
      .eq('origen', 'bold')
      .eq('estado', 'pendiente_revision'),
    supabase
      .from('movimientos_intercompania')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente'),
  ])

  return {
    totalTransacciones: tx.count ?? 0,
    boldPendientes: bold.count ?? 0,
    interPendientes: inter.count ?? 0,
  }
}

export default async function ContabilidadPage() {
  let resumen = { totalTransacciones: 0, boldPendientes: 0, interPendientes: 0 }
  let balance = null

  try {
    resumen = await getResumen()
    balance = await getBalanceConsolidado()
  } catch {
    // Tablas aún no migradas o sin credenciales
  }

  const cards = [
    {
      href: '/contabilidad/transacciones',
      title: 'Transacciones',
      desc: 'Ledger central de ingresos y egresos',
      stat: `${resumen.totalTransacciones} registradas`,
    },
    {
      href: '/contabilidad/bold-pendientes',
      title: 'Bold pendientes',
      desc: 'Ventas recibidas sin clasificar',
      stat: `${resumen.boldPendientes} por revisar`,
      alert: resumen.boldPendientes > 0,
    },
    {
      href: '/contabilidad/socios',
      title: 'Estado de cuenta socios',
      desc: 'Aportes por negocio (capital / préstamo)',
      stat: 'Tomás · Samuel',
    },
    {
      href: '/contabilidad/intercompania',
      title: 'Intercompañía',
      desc: 'Préstamos y transferencias entre negocios',
      stat: `${resumen.interPendientes} pendientes`,
    },
  ]

  return (
    <div className="space-y-6">
      <p className="text-zinc-600">
        Módulo de contabilidad STGL — ledger central, clasificación Bold, aportes de socios e intercompañía.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`rounded-lg border bg-white p-5 transition-shadow hover:shadow-md ${
              card.alert ? 'border-amber-300' : 'border-zinc-200'
            }`}
          >
            <h2 className="font-semibold text-zinc-900">{card.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{card.desc}</p>
            <p className={`mt-3 text-sm font-medium ${card.alert ? 'text-amber-700' : 'text-zinc-500'}`}>
              {card.stat}
            </p>
          </Link>
        ))}
      </div>

      {balance && <BalanceConsolidadoPanel balance={balance} />}

      <Link
        href="/contabilidad/transacciones/nueva"
        className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        + Nueva transacción manual
      </Link>
    </div>
  )
}
