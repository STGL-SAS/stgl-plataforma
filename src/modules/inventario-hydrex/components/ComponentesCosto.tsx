'use client'

import { useState } from 'react'
import { deleteComponente, deleteEnvioTarifa } from '../actions/deletes'
import { upsertComponente, upsertEnvioTarifa, toggleComponenteActivo } from '../actions/mutations'
import type { Canal, ComponenteCosto } from '../lib/tipos'
import { descuentoFractionToPctUi } from '../lib/descuento-pct'
import { formatCOP } from '../lib/motor-calculo'
import {
  CanalChips,
  CanalToggleButtons,
  canalesAplicaFromDb,
  canalesAplicaToDb,
} from './CanalToggleButtons'
import { ConfirmDialog } from './ConfirmDialog'
import { CurrencyInput } from './CurrencyInput'
import { NumberInput } from '@/components/NumberInput'
import { RowActions } from './RowActions'

interface EnvioTarifa {
  id: string
  nombre: string
  valor_referencia: number
  activo: boolean
  orden: number
}

interface ComponenteRow extends ComponenteCosto {
  activo?: boolean
}

interface ComponenteEditState {
  id?: string
  nombre: string
  tipo_calculo: string
  valor: number
  valor_pct_ui: number | null
  categoria: string
  canales_aplica: string[]
  premarcado_canales: string[]
  activo: boolean
  orden: number
  prorratea_por_lote: boolean
}

interface Props {
  componentes: ComponenteRow[]
  envioTarifas: EnvioTarifa[]
  onRefresh: () => void
}

function formatComponenteValor(c: ComponenteRow): string {
  if (c.tipo_calculo === 'porcentaje') {
    return `${descuentoFractionToPctUi(c.valor)}%`
  }
  return formatCOP(c.valor)
}

function emptyComponente(): ComponenteEditState {
  return {
    nombre: '',
    tipo_calculo: 'porcentaje',
    valor: 0,
    valor_pct_ui: null,
    categoria: '',
    canales_aplica: [],
    premarcado_canales: [],
    activo: true,
    orden: 99,
    prorratea_por_lote: false,
  }
}

function toEditState(c: ComponenteRow): ComponenteEditState {
  return {
    id: c.id,
    nombre: c.nombre,
    tipo_calculo: c.tipo_calculo,
    valor: c.tipo_calculo === 'porcentaje' ? 0 : c.valor,
    valor_pct_ui: c.tipo_calculo === 'porcentaje' ? descuentoFractionToPctUi(c.valor) : null,
    categoria: (c as ComponenteEditState & { categoria?: string }).categoria ?? '',
    canales_aplica: c.canales_aplica ?? [],
    premarcado_canales: c.premarcado_canales ?? [],
    activo: c.activo ?? true,
    orden: (c as ComponenteEditState).orden ?? 99,
    prorratea_por_lote: c.prorratea_por_lote ?? false,
  }
}

export function ComponentesCosto({ componentes, envioTarifas, onRefresh }: Props) {
  const [editComp, setEditComp] = useState<ComponenteEditState | null>(null)
  const [editTarifa, setEditTarifa] = useState<Record<string, unknown> | null>(null)
  const [confirm, setConfirm] = useState<
    { type: 'componente' | 'tarifa'; id: string; nombre: string } | null
  >(null)
  const [confirming, setConfirming] = useState(false)
  const [togglingActivoId, setTogglingActivoId] = useState<string | null>(null)

  const canalesAplicaUi = editComp ? canalesAplicaFromDb(editComp.canales_aplica) : []
  const premarcadoUi = (editComp?.premarcado_canales ?? []) as Canal[]

  function setCanalesAplica(selected: Canal[]) {
    if (!editComp) return
    const aplicaDb = canalesAplicaToDb(selected)
    const premarcado = editComp.premarcado_canales.filter((c) => selected.includes(c as Canal))
    setEditComp({ ...editComp, canales_aplica: aplicaDb, premarcado_canales: premarcado })
  }

  function setPremarcadoCanales(selected: Canal[]) {
    if (!editComp) return
    setEditComp({ ...editComp, premarcado_canales: selected })
  }

  async function handleToggleActivo(c: ComponenteRow, activo: boolean) {
    setTogglingActivoId(c.id)
    try {
      await toggleComponenteActivo(c.id, activo)
      onRefresh()
    } finally {
      setTogglingActivoId(null)
    }
  }

  async function saveComp(e: React.FormEvent) {
    e.preventDefault()
    if (!editComp) return
    await upsertComponente(editComp)
    setEditComp(null)
    onRefresh()
  }

  async function saveTarifa(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarifa) return
    await upsertEnvioTarifa(editTarifa)
    setEditTarifa(null)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm) return
    setConfirming(true)
    try {
      if (confirm.type === 'componente') {
        await deleteComponente(confirm.id, confirm.nombre)
      } else {
        await deleteEnvioTarifa(confirm.id, confirm.nombre)
      }
      setConfirm(null)
      onRefresh()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex justify-between items-center">
          <h3 className="text-base font-semibold text-zinc-900">Componentes de costo</h3>
          <button
            type="button"
            onClick={() => setEditComp(emptyComponente())}
            className="text-sm text-blue-600"
          >
            + componente
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2.5 text-left">Nombre</th>
                <th className="px-3 py-2.5 text-left">Tipo</th>
                <th className="px-3 py-2.5 text-right">Valor</th>
                <th className="px-3 py-2.5 text-left">Premarcado</th>
                <th className="px-3 py-2.5 text-center">Estado</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {componentes.map((c) => (
                <tr key={c.id} className={c.activo === false ? 'opacity-60' : undefined}>
                  <td className="px-3 py-2.5 font-medium">{c.nombre}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{c.tipo_calculo}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatComponenteValor(c)}</td>
                  <td className="px-3 py-2.5">
                    <CanalChips canales={c.premarcado_canales} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={c.activo !== false}
                      disabled={togglingActivoId === c.id}
                      onChange={(e) => handleToggleActivo(c, e.target.checked)}
                      aria-label={c.activo !== false ? `Desactivar ${c.nombre}` : `Activar ${c.nombre}`}
                      title={c.activo !== false ? 'Activo' : 'Inactivo'}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <RowActions
                      onEdit={() => setEditComp(toEditState(c))}
                      onDelete={() => setConfirm({ type: 'componente', id: c.id, nombre: c.nombre })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editComp && (
        <form onSubmit={saveComp} className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Nombre</span>
            <input
              value={editComp.nombre}
              onChange={(e) => setEditComp({ ...editComp, nombre: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Tipo de cálculo</span>
            <select
              value={editComp.tipo_calculo}
              onChange={(e) => {
                const tipo = e.target.value
                setEditComp({
                  ...editComp,
                  tipo_calculo: tipo,
                  ...(tipo === 'porcentaje'
                    ? { valor_pct_ui: editComp.valor_pct_ui ?? 0 }
                    : { valor: editComp.valor || 0 }),
                })
              }}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="porcentaje">Porcentaje</option>
              <option value="valor_fijo">Valor fijo</option>
              <option value="valor_por_unidad">Valor por unidad</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">
              {editComp.tipo_calculo === 'porcentaje' ? 'Porcentaje (%)' : 'Valor'}
            </span>
            {editComp.tipo_calculo === 'porcentaje' ? (
              <NumberInput
                value={editComp.valor_pct_ui}
                onChange={(valor_pct_ui) => setEditComp({ ...editComp, valor_pct_ui })}
                className="text-sm"
              />
            ) : (
              <CurrencyInput
                value={editComp.valor}
                onChange={(valor) => setEditComp({ ...editComp, valor: valor ?? 0 })}
                className="text-sm"
              />
            )}
            {editComp.tipo_calculo === 'porcentaje' && (
              <span className="text-xs text-zinc-500">Ej.: 15 = 15%</span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Categoría</span>
            <input
              value={editComp.categoria}
              onChange={(e) => setEditComp({ ...editComp, categoria: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </label>

          <CanalToggleButtons
            label="Canales donde aplica"
            selected={canalesAplicaUi}
            onChange={setCanalesAplica}
            minSelected={1}
          />

          <CanalToggleButtons
            label="Premarcado por defecto en"
            selected={premarcadoUi.filter((c) => canalesAplicaUi.includes(c))}
            onChange={setPremarcadoCanales}
            visibleCanales={canalesAplicaUi}
          />

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={editComp.prorratea_por_lote}
              onChange={(e) =>
                setEditComp({ ...editComp, prorratea_por_lote: e.target.checked })
              }
            />
            <span>Prorratear por unidades del lote</span>
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditComp(null)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section>
        <div className="mb-3 flex justify-between items-center">
          <h3 className="text-base font-semibold text-zinc-900">Tarifas de envío (referencia)</h3>
          <button
            type="button"
            onClick={() =>
              setEditTarifa({ nombre: '', valor_referencia: null, activo: true, orden: 99 })
            }
            className="text-sm text-blue-600"
          >
            + tarifa
          </button>
        </div>
        <ul className="rounded-lg border border-zinc-200 bg-white divide-y divide-zinc-200 text-sm shadow-sm">
          {envioTarifas.map((t) => (
            <li
              key={t.id}
              className={`flex justify-between items-center px-4 py-2.5 ${!t.activo ? 'opacity-60' : ''}`}
            >
              <span className="font-medium">{t.nombre}</span>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-zinc-700">
                  {t.valor_referencia.toLocaleString('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  })}
                </span>
                <RowActions
                  onEdit={() => setEditTarifa(t as unknown as Record<string, unknown>)}
                  onDelete={() => setConfirm({ type: 'tarifa', id: t.id, nombre: t.nombre })}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {editTarifa && (
        <form onSubmit={saveTarifa} className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Nombre</span>
            <input
              value={String(editTarifa.nombre ?? '')}
              onChange={(e) => setEditTarifa({ ...editTarifa, nombre: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Valor de referencia</span>
            <CurrencyInput
              value={
                editTarifa.valor_referencia != null ? Number(editTarifa.valor_referencia) : null
              }
              onChange={(valor_referencia) =>
                setEditTarifa({ ...editTarifa, valor_referencia: valor_referencia ?? 0 })
              }
              className="text-sm"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditTarifa(null)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === 'tarifa' ? 'Eliminar tarifa' : 'Eliminar componente'}
        message={
          confirm
            ? confirm.type === 'componente'
              ? `¿Seguro que quieres eliminar "${confirm.nombre}"? Las ventas ya registradas conservan su snapshot de componentes; solo afecta cálculos nuevos.`
              : `¿Seguro que quieres desactivar la tarifa "${confirm.nombre}"?`
            : ''
        }
        confirming={confirming}
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
