import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBalanceConsolidado } from '@/modules/contabilidad/actions/balance'
import { BalanceConsolidadoPanel } from '@/modules/contabilidad/components/BalanceConsolidadoPanel'
import {
  buildContabilidadResumenCards,
  ContabilidadResumenCards,
} from '@/modules/contabilidad/components/ContabilidadResumenCards'

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

  const cards = buildContabilidadResumenCards(resumen)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-[var(--cmd-text-muted)]">
          Módulo de contabilidad STGL — ledger central, clasificación Bold, aportes de socios e
          intercompañía.
        </p>
        <Link
          href="/contabilidad/transacciones/nueva"
          className="inline-flex shrink-0 rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)] px-4 py-2 text-sm font-medium text-[var(--cmd-text)] transition-colors hover:border-[var(--cmd-stgl)]"
        >
          + Nueva transacción manual
        </Link>
      </div>

      <ContabilidadResumenCards cards={cards} />

      {balance && <BalanceConsolidadoPanel balance={balance} />}
    </div>
  )
}
