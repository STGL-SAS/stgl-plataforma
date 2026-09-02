import { formatCOP } from '@/modules/hardtech/motor-calculo'
import type { BalanceConsolidado } from '../actions/balance'

export function BalanceConsolidadoPanel({ balance }: { balance: BalanceConsolidado }) {
  const porSocio = new Map<string, { nombre: string; total: number }>()
  for (const u of balance.utilidad_por_socio) {
    const cur = porSocio.get(u.socio_id) ?? { nombre: u.socio_nombre, total: 0 }
    cur.total += u.utilidad_teorica
    porSocio.set(u.socio_id, cur)
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="font-semibold text-zinc-900">Balance consolidado STGL</h2>
      <p className="text-2xl font-semibold">{formatCOP(balance.total_consolidado)}</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b text-left text-zinc-600">
            <tr>
              <th className="py-2 pr-4">Negocio</th>
              <th className="py-2 pr-4 text-right">Utilidad</th>
              <th className="py-2">Origen</th>
            </tr>
          </thead>
          <tbody>
            {balance.por_negocio.map((b) => (
              <tr key={b.negocio_id} className="border-b border-zinc-100">
                <td className="py-2 pr-4">{b.negocio_nombre}</td>
                <td className="py-2 pr-4 text-right font-medium">{formatCOP(b.utilidad)}</td>
                <td className="py-2 text-zinc-500 text-xs">
                  {b.origen === 'ganancia_calculada' ? 'Ganancia neta HARDTECH' : 'Ingresos − egresos'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3 className="text-sm font-medium text-zinc-700 mb-2">Utilidad teórica repartible por socio</h3>
        <ul className="text-sm space-y-1">
          {[...porSocio.values()].map((s) => (
            <li key={s.nombre}>
              {s.nombre}: <strong>{formatCOP(s.total)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
