'use client'

import { useEffect, useState } from 'react'
import { adjuntarDocumentosTarea, upsertTarea } from '../lib/actions'
import type { NegocioOption, SocioOption, TareaRow, TareaTipo } from '../types'
import { TAREA_ESTADOS, TAREA_TIPOS, TIPO_LABEL, ESTADO_LABEL } from '../types'
import { DocumentoPicker } from './DocumentoPicker'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (tarea: TareaRow, warning?: string | null) => void
  negocios: NegocioOption[]
  socios: SocioOption[]
  defaultNegocioId?: string
  initial?: TareaRow | null
}

export function TareaFormModal({
  open,
  onClose,
  onSaved,
  negocios,
  socios,
  defaultNegocioId,
  initial,
}: Props) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState<TareaTipo>('tarea')
  const [negocioId, setNegocioId] = useState('')
  const [responsableId, setResponsableId] = useState('')
  const [estado, setEstado] = useState<(typeof TAREA_ESTADOS)[number]>('pendiente')
  const [fechaLimite, setFechaLimite] = useState('')
  const [documentoIds, setDocumentoIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitulo(initial?.titulo ?? '')
    setDescripcion(initial?.descripcion ?? '')
    setTipo(initial?.tipo ?? 'tarea')
    setNegocioId(initial?.negocio_id ?? defaultNegocioId ?? negocios[0]?.id ?? '')
    setResponsableId(initial?.responsable_id ?? '')
    setEstado(initial?.estado ?? 'pendiente')
    setFechaLimite(initial?.fecha_limite ?? '')
    setDocumentoIds([])
    setError(null)
  }, [open, initial, defaultNegocioId, negocios])

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const row = await upsertTarea({
        id: initial?.id,
        negocio_id: negocioId,
        titulo,
        descripcion,
        tipo,
        responsable_id: responsableId || null,
        estado,
        fecha_limite: fechaLimite || null,
      })

      let warning: string | null = null
      if (!initial?.id && documentoIds.length > 0) {
        const { failed } = await adjuntarDocumentosTarea(row.id as string, documentoIds)
        if (failed.length > 0) {
          warning = `La tarea se creó, pero ${failed.length} documento(s) no quedaron adjuntos.`
        }
      }

      onSaved(row as TareaRow, warning)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-lg bg-white p-6 text-sm shadow-lg"
      >
        <h2 className="text-base font-semibold">
          {initial ? 'Editar tarea' : 'Nueva tarea o caso'}
        </h2>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</p>}
        <label className="flex flex-col gap-1">
          <span className="font-medium">Título</span>
          <input
            required
            className="rounded-md border px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Descripción</span>
          <textarea
            rows={3}
            className="rounded-md border px-3 py-2"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
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
              onChange={(e) => setEstado(e.target.value as typeof estado)}
            >
              {TAREA_ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {ESTADO_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Negocio</span>
          <select
            required
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

        {!initial && (
          <DocumentoPicker negocioId={negocioId} onChange={setDocumentoIds} />
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
