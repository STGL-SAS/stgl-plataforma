'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BusinessLogo } from '@/components/ui/BusinessLogo'
import { AlertsBellButton } from '@/components/ui/AlertsBellButton'
import {
  DashboardDateFilterControl,
  DEFAULT_DATE_FILTER,
} from '@/components/ui/DashboardDateFilter'
import { DashboardAlertasStrip } from '@/components/ui/DashboardAlertasStrip'
import { CommandPanel } from '@/components/layout/ModuleShell'
import { formatCOP, formatMesLabel } from '../lib/format'
import type { DashboardData } from '../lib/dashboard'
import { computeDashboardForRange } from '../lib/dashboard-compute'
import {
  growthComparisonLabel,
  resolveDateRange,
  type DashboardDateFilter,
} from '../lib/dashboard-date-filter'
import { commandColors, businessMeta } from '@/styles/command-tokens'
import { cn } from '@/lib/cn'

export function CommandDashboard({ data }: { data: DashboardData }) {
  const [dateFilter, setDateFilter] = useState<DashboardDateFilter>(DEFAULT_DATE_FILTER)

  const range = useMemo(() => resolveDateRange(dateFilter), [dateFilter])
  const computed = useMemo(() => computeDashboardForRange(data, range), [data, range])

  const { summary, negocioCards, movimientosFiltered, balancesPeriod } = computed
  const alertCount = data.alertas.reduce((sum, a) => sum + a.cantidad, 0)
  const growth = summary.growthPct
  const comparisonLabel = growthComparisonLabel(range.preset)

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-[var(--cmd-text)]">Inicio</h1>
          <p className="mt-0.5 text-sm text-[var(--cmd-text-muted)]">
            Dashboard general · HYDREX · HARDTECH · HANGARC · VirtualWaiter
          </p>
          <div className="mt-3">
            <DashboardDateFilterControl value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>
        <AlertsBellButton count={alertCount} items={data.liveFeed} />
      </header>

      <div className="space-y-5">
        <DashboardAlertasStrip alertas={data.alertas} />

        <div className="grid gap-5 lg:grid-cols-2">
          <ConsolidatedNavCard
            total={summary.consolidatedNav}
            growthLabel={summary.growthLabel}
            growth={growth}
            segments={summary.segmentWeights}
            comparisonLabel={comparisonLabel}
          />
          <EvolutionChart movimientos={movimientosFiltered} />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--cmd-text)]">Balance por negocio</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {negocioCards.map((card) => {
              const meta = businessMeta[card.negocio_codigo]
              const balance = balancesPeriod.find((b) => b.negocio_codigo === card.negocio_codigo)
              return (
                <BusinessUnitCard
                  key={card.negocio_codigo}
                  codigo={card.negocio_codigo}
                  nombre={meta?.nombre ?? card.negocio_codigo}
                  descripcion={meta?.descripcion ?? ''}
                  href={meta?.href ?? '/'}
                  estado={card.estado}
                  metric1={card.metric1}
                  metric2={card.metric2}
                  balanceLabel={summary.balanceLabel}
                  balancePeriod={balance?.balance}
                />
              )
            })}
          </div>
        </section>

        <SecondaryPanels data={data} />
      </div>
    </div>
  )
}

function ConsolidatedNavCard({
  total,
  growthLabel,
  growth,
  segments,
  comparisonLabel,
}: {
  total: number
  growthLabel: string
  growth: number | null
  segments: { codigo: string; weight: number }[]
  comparisonLabel: string
}) {
  return (
    <CommandPanel className="flex flex-col justify-between">
      <p className="text-sm text-[var(--cmd-text-muted)]">Balance consolidado STGL</p>
      <p className="font-display mt-2 text-4xl font-semibold tracking-tight text-[var(--cmd-text)]">
        {formatCOP(total)}
      </p>
      <p
        className={cn(
          'mt-1 text-xs',
          growth == null
            ? 'text-[var(--cmd-text-dim)]'
            : growth >= 0
              ? 'text-[var(--cmd-growth)]'
              : 'text-[var(--cmd-decline)]'
        )}
      >
        {growthLabel}
        {growth != null && (
          <span className="text-[var(--cmd-text-dim)]"> · {comparisonLabel}</span>
        )}
      </p>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/[0.04]">
        {segments.map((s) => (
          <div
            key={s.codigo}
            style={{
              width: `${Math.max(s.weight * 100, s.weight > 0 ? 2 : 0)}%`,
              backgroundColor: commandColors.businesses[s.codigo] ?? 'var(--cmd-text-dim)',
            }}
            title={s.codigo}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.codigo} className="flex items-center gap-1.5 text-xs text-[var(--cmd-text-muted)]">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: commandColors.businesses[s.codigo] }}
            />
            {s.codigo}
          </span>
        ))}
      </div>
    </CommandPanel>
  )
}

function EvolutionChart({ movimientos }: { movimientos: DashboardData['movimientos'] }) {
  const meses = [...new Set(movimientos.map((m) => m.mes))].sort()
  const codigos = ['HYDREX', 'HANGARC', 'VIRTUALWAITER', 'HARDTECH'] as const
  const w = 480
  const h = 200
  const pad = { t: 16, r: 12, b: 28, l: 12 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b

  const series = codigos.map((codigo) => {
    const points = meses.map((mes, i) => {
      const row = movimientos.find((m) => m.mes === mes && m.negocio_codigo === codigo)
      const net = row ? row.ingresos - row.egresos : 0
      return { mes, net, i }
    })
    return { codigo, points }
  })

  const allNets = series.flatMap((s) => s.points.map((p) => p.net))
  const maxAbs = Math.max(1, ...allNets.map((n) => Math.abs(n)))
  const hasData = allNets.some((n) => n !== 0)

  const toY = (v: number) => pad.t + innerH / 2 - (v / maxAbs) * (innerH / 2 - 8)
  const toX = (i: number) =>
    meses.length <= 1 ? pad.l + innerW / 2 : pad.l + (i / (meses.length - 1)) * innerW

  return (
    <CommandPanel>
      <p className="mb-1 text-sm font-semibold text-[var(--cmd-text)]">Evolución mensual</p>
      <p className="mb-3 text-xs text-[var(--cmd-text-muted)]">Ingresos − egresos por negocio</p>
      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Gráfica de evolución mensual">
          {[0.25, 0.5, 0.75].map((pct) => (
            <line
              key={pct}
              x1={pad.l}
              x2={w - pad.r}
              y1={pad.t + innerH * pct}
              y2={pad.t + innerH * pct}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
            />
          ))}
          {hasData ? (
            <>
              <defs>
                {codigos.map((c) => (
                  <filter key={c} id={`glow-${c}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="3"
                      floodColor={commandColors.businesses[c]}
                      floodOpacity="0.55"
                    />
                  </filter>
                ))}
              </defs>
              {series.map(({ codigo, points }) => {
                if (points.every((p) => p.net === 0)) return null
                const d = points
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(p.i)} ${toY(p.net)}`)
                  .join(' ')
                return (
                  <path
                    key={codigo}
                    d={d}
                    fill="none"
                    stroke={commandColors.businesses[codigo]}
                    strokeWidth={2}
                    filter={`url(#glow-${codigo})`}
                    opacity={0.9}
                  />
                )
              })}
            </>
          ) : (
            <text
              x={w / 2}
              y={h / 2}
              textAnchor="middle"
              className="fill-[var(--cmd-text-dim)]"
              fontSize={12}
            >
              Sin movimientos en el período
            </text>
          )}
          {meses.map((mes, i) => (
            <text
              key={mes}
              x={toX(i)}
              y={h - 6}
              textAnchor="middle"
              className="fill-[var(--cmd-text-dim)]"
              fontSize={9}
            >
              {formatMesLabel(mes).replace('.', '')}
            </text>
          ))}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {codigos.map((c) => (
          <span key={c} className="flex items-center gap-1 text-xs text-[var(--cmd-text-muted)]">
            <span className="h-0.5 w-3 rounded" style={{ backgroundColor: commandColors.businesses[c] }} />
            {c}
          </span>
        ))}
      </div>
    </CommandPanel>
  )
}

function BusinessUnitCard({
  codigo,
  nombre,
  descripcion,
  href,
  estado,
  metric1,
  metric2,
  balanceLabel,
  balancePeriod,
}: {
  codigo: string
  nombre: string
  descripcion: string
  href: string
  estado: 'ACTIVO' | 'EN DESARROLLO'
  metric1: { label: string; value: string; empty?: boolean; hint?: string }
  metric2: { label: string; value: string; empty?: boolean; hint?: string }
  balanceLabel: string
  balancePeriod?: number
}) {
  const color = commandColors.businesses[codigo] ?? commandColors.textMuted
  const badgeColor = estado === 'ACTIVO' ? color : 'var(--cmd-text-dim)'

  return (
    <Link
      href={href}
      className="cmd-panel cmd-panel-glow block rounded-xl p-5 transition-colors"
      style={{ '--glow-color': color } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <BusinessLogo codigo={codigo} size={36} />
        <span className="text-xs font-medium" style={{ color: badgeColor }}>
          {estado === 'EN DESARROLLO' ? 'En desarrollo' : 'Activo'}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-[var(--cmd-text)]">{nombre}</h3>
      <p className="mt-0.5 text-sm text-[var(--cmd-text-muted)]">{descripcion}</p>
      {balancePeriod != null && (
        <p className="mt-2 text-xs text-[var(--cmd-text-dim)]">
          {balanceLabel}: {formatCOP(balancePeriod)}
        </p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[metric1, metric2].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-[var(--cmd-border)] bg-black/20 px-3 py-2"
            title={m.hint}
          >
            <p className="text-[11px] text-[var(--cmd-text-dim)]">{m.label}</p>
            <p className="mt-0.5 text-sm font-medium text-[var(--cmd-text)]">{m.value}</p>
            {m.hint && (
              <p className="mt-0.5 text-[10px] text-[var(--cmd-text-dim)]">{m.hint}</p>
            )}
          </div>
        ))}
      </div>
    </Link>
  )
}

function SecondaryPanels({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CommandPanel>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--cmd-text)]">Estado de cuenta de socios</h2>
          <Link href="/contabilidad/socios" className="text-xs text-[var(--cmd-text-muted)] hover:underline">
            Ver detalle →
          </Link>
        </div>
        <ul className="space-y-2 text-sm">
          {data.aportes.length === 0 && (
            <li className="text-[var(--cmd-text-dim)]">Sin aportes registrados.</li>
          )}
          {data.aportes.map((a) => (
            <li key={a.socio_id} className="flex justify-between">
              <span>{a.socio_nombre}</span>
              <span>{formatCOP(a.total)}</span>
            </li>
          ))}
        </ul>
      </CommandPanel>
      <CommandPanel>
        <h2 className="mb-2 text-sm font-semibold text-[var(--cmd-text)]">Utilidad repartible (teórica)</h2>
        <p className="mb-3 text-xs text-[var(--cmd-text-dim)]">
          Solo informativo: no implica un reparto ni pago real todavía.
        </p>
        {data.utilidad.length === 0 ? (
          <p className="text-sm text-[var(--cmd-text-dim)]">Sin datos de participación.</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {data.utilidad.slice(0, 8).map((u, i) => (
              <li key={i} className="flex justify-between gap-2 text-[var(--cmd-text-muted)]">
                <span className="truncate">
                  {u.negocio_nombre} · {u.socio_nombre}
                </span>
                <span className="shrink-0">{formatCOP(u.utilidad_teorica)}</span>
              </li>
            ))}
          </ul>
        )}
      </CommandPanel>
    </div>
  )
}
