'use client'

import { SimpleModal } from '@/components/ui/SimpleModal'
import type { EliminacionPreview } from '../lib/tipos'

interface Props {
  open: boolean
  preview: EliminacionPreview | null
  loading: boolean
  confirming: boolean
  onClose: () => void
  onConfirm: () => void
}

export function EliminarDocumentoModal({
  open,
  preview,
  loading,
  confirming,
  onClose,
  onConfirm,
}: Props) {
  const tieneTareas = (preview?.tareas.length ?? 0) > 0

  return (
    <SimpleModal
      open={open}
      onClose={confirming ? () => {} : onClose}
      title={preview?.es_carpeta ? 'Eliminar carpeta' : 'Eliminar documento'}
      className="max-w-lg"
    >
      {loading && (
        <p className="text-sm text-[var(--cmd-text-muted)]">Preparando eliminación…</p>
      )}

      {!loading && preview && (
        <div className="space-y-4 text-sm text-[var(--cmd-text-muted)]">
          {preview.es_carpeta ? (
            <p>
              Se eliminará la carpeta <strong className="text-[var(--cmd-text)]">{preview.nombre}</strong>{' '}
              y todo su contenido:{' '}
              <strong className="text-[var(--cmd-text)]">
                {preview.total_archivos} archivo{preview.total_archivos === 1 ? '' : 's'}
              </strong>
              {preview.total_carpetas > 1 && (
                <>
                  {' '}
                  y{' '}
                  <strong className="text-[var(--cmd-text)]">
                    {preview.total_carpetas - 1} subcarpeta
                    {preview.total_carpetas - 1 === 1 ? '' : 's'}
                  </strong>
                </>
              )}
              . Esta acción no se puede deshacer.
            </p>
          ) : tieneTareas ? (
            <p>
              Este documento está adjunto en {preview.tareas.length} tarea
              {preview.tareas.length === 1 ? '' : 's'}. Si continúas, se eliminará el documento y
              quedará registrado en el historial de esas tareas.
            </p>
          ) : (
            <p>
              ¿Eliminar <strong className="text-[var(--cmd-text)]">{preview.nombre}</strong>? Esta
              acción no se puede deshacer.
            </p>
          )}

          {preview.es_carpeta && tieneTareas && (
            <p>
              Algunos archivos dentro de esta carpeta están adjuntos en {preview.tareas.length}{' '}
              tarea{preview.tareas.length === 1 ? '' : 's'}. Si continúas, se eliminará todo el
              contenido y quedará registrado en el historial de esas tareas.
            </p>
          )}

          {tieneTareas && (
            <ul className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-panel-hover)]/40 p-3">
              {preview.tareas.map((t) => (
                <li key={t.id} className="text-[var(--cmd-text)]">
                  <span className="font-medium">{t.titulo}</span>
                  <span className="text-[var(--cmd-text-dim)]"> · {t.negocio_nombre}</span>
                  {t.documentos_nombres.length > 0 && (
                    <span className="block text-xs text-[var(--cmd-text-muted)]">
                      {t.documentos_nombres.join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={confirming}
              onClick={onConfirm}
              className="rounded-md bg-[var(--cmd-decline)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {confirming ? 'Eliminando…' : 'Confirmar eliminación'}
            </button>
            <button
              type="button"
              disabled={confirming}
              onClick={onClose}
              className="rounded-md border border-[var(--cmd-border)] px-4 py-2 text-sm text-[var(--cmd-text)] disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </SimpleModal>
  )
}
