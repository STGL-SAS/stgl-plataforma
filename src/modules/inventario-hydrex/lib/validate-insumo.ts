import type { HydrexTipoInsumo } from './tipos'

export interface InsumoFieldErrors {
  nombre?: string
  atributo_1?: string
  atributo_2?: string
}

export function validateInsumoFields(
  values: {
    nombre?: string
    atributo_1?: string
    atributo_2?: string | null
  },
  tipo?: Pick<HydrexTipoInsumo, 'label_atributo_1' | 'label_atributo_2' | 'requiere_atributo_2'>
): InsumoFieldErrors {
  const errors: InsumoFieldErrors = {}

  if (!values.nombre?.trim()) {
    errors.nombre = 'El nombre es obligatorio.'
  }

  if (!values.atributo_1?.trim()) {
    const label = tipo?.label_atributo_1 ?? 'Atributo 1'
    errors.atributo_1 = `El campo ${label} es obligatorio.`
  }

  if (tipo?.requiere_atributo_2 && !values.atributo_2?.trim()) {
    const label = tipo.label_atributo_2 ?? 'Atributo 2'
    errors.atributo_2 = `La ${label.toLowerCase()} es obligatoria para esta categoría.`
  }

  return errors
}

export function hasFieldErrors(errors: InsumoFieldErrors): boolean {
  return Object.keys(errors).length > 0
}

export function normalizeInsumoPayload(
  values: {
    nombre?: string
    atributo_1?: string
    atributo_2?: string | null
  },
  tipo?: Pick<HydrexTipoInsumo, 'requiere_atributo_2' | 'usa_costo_arte'>
) {
  return {
    nombre: values.nombre?.trim() ?? '',
    atributo_1: values.atributo_1?.trim() ?? '',
    atributo_2: tipo?.requiere_atributo_2 ? values.atributo_2?.trim() ?? '' : null,
  }
}
