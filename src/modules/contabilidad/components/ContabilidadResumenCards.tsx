import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRightLeft,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { commandColors } from '@/styles/command-tokens'

export type ContabilidadResumenCard = {
  href: string
  title: string
  desc: string
  stat: string
  icon: LucideIcon
  glowColor: string
  alert?: boolean
}

export const CONTABILIDAD_CARD_ICONS = {
  transacciones: ArrowLeftRight,
  bold: AlertTriangle,
  socios: Users,
  intercompania: ArrowRightLeft,
} as const

export function buildContabilidadResumenCards(resumen: {
  totalTransacciones: number
  boldPendientes: number
  interPendientes: number
}): ContabilidadResumenCard[] {
  const stglAccent = commandColors.businesses.STGL
  const warningAccent = '#F59E0B'

  return [
    {
      href: '/contabilidad/transacciones',
      title: 'Transacciones',
      desc: 'Ledger central de ingresos y egresos',
      stat: `${resumen.totalTransacciones} registradas`,
      icon: CONTABILIDAD_CARD_ICONS.transacciones,
      glowColor: stglAccent,
    },
    {
      href: '/contabilidad/bold-pendientes',
      title: 'Bold pendientes',
      desc: 'Ventas recibidas sin clasificar',
      stat: `${resumen.boldPendientes} por revisar`,
      icon: CONTABILIDAD_CARD_ICONS.bold,
      glowColor: resumen.boldPendientes > 0 ? warningAccent : stglAccent,
      alert: resumen.boldPendientes > 0,
    },
    {
      href: '/contabilidad/socios',
      title: 'Estado de cuenta socios',
      desc: 'Aportes por negocio (capital / préstamo)',
      stat: 'Tomás · Samuel',
      icon: CONTABILIDAD_CARD_ICONS.socios,
      glowColor: stglAccent,
    },
    {
      href: '/contabilidad/intercompania',
      title: 'Intercompañía',
      desc: 'Préstamos y transferencias entre negocios',
      stat: `${resumen.interPendientes} pendientes`,
      icon: CONTABILIDAD_CARD_ICONS.intercompania,
      glowColor: resumen.interPendientes > 0 ? warningAccent : stglAccent,
      alert: resumen.interPendientes > 0,
    },
  ]
}

export function ContabilidadResumenCards({ cards }: { cards: ContabilidadResumenCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link
            key={card.href}
            href={card.href}
            className="cmd-panel cmd-panel-glow block rounded-xl p-5 transition-colors"
            style={{ '--glow-color': card.glowColor } as React.CSSProperties}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--cmd-border)] bg-black/20">
                <Icon className="h-[18px] w-[18px]" style={{ color: card.glowColor }} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-[var(--cmd-text)]">{card.title}</h2>
                <p className="mt-1 text-sm text-[var(--cmd-text-muted)]">{card.desc}</p>
                <p
                  className={`mt-3 text-sm font-medium ${
                    card.alert ? 'text-amber-400' : 'text-[var(--cmd-text-dim)]'
                  }`}
                >
                  {card.stat}
                </p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
