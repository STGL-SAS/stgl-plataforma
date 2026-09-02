'use client'

import Link from 'next/link'
import type {
  AporteResumen,
  MovimientoMensual,
  TareasEstadoNegocio,
  UtilidadRepartible,
} from '../lib/dashboard'
import { formatCOP, formatMesLabel } from '../lib/format'

export function DashboardEvolucionMensual({ movimientos }: { movimientos: MovimientoMensual[] }) {
  const meses = [...new Set(movimientos.map((m) => m.mes))].sort()
  const maxVal = Math.max(1, ...movimientos.flatMap((m) => [m.ingresos, m.egresos]))

  if (meses.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-800">Evolución mensual</h2>
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
          Aún no hay movimientos clasificados para graficar.
        </p>
      </section>
    )
  }

  const porMes = meses.map((mes) => {
    const rows = movimientos.filter((m) => m.mes === mes)
    const ingresos = rows.reduce((s, r) => s + r.ingresos, 0)
    const egresos = rows.reduce((s, r) => s + r.egresos, 0)
    return { mes, ingresos, egresos, porNegocio: rows }
  })

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-800">Evolución mensual</h2>
      <p className="text-xs text-zinc-500">Ingresos vs egresos (últimos meses, clasificados)</p>
      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
        {porMes.map((row) => (
          <div key={row.mes} className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-600">
              <span className="font-medium capitalize">{formatMesLabel(row.mes)}</span>
              <span>
                +{formatCOP(row.ingresos)} / −{formatCOP(row.egresos)}
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded bg-zinc-100">
              <div
                className="bg-emerald-600/80"
                style={{ width: `${(row.ingresos / maxVal) * 100}%` }}
                title={`Ingresos ${formatCOP(row.ingresos)}`}
              />
              <div
                className="bg-rose-500/70"
                style={{ width: `${(row.egresos / maxVal) * 100}%` }}
                title={`Egresos ${formatCOP(row.egresos)}`}
              />
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
              {row.porNegocio.map((n) => (
                <li key={n.negocio_id}>
                  {n.negocio_nombre}: +{formatCOP(n.ingresos)} −{formatCOP(n.egresos)}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="text-[11px] text-zinc-400">
          <span className="inline-block h-2 w-2 rounded-sm bg-emerald-600/80" /> Ingresos{' '}
          <span className="ml-2 inline-block h-2 w-2 rounded-sm bg-rose-500/70" /> Egresos
        </p>
      </div>
    </section>
  )
}

export function DashboardAportesSocios({ aportes }: { aportes: AporteResumen[] }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-800">Estado de cuenta de socios</h2>
        <Link href="/contabilidad/socios" className="text-xs text-zinc-600 hover:underline">
          Ver detalle →
        </Link>
      </div>
      <ul className="divide-y rounded-lg border border-zinc-200 bg-white">
        {aportes.length === 0 && (
          <li className="px-4 py-3 text-sm text-zinc-500">Sin aportes registrados.</li>
        )}
        {aportes.map((a) => (
          <li key={a.socio_id} className="flex justify-between px-4 py-3 text-sm">
            <span className="font-medium">{a.socio_nombre}</span>
            <span>{formatCOP(a.total)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function DashboardUtilidadRepartible({ rows }: { rows: UtilidadRepartible[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-800">Utilidad repartible (teórica)</h2>
      <p className="rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-600">
        Solo informativo: no implica un reparto ni pago real todavía.
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-2">Negocio</th>
              <th className="px-4 py-2">Socio</th>
              <th className="px-4 py-2">%</th>
              <th className="px-4 py-2 text-right">Utilidad teórica</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Sin datos de participación.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.negocio_nombre}-${r.socio_nombre}-${i}`} className="border-b border-zinc-100">
                <td className="px-4 py-2">{r.negocio_nombre}</td>
                <td className="px-4 py-2">{r.socio_nombre}</td>
                <td className="px-4 py-2">{r.porcentaje}%</td>
                <td className="px-4 py-2 text-right">{formatCOP(r.utilidad_teorica)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function DashboardTareasEstado({ tareas }: { tareas: TareasEstadoNegocio[] }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Tareas por negocio</h2>
        <Link href="/tareas" className="text-xs text-zinc-600 hover:underline">
          Ir a tareas →
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {tareas.length === 0 && (
          <p className="col-span-full rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
            No hay tareas registradas.
          </p>
        )}
        {tareas.map((t) => {
          const total = t.abiertas + t.resueltas
          const pct = total === 0 ? 0 : (t.resueltas / total) * 100
          return (
            <div key={t.negocio_id} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
              <p className="font-medium">{t.negocio_nombre}</p>
              <p className="mt-1 text-zinc-600">
                {t.abiertas} abiertas · {t.resueltas} resueltas
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded bg-zinc-100">
                <div className="h-full bg-zinc-800" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
