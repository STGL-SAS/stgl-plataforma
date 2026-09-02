'use client'

import { useEffect, useState } from 'react'
import { adjuntarDocumentosTarea } from '../lib/actions'
import { DocumentoPicker } from './DocumentoPicker'

interface Props {
  open: boolean
  onClose: () => void
  tareaId: string
  negocioId: string
  yaAdjuntados: string[]
  onAttached: () => void
}

export function AdjuntarDocumentoModal({
  open,
  onClose,
  tareaId,
  negocioId,
  yaAdjuntados,
  onAttached,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerKey, setPickerKey] = useState(0)

  useEffect(() => {
    if (!open) return
    setSelectedIds([])
    setError(null)
    setPickerKey((k) => k + 1)
  }, [open, negocioId])

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const { attached, failed } = await adjuntarDocumentosTarea(tareaId, selectedIds)
      if (attached.length === 0 && failed.length > 0) {
        throw new Error('No se pudo adjuntar ningún documento')
      }
      if (failed.length > 0) {
        setError(`${failed.length} documento(s) no se adjuntaron (¿duplicados?).`)
      }
      onAttached()
      if (failed.length === 0) onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo adjuntar')
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
        <h2 className="text-base font-semibold">Adjuntar documentos</h2>
        <p className="text-zinc-600">
          Puedes elegir varios existentes o subir nuevos (quedan también en Documentos).
        </p>
        {error && <p className="text-red-600">{error}</p>}
        <DocumentoPicker
          key={pickerKey}
          negocioId={negocioId}
          yaAdjuntados={yaAdjuntados}
          onChange={setSelectedIds}
        />
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={busy || selectedIds.length === 0}
            className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {busy
              ? 'Adjuntando…'
              : `Adjuntar${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
          </button>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
