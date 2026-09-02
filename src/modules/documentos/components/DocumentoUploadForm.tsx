'use client'

import { useEffect, useState } from 'react'
import { getNegocioOnedriveRoot } from '../lib/negocio-root'
import type { DocumentoRow } from '../lib/tipos'

export type UploadedDocumento = Pick<DocumentoRow, 'id' | 'nombre' | 'categoria'>

interface Props {
  negocioId: string
  /** Carpeta OneDrive destino; si no se pasa, se usa la raíz del negocio si está mapeada. */
  parentOnedriveId?: string | null
  defaultCategoria?: string
  onUploaded: (documento: UploadedDocumento) => void
  /**
   * Si es false, renderiza un `<div>` en vez de `<form>` (para anidar dentro
   * de otro formulario, p. ej. el modal de tareas). Default true.
   */
  asForm?: boolean
}

/**
 * Formulario de subida a OneDrive + ficha en `documentos`.
 * Misma API que el explorador (`POST /api/onedrive/upload`).
 */
export function DocumentoUploadForm({
  negocioId,
  parentOnedriveId = null,
  defaultCategoria = 'general',
  onUploaded,
  asForm = true,
}: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [categoria, setCategoria] = useState(defaultCategoria)
  const [tipoDocumento, setTipoDocumento] = useState('')
  const [resolvedParent, setResolvedParent] = useState<string | null>(parentOnedriveId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  useEffect(() => {
    setCategoria(defaultCategoria)
  }, [defaultCategoria])

  useEffect(() => {
    if (parentOnedriveId) {
      setResolvedParent(parentOnedriveId)
      return
    }
    let cancelled = false
    getNegocioOnedriveRoot(negocioId)
      .then((id) => {
        if (!cancelled) setResolvedParent(id)
      })
      .catch(() => {
        if (!cancelled) setResolvedParent(null)
      })
    return () => {
      cancelled = true
    }
  }, [negocioId, parentOnedriveId])

  async function doUpload() {
    if (!file || !negocioId) return
    setBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const fd = new FormData()
      fd.set('archivo', file)
      fd.set('negocio_id', negocioId)
      fd.set('categoria', categoria.trim() || 'general')
      if (tipoDocumento.trim()) fd.set('tipo_documento', tipoDocumento.trim())
      if (resolvedParent) fd.set('parent_onedrive_id', resolvedParent)

      const res = await fetch('/api/onedrive/upload', { method: 'POST', body: fd })
      const json = (await res.json()) as {
        error?: string
        documento?: UploadedDocumento
      }
      if (!res.ok) throw new Error(json.error || 'No se pudo subir el archivo')
      if (!json.documento?.id) throw new Error('Respuesta de subida incompleta')
      onUploaded({
        id: json.documento.id,
        nombre: json.documento.nombre,
        categoria: json.documento.categoria,
      })
      setOkMsg(`Subido: ${json.documento.nombre}`)
      setFile(null)
      setFileInputKey((k) => k + 1)
      setTipoDocumento('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setBusy(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    await doUpload()
  }

  const fields = (
    <>
      <label className="flex flex-col gap-1">
        <span className="font-medium">Archivo</span>
        <input
          key={fileInputKey}
          required={asForm}
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="text-xs text-zinc-500">Máximo ~4 MB por ahora</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-medium">Categoría</span>
        <input
          required={asForm}
          className="rounded-md border px-3 py-2"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-medium">Tipo (opcional)</span>
        <input
          className="rounded-md border px-3 py-2"
          value={tipoDocumento}
          onChange={(e) => setTipoDocumento(e.target.value)}
          placeholder="ej. factura, cotización…"
        />
      </label>
      {error && <p className="text-red-600">{error}</p>}
      {okMsg && <p className="text-emerald-700">{okMsg}</p>}
      {asForm ? (
        <button
          type="submit"
          disabled={busy || !file || !negocioId}
          className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? 'Subiendo…' : 'Subir'}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy || !file || !negocioId || !categoria.trim()}
          onClick={() => void doUpload()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? 'Subiendo…' : 'Subir'}
        </button>
      )}
    </>
  )

  if (asForm) {
    return (
      <form onSubmit={submit} className="space-y-3 text-sm">
        {fields}
      </form>
    )
  }

  return <div className="space-y-3 text-sm">{fields}</div>
}
