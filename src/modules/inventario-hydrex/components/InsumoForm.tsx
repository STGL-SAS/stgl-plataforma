'use client'

import { useMemo, useState } from 'react'
import { upsertInsumo } from '../actions/mutations'
import { CurrencyInput } from './CurrencyInput'
import { friendlyDbError } from '../lib/db-errors'
import type { HydrexInsumo, HydrexTipoInsumo } from '../lib/tipos'
import {
  hasFieldErrors,
  normalizeInsumoPayload,
  validateInsumoFields,
  type InsumoFieldErrors,
} from '../lib/validate-insumo'

export type InsumoFormValues = Partial<HydrexInsumo> & { tipo_insumo_id?: string }

interface Props {
  tipos: HydrexTipoInsumo[]
  initial?: InsumoFormValues
  onSaved: (insumo: HydrexInsumo) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
  className?: string
}

function fieldClass(hasError: boolean) {
  return `rounded-md border px-3 py-2 ${hasError ? 'border-red-500 bg-red-50/40' : 'border-zinc-300'}`
}

export function InsumoForm({
  tipos,
  initial,
  onSaved,
  onCancel,
  submitLabel = 'Guardar',
  className = '',
}: Props) {
  const tiposActivos = useMemo(
    () => [...tipos].filter((t) => t.activo).sort((a, b) => a.orden - b.orden),
    [tipos]
  )
  const tipoById = useMemo(() => new Map(tipos.map((t) => [t.id, t])), [tipos])

  const [values, setValues] = useState<InsumoFormValues>(() => {
    if (initial) return { ...initial }
    const first = tiposActivos[0]
    return {
      tipo_insumo_id: first?.id ?? '',
      nombre: '',
      atributo_1: '',
      atributo_2: first?.requiere_atributo_2 ? '' : null,
      costo_arte: null,
      unidad_medida: 'unidad',
      activo: true,
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<InsumoFieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof InsumoFieldErrors, boolean>>>({})

  const tipo = values.tipo_insumo_id ? tipoById.get(values.tipo_insumo_id) : undefined

  function validate(): InsumoFieldErrors {
    const errors = validateInsumoFields(values, tipo)
    setFieldErrors(errors)
    setTouched({ nombre: true, atributo_1: true, atributo_2: true })
    return errors
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!values.tipo_insumo_id || !tipo) return

    const errors = validate()
    if (hasFieldErrors(errors)) return

    setLoading(true)
    setError(null)
    try {
      const normalized = normalizeInsumoPayload(values, tipo)
      const payload: InsumoFormValues = {
        ...values,
        ...normalized,
      }
      if (!tipo.usa_costo_arte) payload.costo_arte = null
      delete payload.costo_unitario
      delete payload.tipo

      const saved = await upsertInsumo(payload)
      await onSaved(saved)
    } catch (err) {
      setError(
        friendlyDbError(err, {
          entity: 'insumo',
          labelAtributo1: tipo.label_atributo_1,
          labelAtributo2: tipo.label_atributo_2,
        })
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={save}
      noValidate
      className={`rounded-lg border border-zinc-200 bg-white p-4 grid gap-3 sm:grid-cols-2 ${className}`}
    >
      {error && (
        <p className="sm:col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-zinc-900">Categoría</span>
        <select
          value={values.tipo_insumo_id ?? ''}
          onChange={(e) => {
            const nextTipo = tipoById.get(e.target.value)
            setValues({
              ...values,
              tipo_insumo_id: e.target.value,
              atributo_2: nextTipo?.requiere_atributo_2 ? (values.atributo_2 ?? '') : null,
              costo_arte: nextTipo?.usa_costo_arte ? values.costo_arte : null,
            })
            setFieldErrors({})
            setTouched({})
          }}
          className="rounded-md border border-zinc-300 px-3 py-2"
          required
        >
          {tiposActivos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-zinc-900">Nombre</span>
        <input
          value={values.nombre ?? ''}
          onChange={(e) => {
            setValues({ ...values, nombre: e.target.value })
            if (touched.nombre) setFieldErrors(validateInsumoFields({ ...values, nombre: e.target.value }, tipo))
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, nombre: true }))
            setFieldErrors(validateInsumoFields(values, tipo))
          }}
          className={fieldClass(Boolean(touched.nombre && fieldErrors.nombre))}
        />
        {touched.nombre && fieldErrors.nombre && (
          <span className="text-xs text-red-600">{fieldErrors.nombre}</span>
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-900">{tipo?.label_atributo_1 ?? 'Atributo 1'}</span>
        <input
          value={values.atributo_1 ?? ''}
          onChange={(e) => {
            setValues({ ...values, atributo_1: e.target.value })
            if (touched.atributo_1) {
              setFieldErrors(validateInsumoFields({ ...values, atributo_1: e.target.value }, tipo))
            }
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, atributo_1: true }))
            setFieldErrors(validateInsumoFields(values, tipo))
          }}
          className={fieldClass(Boolean(touched.atributo_1 && fieldErrors.atributo_1))}
        />
        {touched.atributo_1 && fieldErrors.atributo_1 && (
          <span className="text-xs text-red-600">{fieldErrors.atributo_1}</span>
        )}
      </label>

      {tipo?.requiere_atributo_2 && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-900">{tipo.label_atributo_2 ?? 'Atributo 2'}</span>
          <input
            value={values.atributo_2 ?? ''}
            onChange={(e) => {
              setValues({ ...values, atributo_2: e.target.value })
              if (touched.atributo_2) {
                setFieldErrors(validateInsumoFields({ ...values, atributo_2: e.target.value }, tipo))
              }
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, atributo_2: true }))
              setFieldErrors(validateInsumoFields(values, tipo))
            }}
            className={fieldClass(Boolean(touched.atributo_2 && fieldErrors.atributo_2))}
          />
          {touched.atributo_2 && fieldErrors.atributo_2 && (
            <span className="text-xs text-red-600">{fieldErrors.atributo_2}</span>
          )}
        </label>
      )}

      {tipo?.usa_costo_arte && (
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-zinc-900">Costo de arte (único, no prorrateado)</span>
          <CurrencyInput
            value={values.costo_arte}
            onChange={(costo_arte) => setValues({ ...values, costo_arte })}
          />
        </label>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={loading || tiposActivos.length === 0}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? 'Guardando…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border px-4 py-2 text-sm">
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function createEmptyInsumoValues(tipos: HydrexTipoInsumo[]): InsumoFormValues {
  const first = [...tipos].filter((t) => t.activo).sort((a, b) => a.orden - b.orden)[0]
  return {
    tipo_insumo_id: first?.id ?? '',
    nombre: '',
    atributo_1: '',
    atributo_2: first?.requiere_atributo_2 ? '' : null,
    costo_arte: null,
    unidad_medida: 'unidad',
    activo: true,
  }
}
