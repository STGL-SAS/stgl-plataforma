'use client'

import Link from 'next/link'
import type { TareaRow } from '../types'
import { ESTADO_LABEL, TIPO_LABEL } from '../types'

interface Props {
  tareas: TareaRow[]
}

export function TareasList({ tareas }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-zinc-50 text-left text-zinc-600">
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
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                No hay tareas para este filtro.
              </td>
            </tr>
          )}
          {tareas.map((t) => (
            <tr key={t.id} className="border-b border-zinc-100 hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link href={`/tareas/${t.id}`} className="font-medium hover:underline">
                  {t.titulo}
                </Link>
              </td>
              <td className="px-4 py-3">{TIPO_LABEL[t.tipo]}</td>
              <td className="px-4 py-3">{ESTADO_LABEL[t.estado]}</td>
              <td className="px-4 py-3">{t.socios?.nombre ?? '—'}</td>
              <td className="px-4 py-3">{t.fecha_limite ?? '—'}</td>
              <td className="px-4 py-3">{t.negocios?.nombre ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
