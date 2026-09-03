import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { codigoToSlug } from '@/modules/negocios/lib/slugs'
import type { AlertaDashboard, AporteResumen, LiveFeedItem, TareasEstadoNegocio } from './dashboard'

export type AlertsData = {
  alertas: AlertaDashboard[]
  liveFeed: LiveFeedItem[]
  alertCount: number
}

function formatCopPlain(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function hrefForNegocioAlert(
  codigo: string | undefined,
  section: 'tareas' | 'documentos' | 'bold'
): string {
  if (section === 'bold') return '/contabilidad/bold-pendientes'
  if (codigo === 'HARDTECH') {
    return section === 'tareas' ? '/hardtech/tareas' : '/hardtech/documentos'
  }
  if (codigo === 'HYDREX') {
    return section === 'tareas' ? '/inventario-hydrex/tareas' : '/inventario-hydrex/documentos'
  }
  const slug = codigo ? codigoToSlug(codigo) : null
  if (slug) return `/negocios/${slug}/${section}`
  return section === 'tareas' ? '/tareas' : '/documentos'
}

function tareaVencidaLabel(n: number): string {
  if (n === 1) return '1 tarea vencida o que vence hoy'
  return `${n} tareas vencidas o que vencen hoy`
}

function toneForNegocio(codigo: string): LiveFeedItem['tone'] {
  switch (codigo) {
    case 'HYDREX':
      return 'hydrex'
    case 'HARDTECH':
      return 'hardtech'
    case 'HANGARC':
      return 'hangarc'
    case 'VIRTUALWAITER':
      return 'virtualwaiter'
    default:
      return 'neutral'
  }
}

export function buildLiveFeed(
  alertas: AlertaDashboard[],
  options: {
    negocioCodigo?: string
    tareas?: TareasEstadoNegocio[]
    aportes?: Map<string, AporteResumen>
    includeAportes?: boolean
  } = {}
): LiveFeedItem[] {
  const { negocioCodigo, tareas = [], aportes, includeAportes = !negocioCodigo } = options
  const now = new Date()
  const ts = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
  const items: LiveFeedItem[] = []

  for (const a of alertas) {
    if (a.tipo === 'bold_pendiente') {
      items.push({
        id: `bold-${a.cantidad}`,
        at: ts,
        text:
          a.cantidad === 1
            ? '1 transacción Bold pendiente por clasificar'
            : `${a.cantidad} transacciones Bold pendientes por clasificar`,
        tone: 'alert',
        href: hrefForNegocioAlert(negocioCodigo, 'bold'),
      })
    } else if (a.tipo === 'documento_sin_categorizar') {
      items.push({
        id: `doc-${a.cantidad}`,
        at: ts,
        text:
          a.cantidad === 1
            ? '1 documento sin categorizar'
            : `${a.cantidad} documentos sin categorizar`,
        tone: 'neutral',
        href: hrefForNegocioAlert(negocioCodigo, 'documentos'),
      })
    } else if (a.tipo === 'tarea_vencida') {
      items.push({
        id: `tarea-${a.cantidad}`,
        at: ts,
        text: tareaVencidaLabel(a.cantidad),
        tone: 'alert',
        href: hrefForNegocioAlert(negocioCodigo, 'tareas'),
      })
    }
  }

  const tareasFeed = negocioCodigo
    ? tareas.filter((t) => t.negocio_codigo === negocioCodigo)
    : tareas

  for (const t of tareasFeed.filter((x) => x.abiertas > 0)) {
    items.push({
      id: `tareas-${t.negocio_id}`,
      at: ts,
      text: negocioCodigo
        ? `${t.abiertas} tarea${t.abiertas === 1 ? '' : 's'} abierta${t.abiertas === 1 ? '' : 's'}`
        : `${t.negocio_nombre}: ${t.abiertas} tarea${t.abiertas === 1 ? '' : 's'} abierta${t.abiertas === 1 ? '' : 's'}`,
      tone: toneForNegocio(t.negocio_codigo),
      href: hrefForNegocioAlert(t.negocio_codigo, 'tareas'),
    })
  }

  if (includeAportes && aportes) {
    const aportesList = [...aportes.values()].filter((a) => a.total > 0)
    if (aportesList.length > 0) {
      const top = aportesList.sort((a, b) => b.total - a.total)[0]
      items.push({
        id: `aporte-${top.socio_id}`,
        at: ts,
        text: `Aportes registrados — ${top.socio_nombre}: ${formatCopPlain(top.total)} acumulado`,
        tone: 'contabilidad',
        href: '/contabilidad/socios',
      })
    }
  }

  if (items.length === 0) {
    items.push({
      id: 'idle',
      at: ts,
      text: negocioCodigo
        ? 'Sin alertas pendientes para este negocio.'
        : 'Sin alertas activas. Plataforma al día.',
      tone: 'neutral',
    })
  }

  return items.slice(0, 12)
}

function mapAlertas(rows: { tipo: string; cantidad: unknown }[]): AlertaDashboard[] {
  return rows
    .map((r) => ({
      tipo: r.tipo as AlertaDashboard['tipo'],
      cantidad: Number(r.cantidad) || 0,
    }))
    .filter((a) => a.cantidad > 0)
}

export async function getAlertsData(negocioCodigo?: string): Promise<AlertsData> {
  noStore()
  const supabase = createAdminClient()

  if (negocioCodigo) {
    const [alertasRes, tareasRes] = await Promise.all([
      supabase.from('v_alertas_por_negocio').select('tipo, cantidad').eq('negocio_codigo', negocioCodigo),
      supabase.from('v_tareas_estado_por_negocio').select('*').eq('negocio_codigo', negocioCodigo),
    ])

    if (alertasRes.error) throw new Error(alertasRes.error.message)
    if (tareasRes.error) throw new Error(tareasRes.error.message)

    const alertas = mapAlertas(alertasRes.data ?? [])
    const tareas: TareasEstadoNegocio[] = (tareasRes.data ?? []).map((t) => ({
      negocio_id: t.negocio_id as string,
      negocio_codigo: t.negocio_codigo as string,
      negocio_nombre: t.negocio_nombre as string,
      abiertas: Number(t.abiertas) || 0,
      resueltas: Number(t.resueltas) || 0,
    }))

    const liveFeed = buildLiveFeed(alertas, { negocioCodigo, tareas, includeAportes: false })
    const alertCount = alertas.reduce((sum, a) => sum + a.cantidad, 0)

    return { alertas, liveFeed, alertCount }
  }

  const [alertasRes, tareasRes] = await Promise.all([
    supabase.from('v_alertas_dashboard').select('*'),
    supabase.from('v_tareas_estado_por_negocio').select('*'),
  ])

  if (alertasRes.error) throw new Error(alertasRes.error.message)
  if (tareasRes.error) throw new Error(tareasRes.error.message)

  const alertas = mapAlertas(alertasRes.data ?? [])
  const tareas: TareasEstadoNegocio[] = (tareasRes.data ?? []).map((t) => ({
    negocio_id: t.negocio_id as string,
    negocio_codigo: t.negocio_codigo as string,
    negocio_nombre: t.negocio_nombre as string,
    abiertas: Number(t.abiertas) || 0,
    resueltas: Number(t.resueltas) || 0,
  }))

  const liveFeed = buildLiveFeed(alertas, { tareas, includeAportes: false })
  const alertCount = alertas.reduce((sum, a) => sum + a.cantidad, 0)

  return { alertas, liveFeed, alertCount }
}
