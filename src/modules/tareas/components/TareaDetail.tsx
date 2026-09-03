'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { DeleteIconButton } from '@/components/ui/IconAction'
import { deleteTarea, updateTareaCampos } from '../lib/actions'
import { useTareaHistorial } from '../hooks/useTareaHistorial'
import type { NegocioOption, SocioOption, TareaEstado, TareaRow, TareaTipo } from '../types'
import { ESTADO_LABEL, TAREA_ESTADOS, TAREA_TIPOS, TIPO_LABEL } from '../types'
import { AdjuntarDocumentoModal } from './AdjuntarDocumentoModal'
import { ComentarioForm } from './ComentarioForm'
import { TareaHistorialTimeline } from './TareaHistorialTimeline'

interface Props {
  initial: TareaRow
  negocios: NegocioOption[]
  socios: SocioOption[]
}

export function TareaDetail({ initial, negocios, socios }: Props) {
  const router = useRouter()
  const [tarea, setTarea] = useState(initial)
  const [titulo, setTitulo] = useState(initial.titulo)
  const [descripcion, setDescripcion] = useState(initial.descripcion ?? '')
  const [tipo, setTipo] = useState<TareaTipo>(initial.tipo)
  const [negocioId, setNegocioId] = useState(initial.negocio_id)
  const [responsableId, setResponsableId] = useState(initial.responsable_id ?? '')
  const [estado, setEstado] = useState<TareaEstado>(initial.estado)
  const [fechaLimite, setFechaLimite] = useState(initial.fecha_limite ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdjunto, setShowAdjunto] = useState(false)
  const { historial, loading: histLoading, reload } = useTareaHistorial(initial.id)

  const yaAdjuntados = historial
    .filter((h) => h.tipo_evento === 'documento_adjunto' && h.documento_id)
    .map((h) => h.documento_id as string)

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const updated = await updateTareaCampos(tarea.id, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        tipo,
        negocio_id: negocioId,
        responsable_id: responsableId || null,
        estado,
        fecha_limite: fechaLimite || null,
      })
      setTarea(updated as TareaRow)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm('¿Eliminar esta tarea? El historial también se borrará.')) return
    setBusy(true)
    try {
      await deleteTarea(tarea.id)
      router.push('/tareas')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/tareas" className="text-sm text-[var(--cmd-text-muted)] hover:underline">
          ← Volver al tablero
        </Link>
        <DeleteIconButton onClick={() => void remove()} disabled={busy} />
      </div>

      {error && (
        <p className="rounded-md border border-[var(--cmd-decline)]/30 bg-[var(--cmd-decline)]/10 px-3 py-2 text-sm text-[var(--cmd-decline)]">
          {error}
        </p>
      )}

      <section className="cmd-panel space-y-3 p-5 text-sm">
        <h2 className="text-base font-semibold text-[var(--cmd-text)]">Datos de la tarea</h2>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Título</span>
          <input
            className="rounded-md border px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Descripción</span>
          <textarea
            rows={4}
            className="rounded-md border px-3 py-2"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium">Tipo</span>
            <select
              className="rounded-md border px-3 py-2"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TareaTipo)}
            >
              {TAREA_TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Estado</span>
            <select
              className="rounded-md border px-3 py-2"
              value={estado}
              onChange={(e) => setEstado(e.target.value as TareaEstado)}
            >
              {TAREA_ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Negocio</span>
            <select
              className="rounded-md border px-3 py-2"
              value={negocioId}
              onChange={(e) => setNegocioId(e.target.value)}
            >
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Responsable</span>
            <select
              className="rounded-md border px-3 py-2"
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {socios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Fecha límite</span>
            <input
              type="date"
              className="rounded-md border px-3 py-2"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          className="rounded-md bg-[var(--cmd-panel-hover)] px-4 py-2 text-[var(--cmd-text)] disabled:opacity-50"
        >
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <p className="text-xs text-[var(--cmd-text-dim)]">
          Los cambios de estado y responsable quedan en el historial automáticamente.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="cmd-panel space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--cmd-text)]">Historial</h2>
            <button
              type="button"
              onClick={() => setShowAdjunto(true)}
              className="rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-bg)] px-3 py-1.5 text-sm text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)]"
            >
              Adjuntar documentos
            </button>
          </div>
          <TareaHistorialTimeline historial={historial} socios={socios} loading={histLoading} />
        </div>
        <div className="cmd-panel p-5">
          <ComentarioForm
            tareaId={tarea.id}
            onAdded={() => {
              void reload()
            }}
          />
        </div>
      </section>

      <AdjuntarDocumentoModal
        open={showAdjunto}
        onClose={() => setShowAdjunto(false)}
        tareaId={tarea.id}
        negocioId={negocioId}
        yaAdjuntados={yaAdjuntados}
        onAttached={() => {
          void reload()
        }}
      />
    </div>
  )
}
