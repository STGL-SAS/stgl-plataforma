'use client'

import { X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { DocumentoUploadForm } from '@/modules/documentos/components/DocumentoUploadForm'

type DocHit = {
  id: string
  nombre: string
  categoria: string
}

interface DocumentoPickerProps {
  negocioId: string
  yaAdjuntados?: string[]
  onChange: (documentoIds: string[]) => void
}

async function fetchDocumentos(negocioId: string, q: string): Promise<DocHit[]> {
  const params = new URLSearchParams({ negocio: negocioId })
  if (q.trim()) params.set('q', q.trim())
  else params.set('scope', 'all')

  const res = await fetch(`/api/documentos?${params}`)
  const json = (await res.json()) as {
    documentos?: {
      id: string
      nombre: string
      categoria: string
      es_carpeta: boolean
    }[]
    error?: string
  }
  if (!res.ok) throw new Error(json.error || 'Error al buscar')
  return (json.documentos ?? [])
    .filter((d) => !d.es_carpeta)
    .map((d) => ({ id: d.id, nombre: d.nombre, categoria: d.categoria }))
}

const fieldClass =
  'rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-bg)] px-3 py-2 text-[var(--cmd-text)]'

export function DocumentoPicker({
  negocioId,
  yaAdjuntados = [],
  onChange,
}: DocumentoPickerProps) {
  const [tab, setTab] = useState<'buscar' | 'subir'>('buscar')
  const [q, setQ] = useState('')
  const [qApplied, setQApplied] = useState('')
  const [hits, setHits] = useState<DocHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [labels, setLabels] = useState<Record<string, string>>({})

  const yaSet = useMemo(() => new Set(yaAdjuntados), [yaAdjuntados])

  const emit = useCallback(
    (ids: string[]) => {
      setSelectedIds(ids)
      onChange(ids)
    },
    [onChange]
  )

  const load = useCallback(async () => {
    if (!negocioId) {
      setHits([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchDocumentos(negocioId, qApplied)
      setHits(rows)
      setLabels((prev) => {
        const next = { ...prev }
        for (const r of rows) next[r.id] = r.nombre
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al buscar')
    } finally {
      setLoading(false)
    }
  }, [negocioId, qApplied])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    emit([])
    setLabels({})
    setQ('')
    setQApplied('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negocioId])

  function toggle(id: string, nombre: string) {
    if (yaSet.has(id)) return
    if (selectedIds.includes(id)) {
      emit(selectedIds.filter((x) => x !== id))
    } else {
      setLabels((prev) => ({ ...prev, [id]: nombre }))
      emit([...selectedIds, id])
    }
  }

  function removeChip(id: string) {
    emit(selectedIds.filter((x) => x !== id))
  }

  return (
    <div className="space-y-3 rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-bg)] p-3 text-sm">
      <p className="font-medium text-[var(--cmd-text)]">Documentos</p>
      {!negocioId && (
        <p className="text-xs text-[var(--cmd-text-dim)]">
          Elige un negocio para buscar o subir documentos.
        </p>
      )}

      <div className="flex rounded-md border border-[var(--cmd-border)] text-sm">
        {(['buscar', 'subir'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={cn(
              'flex-1 px-3 py-1.5 capitalize transition-colors',
              tab === t
                ? 'bg-[var(--cmd-panel-hover)] text-[var(--cmd-text)]'
                : 'text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)]'
            )}
            onClick={() => setTab(t)}
          >
            {t === 'subir' ? 'Subir nuevo' : 'Buscar'}
          </button>
        ))}
      </div>

      {tab === 'buscar' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              className={cn(fieldClass, 'flex-1')}
              placeholder="Nombre o categoría…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setQApplied(q.trim())
                }
              }}
            />
            <button
              type="button"
              className="rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel)] px-3 py-2 text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)]"
              onClick={() => setQApplied(q.trim())}
            >
              Buscar
            </button>
          </div>
          {loading && <p className="text-[var(--cmd-text-dim)]">Buscando…</p>}
          {error && <p className="text-[var(--cmd-decline)]">{error}</p>}
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel)] p-2">
            {!loading && hits.length === 0 && (
              <li className="text-xs text-[var(--cmd-text-dim)]">Sin resultados</li>
            )}
            {hits.map((d) => {
              const already = yaSet.has(d.id)
              const checked = already || selectedIds.includes(d.id)
              return (
                <li key={d.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2 rounded px-1 py-1',
                      already ? 'opacity-60' : 'hover:bg-[var(--cmd-panel-hover)]'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      disabled={already}
                      onChange={() => toggle(d.id, d.nombre)}
                    />
                    <span className="text-[var(--cmd-text)]">
                      <span className="font-medium">{d.nombre}</span>
                      <span className="ml-1 text-xs text-[var(--cmd-text-muted)]">{d.categoria}</span>
                      {already && (
                        <span className="ml-1 text-xs text-[var(--cmd-text-dim)]">(ya adjunto)</span>
                      )}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {tab === 'subir' && negocioId && (
        <DocumentoUploadForm
          asForm={false}
          negocioId={negocioId}
          onUploaded={(doc) => {
            if (yaSet.has(doc.id) || selectedIds.includes(doc.id)) return
            setLabels((prev) => ({ ...prev, [doc.id]: doc.nombre }))
            emit([...selectedIds, doc.id])
          }}
        />
      )}

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--cmd-border)] pt-3">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)] px-2.5 py-1 text-xs text-[var(--cmd-text)]"
            >
              {labels[id] ?? id.slice(0, 8)}
              <button
                type="button"
                className="text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)]"
                onClick={() => removeChip(id)}
                aria-label="Quitar"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
