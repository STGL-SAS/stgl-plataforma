'use client'

import Link from 'next/link'
import type { TareaRow } from '../types'
import { ESTADO_LABEL, TAREA_ESTADOS, TIPO_LABEL, type TareaEstado } from '../types'

function Card({ tarea }: { tarea: TareaRow }) {
  return (
    <Link
      href={`/tareas/${tarea.id}`}
      className="block rounded-md border border-[var(--cmd-border)] bg-[var(--cmd-bg)] p-3 transition-colors hover:border-[var(--cmd-text-dim)]"
    >
      <p className="font-medium text-[var(--cmd-text)]">{tarea.titulo}</p>
      <p className="mt-1 text-xs text-[var(--cmd-text-muted)]">
        {TIPO_LABEL[tarea.tipo]}
        {tarea.socios?.nombre ? ` · ${tarea.socios.nombre}` : ' · Sin responsable'}
      </p>
      {tarea.fecha_limite && (
        <p className="mt-1 text-xs text-[var(--cmd-text-dim)]">Límite: {tarea.fecha_limite}</p>
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
        <section
          key={estado}
          className="rounded-lg border border-[var(--cmd-border)] bg-[var(--cmd-panel)] p-3"
        >
          <h3 className="mb-3 text-sm font-semibold text-[var(--cmd-text)]">
            {ESTADO_LABEL[estado]}
            <span className="ml-2 font-normal text-[var(--cmd-text-muted)]">
              ({byEstado[estado].length})
            </span>
          </h3>
          <div className="space-y-2">
            {byEstado[estado].length === 0 && (
              <p className="text-xs text-[var(--cmd-text-dim)]">Sin ítems</p>
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
