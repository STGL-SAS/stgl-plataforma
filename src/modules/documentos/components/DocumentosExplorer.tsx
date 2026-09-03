'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DocumentoRow, EliminacionPreview, NegocioOption } from '../lib/tipos'
import { DeleteIconButton } from '@/components/ui/IconAction'
import { EliminarDocumentoModal } from './EliminarDocumentoModal'
import { DocumentoItemIcon } from './DocumentoItemIcon'

interface BreadcrumbItem {
  id: string | null
  nombre: string
}

interface Props {
  negocios: NegocioOption[]
  connected: boolean
  canImport: boolean
  categoriasIniciales: string[]
  initialError?: string | null
  justConnected?: boolean
  lockedNegocioId?: string
  initialCategoria?: string
  variant?: 'light' | 'dark'
  /** Oculta acciones de importación OneDrive (vista embebida en negocio). */
  compact?: boolean
  /** Restringe la navegación a la carpeta raíz del negocio en OneDrive. */
  soloCarpetaNegocio?: boolean
}

function navRootForNegocio(
  negocios: NegocioOption[],
  negocioId: string
): BreadcrumbItem {
  if (!negocioId) return { id: null, nombre: 'Inicio' }
  const n = negocios.find((x) => x.id === negocioId)
  if (n?.onedrive_root_folder_id) {
    return { id: n.onedrive_root_folder_id, nombre: n.nombre }
  }
  return { id: null, nombre: n?.nombre ?? 'Inicio' }
}

function lockedInitialState(
  negocios: NegocioOption[],
  lockedNegocioId: string,
  initialCategoria: string
) {
  const root = navRootForNegocio(negocios, lockedNegocioId)
  const neg = negocios.find((x) => x.id === lockedNegocioId)
  const defaultFormCat = neg?.codigo === 'STGL' ? 'STGL / general' : 'general'
  return {
    negocioId: lockedNegocioId,
    parentId: root.id,
    crumbs: [root] as BreadcrumbItem[],
    categoria: initialCategoria,
    folderForm: { nombre: '', negocio_id: lockedNegocioId, categoria: defaultFormCat },
    uploadForm: {
      negocio_id: lockedNegocioId,
      categoria: defaultFormCat,
      tipo_documento: '',
      file: null as File | null,
    },
  }
}

export function DocumentosExplorer({
  negocios: negociosIniciales,
  connected,
  canImport,
  categoriasIniciales,
  initialError,
  justConnected,
  lockedNegocioId,
  initialCategoria = '',
  variant = 'light',
  compact = false,
  soloCarpetaNegocio = false,
}: Props) {
  const isDark = variant === 'dark'
  const wrapClass = isDark ? 'documentos-explorer-dark' : undefined
  const lockedInit = lockedNegocioId
    ? lockedInitialState(negociosIniciales, lockedNegocioId, initialCategoria)
    : null

  const [negocios, setNegocios] = useState(negociosIniciales)
  const [docs, setDocs] = useState<DocumentoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [banner, setBanner] = useState<string | null>(null)
  const [negocioId, setNegocioId] = useState(lockedInit?.negocioId ?? '')
  const [categoria, setCategoria] = useState(lockedInit?.categoria ?? '')
  const [q, setQ] = useState('')
  const [qApplied, setQApplied] = useState('')
  const [parentId, setParentId] = useState<string | null>(lockedInit?.parentId ?? null)
  const [crumbs, setCrumbs] = useState<BreadcrumbItem[]>(
    lockedInit?.crumbs ?? [{ id: null, nombre: 'Inicio' }]
  )
  const [categorias, setCategorias] = useState(categoriasIniciales)

  const [showUpload, setShowUpload] = useState(false)
  const [showFolder, setShowFolder] = useState(false)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DocumentoRow | null>(null)
  const [deletePreview, setDeletePreview] = useState<EliminacionPreview | null>(null)
  const [deletePreviewLoading, setDeletePreviewLoading] = useState(false)
  const [deleteConfirming, setDeleteConfirming] = useState(false)

  const [uploadForm, setUploadForm] = useState(
    lockedInit?.uploadForm ?? {
      negocio_id: '',
      categoria: 'general',
      tipo_documento: '',
      file: null as File | null,
    }
  )
  const [folderForm, setFolderForm] = useState(
    lockedInit?.folderForm ?? {
      nombre: '',
      negocio_id: '',
      categoria: 'general',
    }
  )

  const effectiveNegocioId = lockedNegocioId ?? negocioId

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (qApplied) params.set('q', qApplied)
      else params.set('parent', parentId ?? 'root')
      if (effectiveNegocioId) params.set('negocio', effectiveNegocioId)
      if (categoria) params.set('categoria', categoria)

      const res = await fetch(`/api/documentos?${params}`)
      const json = (await res.json()) as { documentos?: DocumentoRow[]; error?: string }
      if (!res.ok) throw new Error(json.error || 'Error al cargar')
      const list = json.documentos ?? []
      setDocs(list)
      const cats = new Set(categoriasIniciales)
      list.forEach((d) => cats.add(d.categoria))
      setCategorias([...cats].sort())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [parentId, effectiveNegocioId, categoria, qApplied, categoriasIniciales])

  useEffect(() => {
    void load()
  }, [load])

  function applyNegocioFilter(id: string) {
    if (lockedNegocioId) return
    setNegocioId(id)
    setQ('')
    setQApplied('')
    const root = navRootForNegocio(negocios, id)
    setParentId(root.id)
    setCrumbs([root])
    if (id) {
      setFolderForm((f) => ({ ...f, negocio_id: id }))
      setUploadForm((f) => ({ ...f, negocio_id: id }))
    }
  }

  function openFolder(doc: DocumentoRow) {
    setQ('')
    setQApplied('')
    setParentId(doc.onedrive_item_id)
    setCrumbs((prev) => [...prev, { id: doc.onedrive_item_id, nombre: doc.nombre }])
  }

  function goCrumb(index: number) {
    const target = crumbs[index]
    setQ('')
    setQApplied('')
    setParentId(target.id)
    setCrumbs(crumbs.slice(0, index + 1))
  }

  /** Carpeta destino para subir/crear: nunca la raíz general si hay negocio mapeado. */
  function resolveParentForWrite(formNegocioId: string): string | null {
    if (parentId) return parentId
    const n = negocios.find((x) => x.id === formNegocioId)
    return n?.onedrive_root_folder_id ?? null
  }

  async function syncWithOneDrive() {
    setSyncing(true)
    setError(null)
    setBanner(null)
    try {
      const res = await fetch('/api/onedrive/sincronizar', { method: 'POST' })
      const json = (await res.json()) as {
        error?: string
        documentos_importados?: number
        carpetas_importadas?: number
        documentos_eliminados?: number
        tareas_actualizadas?: number
        roots?: { id: string; onedrive_root_folder_id: string }[]
      }
      if (!res.ok) throw new Error(json.error || 'Error al sincronizar')

      const docsImp = json.documentos_importados ?? 0
      const carpetasImp = json.carpetas_importadas ?? 0
      const docsElim = json.documentos_eliminados ?? 0
      const tareas = json.tareas_actualizadas ?? 0

      if (json.roots?.length) {
        const nextNegocios = negocios.map((n) => {
          const hit = json.roots?.find((r) => r.id === n.id)
          return hit ? { ...n, onedrive_root_folder_id: hit.onedrive_root_folder_id } : n
        })
        setNegocios(nextNegocios)
        const root = navRootForNegocio(nextNegocios, negocioId)
        setParentId(root.id)
        setCrumbs([root])
      }

      const partes: string[] = []
      if (docsImp > 0 || carpetasImp > 0) {
        partes.push(
          `Se importaron ${docsImp} documento${docsImp === 1 ? '' : 's'} y ${carpetasImp} carpeta${carpetasImp === 1 ? '' : 's'}.`
        )
      }
      if (docsElim > 0) {
        const tareasMsg =
          tareas > 0
            ? ` ${tareas} tarea${tareas === 1 ? '' : 's'} ${tareas === 1 ? 'fue' : 'fueron'} actualizada${tareas === 1 ? '' : 's'}.`
            : ''
        partes.push(
          `${docsElim} documento${docsElim === 1 ? '' : 's'} eliminado${docsElim === 1 ? '' : 's'} en OneDrive.${tareasMsg}`
        )
      }

      if (partes.length > 0) {
        setBanner(partes.join(' '))
        setQApplied('')
        await load()
      } else {
        setBanner('Sincronización completada. No hubo cambios en OneDrive.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  function closeDeleteModal() {
    if (deleteConfirming) return
    setDeleteTarget(null)
    setDeletePreview(null)
    setDeletePreviewLoading(false)
  }

  async function openDeleteModal(doc: DocumentoRow) {
    setDeleteTarget(doc)
    setDeletePreview(null)
    setDeletePreviewLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/documentos/${doc.id}/eliminar-preview`)
      const json = (await res.json()) as { preview?: EliminacionPreview; error?: string }
      if (!res.ok) throw new Error(json.error || 'No se pudo preparar la eliminación')
      setDeletePreview(json.preview ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      setDeleteTarget(null)
    } finally {
      setDeletePreviewLoading(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteConfirming(true)
    setError(null)
    try {
      const res = await fetch(`/api/documentos/${deleteTarget.id}`, { method: 'DELETE' })
      const json = (await res.json()) as {
        error?: string
        eliminados?: number
        tareas_actualizadas?: number
      }
      if (!res.ok) throw new Error(json.error || 'No se pudo eliminar')

      const n = json.eliminados ?? 1
      const tareas = json.tareas_actualizadas ?? 0
      const tareasMsg =
        tareas > 0
          ? ` Se actualizó el historial de ${tareas} tarea${tareas === 1 ? '' : 's'}.`
          : ''
      setBanner(`Se eliminó${n === 1 ? '' : 'n'} ${n} elemento${n === 1 ? '' : 's'}.${tareasMsg}`)
      setDeleteTarget(null)
      setDeletePreview(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleteConfirming(false)
    }
  }

  async function submitFolder(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const parent = resolveParentForWrite(folderForm.negocio_id)
      const res = await fetch('/api/onedrive/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: folderForm.nombre,
          negocio_id: folderForm.negocio_id,
          categoria: folderForm.categoria,
          parent_onedrive_id: parent,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo crear la carpeta')
      setShowFolder(false)
      setFolderForm({ nombre: '', negocio_id: folderForm.negocio_id || '', categoria: 'general' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  async function submitUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadForm.file) return
    setBusy(true)
    setError(null)
    try {
      const parent = resolveParentForWrite(uploadForm.negocio_id)
      const fd = new FormData()
      fd.set('archivo', uploadForm.file)
      fd.set('negocio_id', uploadForm.negocio_id)
      fd.set('categoria', uploadForm.categoria)
      if (uploadForm.tipo_documento) fd.set('tipo_documento', uploadForm.tipo_documento)
      if (parent) fd.set('parent_onedrive_id', parent)

      const res = await fetch('/api/onedrive/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo subir el archivo')
      setShowUpload(false)
      setUploadForm({
        negocio_id: uploadForm.negocio_id || '',
        categoria: 'general',
        tipo_documento: '',
        file: null,
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  const negocioDefault = useMemo(
    () => negocios.find((n) => n.codigo === 'STGL')?.id ?? '',
    [negocios]
  )

  useEffect(() => {
    if (!folderForm.negocio_id && negocioDefault) {
      setFolderForm((f) => ({ ...f, negocio_id: negocioDefault }))
    }
    if (!uploadForm.negocio_id && negocioDefault) {
      setUploadForm((f) => ({ ...f, negocio_id: negocioDefault }))
    }
  }, [negocioDefault, folderForm.negocio_id, uploadForm.negocio_id])

  return (
    <div className={wrapClass}>
    <div className="space-y-4">
      {!connected && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Falta conectar la cuenta de OneDrive de STGL</p>
          <p className="mt-1">
            Un superadmin debe autorizar la cuenta una vez. Después los tokens se renuevan solos.
          </p>
          <a
            href="/api/onedrive/auth/login"
            className="mt-3 inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Conectar OneDrive
          </a>
        </div>
      )}

      {justConnected && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          OneDrive conectado correctamente.
        </p>
      )}

      {banner && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{banner}</p>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="space-y-3">
        {soloCarpetaNegocio && effectiveNegocioId && (
          <p className="text-xs text-[var(--cmd-text-dim)]">
            Carpeta del negocio en OneDrive
          </p>
        )}

        <div className="flex flex-wrap gap-3 items-end">
          {!lockedNegocioId && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Negocio</span>
              <select
                className="rounded-md border border-zinc-300 px-3 py-2 min-w-[10rem]"
                value={negocioId}
                onChange={(e) => applyNegocioFilter(e.target.value)}
              >
                <option value="">Todos</option>
                {negocios.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Categoría</span>
            <select
              className="rounded-md border border-zinc-300 px-3 py-2 min-w-[10rem]"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm basis-full sm:basis-auto sm:min-w-[14rem]">
            <span className="font-medium">Buscar</span>
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2"
                placeholder="Nombre…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setQApplied(q.trim())
                }}
              />
              <button
                type="button"
                className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm"
                onClick={() => setQApplied(q.trim())}
              >
                Buscar
              </button>
              {qApplied && (
                <button
                  type="button"
                  className="shrink-0 text-sm text-zinc-600"
                  onClick={() => {
                    setQ('')
                    setQApplied('')
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </label>
        </div>

        {canImport && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!connected || syncing}
              onClick={() => void syncWithOneDrive()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-40"
            >
              {syncing ? 'Sincronizando…' : 'Sincronizar con OneDrive'}
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!connected}
            onClick={() => setShowFolder(true)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Nueva carpeta
          </button>
          <button
            type="button"
            disabled={!connected}
            onClick={() => setShowUpload(true)}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Subir archivo
          </button>
        </div>
      </div>

      {syncing && (
        <p className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800" />
          Sincronizando con OneDrive (puede tardar)…
        </p>
      )}

      {!qApplied && (
        <nav className="flex flex-wrap items-center gap-1 text-sm text-zinc-600">
          {crumbs.map((c, i) => (
            <span key={`${c.id ?? 'root'}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <button
                type="button"
                className={`hover:underline ${i === crumbs.length - 1 ? 'font-medium text-zinc-900' : ''}`}
                onClick={() => goCrumb(i)}
              >
                {c.nombre}
              </button>
            </span>
          ))}
        </nav>
      )}

      {qApplied && (
        <p className="text-sm text-zinc-600">
          Resultados de búsqueda para «{qApplied}» (todas las carpetas)
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              {!soloCarpetaNegocio && <th className="px-4 py-3">Negocio</th>}
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={soloCarpetaNegocio ? 4 : 5} className="px-4 py-8 text-center text-zinc-500">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && docs.length === 0 && (
              <tr>
                <td colSpan={soloCarpetaNegocio ? 4 : 5} className="px-4 py-8 text-center text-zinc-500">
                  No hay documentos aquí.
                </td>
              </tr>
            )}
            {!loading &&
              docs.map((d) => (
                <tr key={d.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <DocumentoItemIcon esCarpeta={d.es_carpeta} />
                      {d.es_carpeta ? (
                        <button
                          type="button"
                          className="font-medium text-zinc-900 hover:underline"
                          onClick={() => openFolder(d)}
                        >
                          {d.nombre}
                        </button>
                      ) : (
                        <span className="font-medium">{d.nombre}</span>
                      )}
                      {d.tipo_documento && !d.es_carpeta && (
                        <span className="text-xs text-zinc-500">{d.tipo_documento}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{d.categoria}</td>
                  {!soloCarpetaNegocio && (
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      {d.negocios?.nombre ?? '—'}
                    </span>
                  </td>
                  )}
                  <td className="px-4 py-3">{d.fecha}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {d.onedrive_web_url && (
                        <a
                          href={d.onedrive_web_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-700 hover:underline"
                        >
                          Abrir en OneDrive
                        </a>
                      )}
                      {canImport && connected && (
                        <DeleteIconButton onClick={() => void openDeleteModal(d)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitFolder}
            className="w-full max-w-md space-y-3 rounded-lg bg-white p-6 text-sm shadow-lg"
          >
            <h2 className="text-base font-semibold">Nueva carpeta</h2>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Nombre</span>
              <input
                required
                className="rounded-md border px-3 py-2"
                value={folderForm.nombre}
                onChange={(e) => setFolderForm({ ...folderForm, nombre: e.target.value })}
              />
            </label>
            {!lockedNegocioId && (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Negocio</span>
              <select
                required
                className="rounded-md border px-3 py-2"
                value={folderForm.negocio_id}
                onChange={(e) => setFolderForm({ ...folderForm, negocio_id: e.target.value })}
              >
                {negocios.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="font-medium">Categoría</span>
              <input
                required
                className="rounded-md border px-3 py-2"
                value={folderForm.categoria}
                onChange={(e) => setFolderForm({ ...folderForm, categoria: e.target.value })}
                placeholder="ej. legal, general…"
              />
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
              >
                {busy ? 'Creando…' : 'Crear'}
              </button>
              <button type="button" onClick={() => setShowFolder(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitUpload}
            className="w-full max-w-md space-y-3 rounded-lg bg-white p-6 text-sm shadow-lg"
          >
            <h2 className="text-base font-semibold">Subir archivo</h2>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Archivo</span>
              <input
                required
                type="file"
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, file: e.target.files?.[0] ?? null })
                }
              />
              <span className="text-xs text-zinc-500">Máximo ~4 MB por ahora</span>
            </label>
            {!lockedNegocioId && (
            <label className="flex flex-col gap-1">
              <span className="font-medium">Negocio</span>
              <select
                required
                className="rounded-md border px-3 py-2"
                value={uploadForm.negocio_id}
                onChange={(e) => setUploadForm({ ...uploadForm, negocio_id: e.target.value })}
              >
                {negocios.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="font-medium">Categoría</span>
              <input
                required
                className="rounded-md border px-3 py-2"
                value={uploadForm.categoria}
                onChange={(e) => setUploadForm({ ...uploadForm, categoria: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">Tipo (opcional)</span>
              <input
                className="rounded-md border px-3 py-2"
                value={uploadForm.tipo_documento}
                onChange={(e) => setUploadForm({ ...uploadForm, tipo_documento: e.target.value })}
                placeholder="ej. factura, cotización…"
              />
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={busy || !uploadForm.file}
                className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
              >
                {busy ? 'Subiendo…' : 'Subir'}
              </button>
              <button type="button" onClick={() => setShowUpload(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <EliminarDocumentoModal
        open={deleteTarget !== null}
        preview={deletePreview}
        loading={deletePreviewLoading}
        confirming={deleteConfirming}
        onClose={closeDeleteModal}
        onConfirm={() => void confirmDelete()}
      />
    </div>
    </div>
  )
}
