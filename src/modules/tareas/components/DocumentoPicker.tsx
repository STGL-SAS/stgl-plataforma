'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

/** Usa el endpoint de búsqueda/listado del módulo Documentos (`GET /api/documentos`). */
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
    <div className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50/80 p-3 text-sm">
      <p className="font-medium text-zinc-900">Documentos</p>
      {!negocioId && (
        <p className="text-xs text-zinc-500">Elige un negocio para buscar o subir documentos.</p>
      )}

      <div className="flex rounded-md border border-zinc-300 bg-white text-sm">
        <button
          type="button"
          className={`flex-1 px-3 py-1.5 ${tab === 'buscar' ? 'bg-zinc-900 text-white' : ''}`}
          onClick={() => setTab('buscar')}
        >
          Buscar
        </button>
        <button
          type="button"
          className={`flex-1 px-3 py-1.5 ${tab === 'subir' ? 'bg-zinc-900 text-white' : ''}`}
          onClick={() => setTab('subir')}
        >
          Subir nuevo
        </button>
      </div>

      {tab === 'buscar' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2"
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
              className="rounded-md border border-zinc-300 px-3 py-2"
              onClick={() => setQApplied(q.trim())}
            >
              Buscar
            </button>
          </div>
          {loading && <p className="text-zinc-500">Buscando…</p>}
          {error && <p className="text-red-600">{error}</p>}
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 bg-white p-2">
            {!loading && hits.length === 0 && (
              <li className="text-xs text-zinc-500">Sin resultados</li>
            )}
            {hits.map((d) => {
              const already = yaSet.has(d.id)
              const checked = already || selectedIds.includes(d.id)
              return (
                <li key={d.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-2 rounded px-1 py-1 ${
                      already ? 'opacity-60' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      disabled={already}
                      onChange={() => toggle(d.id, d.nombre)}
                    />
                    <span>
                      <span className="font-medium">{d.nombre}</span>
                      <span className="ml-1 text-xs text-zinc-500">{d.categoria}</span>
                      {already && (
                        <span className="ml-1 text-xs text-zinc-500">(ya adjunto)</span>
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
        <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-3">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-2.5 py-1 text-xs text-zinc-800"
            >
              {labels[id] ?? id.slice(0, 8)}
              <button
                type="button"
                className="font-medium text-zinc-600 hover:text-zinc-900"
                onClick={() => removeChip(id)}
                aria-label="Quitar"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
