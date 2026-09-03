'use client'

import { useEffect, useState } from 'react'
import { SimpleModal } from '@/components/ui/SimpleModal'
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
    <SimpleModal open={open} onClose={onClose} title="Adjuntar documentos" className="max-w-lg">
      <form onSubmit={submit} className="space-y-3 text-sm">
        <p className="text-[var(--cmd-text-muted)]">
          Puedes elegir varios existentes o subir nuevos (quedan también en Documentos).
        </p>
        {error && <p className="text-[var(--cmd-decline)]">{error}</p>}
        <DocumentoPicker
          key={pickerKey}
          negocioId={negocioId}
          yaAdjuntados={yaAdjuntados}
          onChange={setSelectedIds}
        />
        <div className="flex gap-2 border-t border-[var(--cmd-border)] pt-3">
          <button
            type="submit"
            disabled={busy || selectedIds.length === 0}
            className="rounded-md bg-[var(--cmd-panel-hover)] px-4 py-2 text-[var(--cmd-text)] disabled:opacity-50"
          >
            {busy
              ? 'Adjuntando…'
              : `Adjuntar${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </SimpleModal>
  )
}
