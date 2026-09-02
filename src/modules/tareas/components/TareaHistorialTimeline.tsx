'use client'

import type { SocioOption, TareaHistorialRow } from '../types'
import { ESTADO_LABEL, EVENTO_LABEL, type TareaEstado } from '../types'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function labelEstado(value: string | null) {
  if (!value) return '—'
  return ESTADO_LABEL[value as TareaEstado] ?? value
}

function labelResponsable(value: string | null, socios: SocioOption[]) {
  if (!value) return 'Sin asignar'
  return socios.find((s) => s.id === value)?.nombre ?? value
}

interface Props {
  historial: TareaHistorialRow[]
  socios: SocioOption[]
  loading?: boolean
}

export function TareaHistorialTimeline({ historial, socios, loading }: Props) {
  if (loading) {
    return <p className="text-sm text-zinc-500">Cargando historial…</p>
  }

  if (historial.length === 0) {
    return <p className="text-sm text-zinc-500">Aún no hay eventos en el historial.</p>
  }

  return (
    <ol className="space-y-3 border-l border-zinc-200 pl-4">
      {historial.map((ev) => {
        let detalle = ''
        if (ev.tipo_evento === 'creacion') {
          detalle = `Estado inicial: ${labelEstado(ev.valor_nuevo)}`
        } else if (ev.tipo_evento === 'cambio_estado') {
          detalle = `${labelEstado(ev.valor_anterior)} → ${labelEstado(ev.valor_nuevo)}`
        } else if (ev.tipo_evento === 'cambio_responsable') {
          detalle = `${labelResponsable(ev.valor_anterior, socios)} → ${labelResponsable(ev.valor_nuevo, socios)}`
        } else if (ev.tipo_evento === 'comentario') {
          detalle = ev.comentario ?? ''
        } else if (ev.tipo_evento === 'documento_adjunto') {
          detalle = ev.documentos?.nombre ?? ev.valor_nuevo ?? 'Documento'
        }

        return (
          <li key={ev.id} className="relative">
            <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-400" />
            <p className="text-sm font-medium text-zinc-900">{EVENTO_LABEL[ev.tipo_evento]}</p>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{detalle}</p>
            {ev.tipo_evento === 'documento_adjunto' && ev.documentos?.onedrive_web_url && (
              <a
                href={ev.documentos.onedrive_web_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-700 hover:underline"
              >
                Abrir en OneDrive
              </a>
            )}
            <p className="mt-0.5 text-xs text-zinc-500">{formatWhen(ev.created_at)}</p>
          </li>
        )
      })}
    </ol>
  )
}
