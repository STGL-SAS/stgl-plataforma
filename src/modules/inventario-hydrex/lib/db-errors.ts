export type UniqueErrorContext =
  | {
      entity: 'insumo'
      labelAtributo1: string
      labelAtributo2?: string | null
    }
  | { entity: 'tipo_insumo' }
  | { entity: 'generic'; hint?: string }

interface DbErrorLike {
  code?: string
  message?: string
  details?: string
}

function isUniqueViolation(error: DbErrorLike): boolean {
  return error.code === '23505'
}

function inferContextFromMessage(error: DbErrorLike): UniqueErrorContext | undefined {
  const text = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
  if (text.includes('hydrex_insumos') || text.includes('tipo_insumo_id_atributo')) {
    return { entity: 'insumo', labelAtributo1: 'tipo', labelAtributo2: 'talla' }
  }
  if (text.includes('hydrex_tipos_insumo') || text.includes('codigo')) {
    return { entity: 'tipo_insumo' }
  }
  return undefined
}

export function friendlyDbError(error: unknown, context?: UniqueErrorContext): string {
  const e = (error ?? {}) as DbErrorLike

  if (isUniqueViolation(e)) {
    const ctx = context ?? inferContextFromMessage(e)

    if (ctx?.entity === 'insumo') {
      const attr2Part = ctx.labelAtributo2 ? ` y ${ctx.labelAtributo2}` : ''
      return `Ya existe un insumo con esta misma combinación de categoría, ${ctx.labelAtributo1}${attr2Part} — revisa el catálogo o edita el existente.`
    }

    if (ctx?.entity === 'tipo_insumo') {
      return 'Ya existe una categoría de insumo con ese código — elige otro identificador (slug).'
    }

    if (ctx?.entity === 'generic' && ctx.hint) {
      return ctx.hint
    }

    return 'Ya existe un registro con estos mismos datos — revisa el listado o edita el existente.'
  }

  if (error instanceof Error && error.message) return error.message
  if (e.message) return e.message
  return 'Error al guardar'
}

export function throwFriendlyDbError(error: unknown, context?: UniqueErrorContext): never {
  throw new Error(friendlyDbError(error, context))
}
