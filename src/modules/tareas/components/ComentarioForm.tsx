'use client'

import { useState } from 'react'
import { addComentarioTarea } from '../lib/actions'
import type { TareaHistorialRow } from '../types'

interface Props {
  tareaId: string
  onAdded: (row: TareaHistorialRow) => void
}

export function ComentarioForm({ tareaId, onAdded }: Props) {
  const [texto, setTexto] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setBusy(true)
    setError(null)
    try {
      const row = await addComentarioTarea(tareaId, texto)
      onAdded(row as TareaHistorialRow)
      setTexto('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el comentario')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Agregar comentario</span>
        <textarea
          required
          rows={3}
          className="rounded-md border border-zinc-300 px-3 py-2"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un comentario…"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || !texto.trim()}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {busy ? 'Guardando…' : 'Comentar'}
      </button>
    </form>
  )
}
