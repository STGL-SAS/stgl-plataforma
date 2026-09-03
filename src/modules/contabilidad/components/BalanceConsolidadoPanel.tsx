import { CommandPanel } from '@/components/layout/ModuleShell'
import { formatCOP } from '../utils'
import type { BalanceConsolidado } from '../actions/balance'
import { NegocioRowLabel } from './NegocioRowLabel'

export function BalanceConsolidadoPanel({ balance }: { balance: BalanceConsolidado }) {
  const porSocio = new Map<string, { nombre: string; total: number }>()
  for (const u of balance.utilidad_por_socio) {
    const cur = porSocio.get(u.socio_id) ?? { nombre: u.socio_nombre, total: 0 }
    cur.total += u.utilidad_teorica
    porSocio.set(u.socio_id, cur)
  }

  return (
    <CommandPanel glowColor="var(--cmd-stgl)">
      <p className="text-sm text-[var(--cmd-text-muted)]">Balance consolidado STGL</p>
      <p className="font-display mt-2 text-4xl font-semibold tracking-tight text-[var(--cmd-text)]">
        {formatCOP(balance.total_consolidado)}
      </p>

      <div className="cmd-panel mt-6 overflow-x-auto">
        <table className="cmd-table min-w-full text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3 text-right">Utilidad</th>
              <th className="px-4 py-3">Origen</th>
            </tr>
          </thead>
          <tbody>
            {balance.por_negocio.map((b) => (
              <tr key={b.negocio_id} className="hover:bg-[var(--cmd-panel-hover)]">
                <td className="px-4 py-3">
                  <NegocioRowLabel codigo={b.negocio_codigo} nombre={b.negocio_nombre} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-label-mono text-[var(--cmd-text)]">
                    {formatCOP(b.utilidad)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--cmd-text-muted)]">
                  {b.origen === 'ganancia_calculada' ? 'Ganancia neta HARDTECH' : 'Ingresos − egresos'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cmd-panel mt-4 p-4">
        <h3 className="text-sm font-semibold text-[var(--cmd-text)]">
          Utilidad teórica repartible por socio
        </h3>
        <p className="mt-1 text-xs text-[var(--cmd-text-dim)]">
          Solo informativo: no implica un reparto ni pago real.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {[...porSocio.values()].map((s) => (
            <li key={s.nombre} className="flex items-center justify-between gap-3">
              <span className="text-[var(--cmd-text-muted)]">{s.nombre}</span>
              <span className="font-label-mono text-[var(--cmd-text)]">{formatCOP(s.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </CommandPanel>
  )
}
