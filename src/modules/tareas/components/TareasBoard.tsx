'use client'

import Link from 'next/link'
import type { TareaRow } from '../types'
import { ESTADO_LABEL, TAREA_ESTADOS, TIPO_LABEL, type TareaEstado } from '../types'

function Card({ tarea }: { tarea: TareaRow }) {
  return (
    <Link
      href={`/tareas/${tarea.id}`}
      className="block rounded-md border border-zinc-200 bg-white p-3 shadow-sm hover:border-zinc-400"
    >
      <p className="font-medium text-zinc-900">{tarea.titulo}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {TIPO_LABEL[tarea.tipo]}
        {tarea.socios?.nombre ? ` · ${tarea.socios.nombre}` : ' · Sin responsable'}
      </p>
      {tarea.fecha_limite && (
        <p className="mt-1 text-xs text-zinc-600">Límite: {tarea.fecha_limite}</p>
      )}
    </Link>
  )
}

interface Props {
  tareas: TareaRow[]
}

export function TareasBoard({ tareas }: Props) {
  const byEstado = TAREA_ESTADOS.reduce(
    (acc, estado) => {
      acc[estado] = tareas.filter((t) => t.estado === estado)
      return acc
    },
    {} as Record<TareaEstado, TareaRow[]>
  )

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {TAREA_ESTADOS.map((estado) => (
        <section key={estado} className="rounded-lg border border-zinc-200 bg-zinc-100/60 p-3">
          <h3 className="mb-3 text-sm font-semibold text-zinc-800">
            {ESTADO_LABEL[estado]}
            <span className="ml-2 font-normal text-zinc-500">({byEstado[estado].length})</span>
          </h3>
          <div className="space-y-2">
            {byEstado[estado].length === 0 && (
              <p className="text-xs text-zinc-500">Sin ítems</p>
            )}
            {byEstado[estado].map((t) => (
              <Card key={t.id} tarea={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
