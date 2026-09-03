'use client'

import { CommandPanel } from '@/components/layout/ModuleShell'
import { formatCOP } from '@/modules/contabilidad/utils'
import { useBalanceNegocio } from '../hooks/useBalanceNegocio'

export function BalanceNegocio({ negocioId, compact = false }: { negocioId: string; compact?: boolean }) {
  const { balance, loading, error } = useBalanceNegocio(negocioId)

  if (loading) {
    return (
      <CommandPanel>
        <p className="text-sm text-[var(--cmd-text-muted)]">Cargando balance…</p>
      </CommandPanel>
    )
  }

  if (error) {
    return (
      <CommandPanel>
        <p className="text-sm text-[var(--cmd-decline)]">{error}</p>
      </CommandPanel>
    )
  }

  if (!balance) return null

  const items = [
    { label: 'Ingresos del mes', value: formatCOP(balance.ingresos_mes), tone: 'growth' as const },
    { label: 'Egresos del mes', value: formatCOP(balance.egresos_mes), tone: 'neutral' as const },
    { label: 'Saldo del mes', value: formatCOP(balance.saldo_mes), tone: 'accent' as const },
    {
      label: 'Saldo acumulado',
      value: formatCOP(balance.saldo_acumulado),
      tone: 'accent' as const,
      hint: `Ingresos ${formatCOP(balance.ingresos_acumulado)} − egresos ${formatCOP(balance.egresos_acumulado)}`,
    },
  ]

  return (
    <CommandPanel>
      <h2 className="mb-4 text-sm font-semibold text-[var(--cmd-text)]">Balance</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-[var(--cmd-border)] bg-black/20 px-4 py-3"
          >
            <p className="text-[11px] text-[var(--cmd-text-dim)]">{item.label}</p>
            <p
              className={
                item.tone === 'growth'
                  ? 'mt-1 text-lg font-semibold text-[var(--cmd-growth)]'
                  : 'mt-1 text-lg font-semibold text-[var(--cmd-text)]'
              }
            >
              {item.value}
            </p>
            {item.hint && (
              <p className="mt-1 text-[10px] text-[var(--cmd-text-dim)]">{item.hint}</p>
            )}
          </div>
        ))}
      </div>
      {!compact && (
        <p className="mt-3 text-xs text-[var(--cmd-text-dim)]">
          Calculado desde transacciones clasificadas en Contabilidad.
        </p>
      )}
    </CommandPanel>
  )
}
