'use client'

import { useMemo, useState } from 'react'
import { deleteInsumo } from '../actions/deletes'
import type { HydrexInsumo, HydrexTipoInsumo } from '../lib/tipos'
import { formatCostoDisplay } from '../lib/motor-calculo'
import { ConfirmDialog } from './ConfirmDialog'
import { InsumoForm } from './InsumoForm'
import { RowActions } from './RowActions'

interface Props {
  insumos: HydrexInsumo[]
  tipos: HydrexTipoInsumo[]
  onRefresh: () => void
}

export function CatalogoInsumos({ insumos, tipos, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<HydrexInsumo | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; nombre: string } | null>(null)
  const [confirming, setConfirming] = useState(false)

  const tiposActivos = useMemo(
    () => [...tipos].filter((t) => t.activo).sort((a, b) => a.orden - b.orden),
    [tipos]
  )

  const tiposVisibles = useMemo(
    () => [...tipos].sort((a, b) => a.orden - b.orden),
    [tipos]
  )

  async function handleDelete() {
    if (!confirm) return
    setConfirming(true)
    try {
      await deleteInsumo(confirm.id, confirm.nombre)
      setConfirm(null)
      onRefresh()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => {
          setEditing(null)
          setShowForm(true)
        }}
        disabled={tiposActivos.length === 0}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        + Nuevo insumo
      </button>

      {showForm && (
        <InsumoForm
          tipos={tipos}
          initial={editing ?? undefined}
          onSaved={async () => {
            setShowForm(false)
            setEditing(null)
            onRefresh()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
        />
      )}

      {tiposVisibles.map((tipo) => {
        const rows = insumos.filter((i) => i.tipo_insumo_id === tipo.id)
        if (!tipo.activo && rows.length === 0) return null
        return (
          <div key={tipo.id}>
            <h3 className="mb-2 text-base font-semibold text-zinc-900">
              {tipo.nombre}
              {!tipo.activo && <span className="ml-2 text-xs font-normal text-zinc-500">(inactivo)</span>}
            </h3>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2.5 text-left">Nombre</th>
                    <th className="px-3 py-2.5 text-left">{tipo.label_atributo_1}</th>
                    {tipo.requiere_atributo_2 && (
                      <th className="px-3 py-2.5 text-left">{tipo.label_atributo_2 ?? 'Atributo 2'}</th>
                    )}
                    <th className="px-3 py-2.5 text-right">Costo/u</th>
                    {tipo.usa_costo_arte && <th className="px-3 py-2.5 text-right">Costo arte</th>}
                    <th className="px-3 py-2.5 text-center">Estado</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          (tipo.requiere_atributo_2 ? 1 : 0) +
                          (tipo.usa_costo_arte ? 1 : 0) +
                          5
                        }
                        className="px-3 py-4 text-center text-zinc-500"
                      >
                        Sin insumos en esta categoría
                      </td>
                    </tr>
                  ) : (
                    rows.map((i) => (
                      <tr key={i.id} className={!i.activo ? 'opacity-60' : undefined}>
                        <td className="px-3 py-2.5 font-medium">{i.nombre}</td>
                        <td className="px-3 py-2.5">{i.atributo_1}</td>
                        {tipo.requiere_atributo_2 && (
                          <td className="px-3 py-2.5">{i.atributo_2 ?? '—'}</td>
                        )}
                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-600">
                          {formatCostoDisplay(i.costo_unitario)}
                        </td>
                        {tipo.usa_costo_arte && (
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {i.costo_arte != null ? formatCostoDisplay(i.costo_arte) : '—'}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-center text-xs">
                          {i.activo ? 'Activo' : 'Inactivo'}
                        </td>
                        <td className="px-3 py-2.5">
                          <RowActions
                            onEdit={() => {
                              setEditing(i)
                              setShowForm(true)
                            }}
                            onDelete={() => setConfirm({ id: i.id, nombre: i.nombre })}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Eliminar insumo"
        message={
          confirm
            ? `¿Seguro que quieres eliminar "${confirm.nombre}"? Si tiene compras o movimientos se desactivará para conservar el historial.`
            : ''
        }
        confirming={confirming}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
