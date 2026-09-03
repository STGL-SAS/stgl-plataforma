'use client'

import Link from 'next/link'
import type { TareaRow } from '../types'
import { ESTADO_LABEL, TIPO_LABEL } from '../types'

interface Props {
  tareas: TareaRow[]
}

export function TareasList({ tareas }: Props) {
  return (
    <div className="cmd-panel overflow-x-auto">
      <table className="cmd-table min-w-full text-sm">
        <thead className="text-left">
          <tr>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Responsable</th>
            <th className="px-4 py-3">Fecha límite</th>
            <th className="px-4 py-3">Negocio</th>
          </tr>
        </thead>
        <tbody>
          {tareas.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-[var(--cmd-text-dim)]">
                No hay tareas para este filtro.
              </td>
            </tr>
          )}
          {tareas.map((t) => (
            <tr key={t.id} className="hover:bg-[var(--cmd-panel-hover)]">
              <td className="px-4 py-3">
                <Link
                  href={`/tareas/${t.id}`}
                  className="font-medium text-[var(--cmd-text)] hover:underline"
                >
                  {t.titulo}
                </Link>
              </td>
              <td className="px-4 py-3 text-[var(--cmd-text-muted)]">{TIPO_LABEL[t.tipo]}</td>
              <td className="px-4 py-3 text-[var(--cmd-text-muted)]">{ESTADO_LABEL[t.estado]}</td>
              <td className="px-4 py-3 text-[var(--cmd-text-muted)]">{t.socios?.nombre ?? '—'}</td>
              <td className="px-4 py-3 text-[var(--cmd-text-muted)]">{t.fecha_limite ?? '—'}</td>
              <td className="px-4 py-3 text-[var(--cmd-text-muted)]">{t.negocios?.nombre ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
