import Link from 'next/link'
import { CommandPanel } from '@/components/layout/ModuleShell'
import { formatCOP } from '@/modules/contabilidad/utils'
import { DocumentoItemIcon } from '@/modules/documentos/components/DocumentoItemIcon'
import { ESTADO_LABEL } from '@/modules/tareas/types'
import { BalanceNegocio } from './BalanceNegocio'
import type { ResumenNegocioData } from '../lib/resumen-data'

function SeccionHeader({ titulo, href }: { titulo: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-[var(--cmd-text)]">{titulo}</h2>
      <Link href={href} className="text-xs text-[var(--cmd-text-muted)] hover:text-[var(--cmd-text)]">
        Ver todo →
      </Link>
    </div>
  )
}

export function ResumenNegocio({
  negocioId,
  baseHref,
  data,
  showTareas = true,
  showBalance = true,
  sectionLinks,
}: {
  negocioId: string
  baseHref: string
  data: ResumenNegocioData
  showTareas?: boolean
  showBalance?: boolean
  sectionLinks?: {
    gastos?: string
    tareas?: string
    documentos?: string
  }
}) {
  const { gastosFijos, gastosOcasionales, tareasAbiertas, documentos } = data
  const gastosHref = sectionLinks?.gastos ?? `${baseHref}/gastos`
  const tareasHref = sectionLinks?.tareas ?? `${baseHref}/tareas`
  const documentosHref = sectionLinks?.documentos ?? `${baseHref}/documentos`

  return (
    <div className="space-y-5">
      {showBalance && <BalanceNegocio negocioId={negocioId} compact />}

      <CommandPanel>
        <SeccionHeader titulo="Gastos" href={gastosHref} />
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--cmd-text-muted)]">
              Fijos ({data.gastosFijosTotal})
            </p>
            {gastosFijos.length === 0 ? (
              <p className="text-sm text-[var(--cmd-text-dim)]">Sin gastos fijos registrados.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {gastosFijos.map((g) => (
                  <li key={g.id} className="flex justify-between gap-2">
                    <span className="truncate text-[var(--cmd-text)]">{g.concepto}</span>
                    <span className="shrink-0 text-[var(--cmd-text-muted)]">
                      {formatCOP(g.monto)} · {g.periodicidad}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--cmd-text-muted)]">
              Ocasionales ({data.gastosOcasionalesTotal})
            </p>
            {gastosOcasionales.length === 0 ? (
              <p className="text-sm text-[var(--cmd-text-dim)]">Sin gastos ocasionales.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {gastosOcasionales.map((g) => (
                  <li key={g.id} className="flex justify-between gap-2">
                    <span className="truncate text-[var(--cmd-text)]">{g.concepto}</span>
                    <span className="shrink-0 text-[var(--cmd-text-muted)]">
                      {formatCOP(g.monto)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CommandPanel>

      {showTareas && (
        <CommandPanel>
          <SeccionHeader titulo="Tareas abiertas" href={tareasHref} />
          {tareasAbiertas.length === 0 ? (
            <p className="text-sm text-[var(--cmd-text-dim)]">
              {data.tareasAbiertasTotal === 0
                ? 'Sin tareas pendientes, en curso o en espera.'
                : null}
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {tareasAbiertas.map((t) => (
                <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/tareas/${t.id}`}
                    className="font-medium text-[var(--cmd-text)] hover:underline"
                  >
                    {t.titulo}
                  </Link>
                  <span className="text-xs text-[var(--cmd-text-muted)]">
                    {ESTADO_LABEL[t.estado as keyof typeof ESTADO_LABEL] ?? t.estado}
                    {t.fecha_limite ? ` · ${t.fecha_limite}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {data.tareasAbiertasTotal > tareasAbiertas.length && (
            <p className="mt-2 text-xs text-[var(--cmd-text-dim)]">
              +{data.tareasAbiertasTotal - tareasAbiertas.length} más en la pestaña Tareas
            </p>
          )}
        </CommandPanel>
      )}

      <CommandPanel>
        <SeccionHeader titulo="Documentos" href={documentosHref} />
        {documentos.length === 0 ? (
          <p className="text-sm text-[var(--cmd-text-dim)]">Sin documentos en este negocio.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {documentos.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <DocumentoItemIcon esCarpeta={d.es_carpeta} />
                  {d.onedrive_web_url && !d.es_carpeta ? (
                    <a
                      href={d.onedrive_web_url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-medium text-[var(--cmd-text)] hover:underline"
                    >
                      {d.nombre}
                    </a>
                  ) : (
                    <span className="truncate font-medium text-[var(--cmd-text)]">{d.nombre}</span>
                  )}
                </span>
                <span className="text-xs capitalize text-[var(--cmd-text-muted)]">{d.categoria}</span>
              </li>
            ))}
          </ul>
        )}
        {data.documentosTotal > documentos.length && (
          <p className="mt-2 text-xs text-[var(--cmd-text-dim)]">
            {data.documentosTotal} documentos en total
          </p>
        )}
      </CommandPanel>
    </div>
  )
}
