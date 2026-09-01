'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { throwFriendlyDbError } from '../lib/db-errors'
import type { ComponenteAplicado, HydrexInsumo, HydrexTipoInsumo, HydrexVentaInput } from '../lib/tipos'
import { getHydrexNegocioId } from '../lib/queries'
import { normalizeInsumoPayload, validateInsumoFields, hasFieldErrors } from '../lib/validate-insumo'
import { validarTipoPrecioParaProducto } from '../lib/validate-tipo-precio'
import { descuentoPctUiToFraction } from '../lib/descuento-pct'

export async function upsertTipoInsumo(
  input: Partial<{
    id: string
    codigo: string
    nombre: string
    label_atributo_1: string
    label_atributo_2: string | null
    requiere_atributo_2: boolean
    usa_costo_arte: boolean
    activo: boolean
    orden: number
  }>
) {
  const supabase = createAdminClient()
  if (input.id) {
    const { codigo: _codigo, ...update } = input
    const { error } = await supabase.from('hydrex_tipos_insumo').update(update).eq('id', input.id)
    if (error) throwFriendlyDbError(error, { entity: 'tipo_insumo' })
  } else {
    const { error } = await supabase.from('hydrex_tipos_insumo').insert(input)
    if (error) throwFriendlyDbError(error, { entity: 'tipo_insumo' })
  }
}

export async function upsertInsumo(
  input: Partial<{
    id: string
    tipo_insumo_id: string
    nombre: string
    atributo_1: string
    atributo_2: string | null
    costo_arte: number | null
    unidad_medida: string
    activo: boolean
  }>
) {
  const supabase = createAdminClient()

  if (!input.tipo_insumo_id) {
    throw new Error('Debes seleccionar una categoría.')
  }

  const { data: tipoRow, error: tipoError } = await supabase
    .from('hydrex_tipos_insumo')
    .select('*')
    .eq('id', input.tipo_insumo_id)
    .single()

  if (tipoError || !tipoRow) {
    throw new Error('Categoría de insumo no encontrada.')
  }

  const tipo = tipoRow as HydrexTipoInsumo

  const normalized = normalizeInsumoPayload(input, tipo)
  const fieldErrors = validateInsumoFields(normalized, tipo)
  if (hasFieldErrors(fieldErrors)) {
    throw new Error(Object.values(fieldErrors)[0]!)
  }

  const row = {
    tipo_insumo_id: input.tipo_insumo_id,
    nombre: normalized.nombre,
    atributo_1: normalized.atributo_1,
    atributo_2: normalized.atributo_2,
    costo_arte: tipo.usa_costo_arte ? (input.costo_arte ?? null) : null,
    unidad_medida: input.unidad_medida ?? 'unidad',
    activo: input.activo ?? true,
  }

  const uniqueContext = {
    entity: 'insumo' as const,
    labelAtributo1: tipo.label_atributo_1,
    labelAtributo2: tipo.label_atributo_2,
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('hydrex_insumos')
      .update(row)
      .eq('id', input.id)
      .select('*')
      .single()
    if (error) throwFriendlyDbError(error, uniqueContext)
    return normalizeInsumo(data, tipo)
  }

  const { data, error } = await supabase
    .from('hydrex_insumos')
    .insert({ ...row, costo_unitario: null })
    .select('*')
    .single()
  if (error) throwFriendlyDbError(error, uniqueContext)
  return normalizeInsumo(data, tipo)
}

function normalizeInsumo(row: Record<string, unknown>, tipo?: HydrexTipoInsumo): HydrexInsumo {
  const joinedTipo =
    tipo ??
    (row.hydrex_tipos_insumo as HydrexInsumo['tipo']) ??
    (row.tipo as HydrexInsumo['tipo'])
  return {
    id: row.id as string,
    tipo_insumo_id: row.tipo_insumo_id as string,
    tipo: joinedTipo ?? undefined,
    nombre: row.nombre as string,
    atributo_1: row.atributo_1 as string,
    atributo_2: row.atributo_2 as string | null,
    costo_unitario: row.costo_unitario != null ? Number(row.costo_unitario) : null,
    costo_arte: row.costo_arte != null ? Number(row.costo_arte) : null,
    unidad_medida: row.unidad_medida as string,
    activo: row.activo as boolean,
  }
}

export type UpsertProductoInput = {
  id?: string
  nombre: string
  tipo_producto: 'individual' | 'caja'
  activo: boolean
  receta: { insumo_id: string; cantidad: number }[]
}

export async function upsertProducto(input: UpsertProductoInput) {
  const supabase = createAdminClient()
  const tipo = input.tipo_producto === 'caja' ? 'caja' : 'individual'
  const nombre = input.nombre.trim()
  const recetaRaw = input.receta

  if (!nombre) {
    throw new Error('El nombre del producto es obligatorio.')
  }

  if (recetaRaw.length === 0) {
    throw new Error('La receta debe tener al menos una línea de insumo.')
  }

  const receta: { insumo_id: string; cantidad: number }[] = []
  const seen = new Set<string>()

  for (const line of recetaRaw) {
    const insumoId = line.insumo_id.trim()
    const cantidad = line.cantidad
    if (!insumoId) {
      throw new Error('Cada línea de receta debe tener un insumo seleccionado.')
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new Error('Cada línea de receta debe tener una cantidad mayor a 0.')
    }
    if (seen.has(insumoId)) {
      throw new Error('No puedes repetir el mismo insumo en la receta — suma las cantidades en una sola línea.')
    }
    seen.add(insumoId)
    receta.push({ insumo_id: insumoId, cantidad })
  }

  const row = {
    nombre,
    tipo_producto: tipo,
    activo: input.activo,
  }

  let productoId = input.id ?? null

  if (productoId) {
    const { error } = await supabase.from('hydrex_productos').update(row).eq('id', productoId)
    if (error) throwFriendlyDbError(error)
  } else {
    const { data, error } = await supabase.from('hydrex_productos').insert(row).select('id').single()
    if (error) throwFriendlyDbError(error)
    productoId = data.id as string
  }

  const { error: deleteError } = await supabase
    .from('hydrex_producto_insumos')
    .delete()
    .eq('producto_id', productoId)
  if (deleteError) throwFriendlyDbError(deleteError)

  const { error: insertError } = await supabase.from('hydrex_producto_insumos').insert(
    receta.map((line) => ({
      producto_id: productoId,
      insumo_id: line.insumo_id,
      cantidad: line.cantidad,
    }))
  )
  if (insertError) throwFriendlyDbError(insertError)
}

export async function upsertPrecio(input: Record<string, unknown>) {
  const supabase = createAdminClient()

  let productoId = input.producto_id != null ? String(input.producto_id) : null

  if (!productoId && input.id) {
    const { data: existing, error: existingError } = await supabase
      .from('hydrex_precios')
      .select('producto_id')
      .eq('id', String(input.id))
      .single()
    if (existingError || !existing) {
      throw new Error('Precio no encontrado.')
    }
    productoId = existing.producto_id as string
  }

  if (!productoId) {
    throw new Error('Debes indicar el producto al que pertenece el precio.')
  }

  const { data: producto, error: productoError } = await supabase
    .from('hydrex_productos')
    .select('tipo_producto')
    .eq('id', productoId)
    .single()

  if (productoError || !producto) {
    throw new Error('Producto no encontrado.')
  }

  const tipoProducto = producto.tipo_producto === 'caja' ? 'caja' : 'individual'
  const tipoPrecio = String(input.tipo_precio ?? '')
  validarTipoPrecioParaProducto(tipoProducto, tipoPrecio)

  const descuentoUi =
    input.descuento_pct_ui != null && input.descuento_pct_ui !== ''
      ? Number(input.descuento_pct_ui)
      : null
  const descuento_pct =
    descuentoUi != null
      ? descuentoPctUiToFraction(descuentoUi)
      : Number(input.descuento_pct ?? 0)

  const row = {
    producto_id: productoId,
    tipo_precio: tipoPrecio,
    cantidad_min: Math.trunc(Number(input.cantidad_min ?? 1)),
    cantidad_max:
      input.cantidad_max == null || input.cantidad_max === ''
        ? null
        : Math.trunc(Number(input.cantidad_max)),
    precio_unitario: Number(input.precio_unitario ?? 0),
    descuento_pct,
  }

  if (input.id) {
    const { error } = await supabase.from('hydrex_precios').update(row).eq('id', String(input.id))
    if (error) throwFriendlyDbError(error)
  } else {
    const { error } = await supabase.from('hydrex_precios').insert(row)
    if (error) throwFriendlyDbError(error)
  }
}

export async function upsertComponente(input: Record<string, unknown>) {
  const supabase = createAdminClient()
  const negocioId = await getHydrexNegocioId()
  const row = { ...input, negocio_id: negocioId }
  if (input.id) {
    const { error } = await supabase.from('hydrex_componentes_costo').update(row).eq('id', input.id)
    if (error) throwFriendlyDbError(error)
  } else {
    const { error } = await supabase.from('hydrex_componentes_costo').insert(row)
    if (error) throwFriendlyDbError(error)
  }
}

export async function upsertEnvioTarifa(input: Record<string, unknown>) {
  const supabase = createAdminClient()
  const negocioId = await getHydrexNegocioId()
  const row = { ...input, negocio_id: negocioId }
  if (input.id) {
    const { error } = await supabase.from('hydrex_envio_tarifas').update(row).eq('id', input.id)
    if (error) throwFriendlyDbError(error)
  } else {
    const { error } = await supabase.from('hydrex_envio_tarifas').insert(row)
    if (error) throwFriendlyDbError(error)
  }
}

export async function upsertProveedor(input: Record<string, unknown>) {
  const supabase = createAdminClient()
  const negocioId = await getHydrexNegocioId()
  const row = { ...input, negocio_id: negocioId }
  if (input.id) {
    const { error } = await supabase.from('proveedores').update(row).eq('id', input.id)
    if (error) throwFriendlyDbError(error)
  } else {
    const { error } = await supabase.from('proveedores').insert(row)
    if (error) throwFriendlyDbError(error)
  }
}

export async function crearCompra(input: {
  proveedor_id: string
  insumo_id: string
  cantidad: number
  valor_total: number
  fecha: string
  documento_url?: string
  notas?: string
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hydrex_compras').insert(input)
  if (error) throwFriendlyDbError(error)
}

export async function upsertGastoFijo(input: Record<string, unknown>) {
  const supabase = createAdminClient()
  const negocioId = await getHydrexNegocioId()
  const row = { ...input, negocio_id: negocioId }
  if (input.id) {
    const { error } = await supabase.from('gastos_fijos').update(row).eq('id', input.id)
    if (error) throwFriendlyDbError(error)
  } else {
    const { error } = await supabase.from('gastos_fijos').insert(row)
    if (error) throwFriendlyDbError(error)
  }
}

export async function upsertCliente(input: Record<string, unknown>) {
  const supabase = createAdminClient()
  const negocioId = await getHydrexNegocioId()
  const row = { ...input, negocio_id: negocioId }
  if (input.id) {
    const { error } = await supabase.from('clientes').update(row).eq('id', input.id)
    if (error) throwFriendlyDbError(error)
  } else {
    const { error } = await supabase.from('clientes').insert(row)
    if (error) throwFriendlyDbError(error)
  }
}

export interface TransaccionConVentaInput {
  negocio_id: string
  cuenta_id: string
  categoria: string
  monto: number
  fecha: string
  nombre_interno: string
  observaciones?: string
  venta: HydrexVentaInput
}

export async function createTransaccionConVentaHydrex(input: TransaccionConVentaInput) {
  if (input.venta.costo_producto_unitario == null) {
    throw new Error(
      'No se puede registrar la venta: el producto no tiene costo conocido (faltan compras de insumos).'
    )
  }
  if (
    input.venta.costo_total == null ||
    input.venta.ganancia == null ||
    input.venta.margen_pct == null ||
    !input.venta.calificacion
  ) {
    throw new Error('No se puede registrar la venta: el costo del producto no está disponible.')
  }

  const supabase = createAdminClient()

  const { data: transaccion, error: txError } = await supabase
    .from('transacciones')
    .insert({
      negocio_id: input.negocio_id,
      cuenta_id: input.cuenta_id,
      tipo: 'ingreso',
      categoria: input.categoria,
      monto: input.monto,
      fecha: input.fecha,
      nombre_interno: input.nombre_interno,
      observaciones: input.observaciones ?? null,
      estado: 'clasificada',
      origen: 'manual',
    })
    .select()
    .single()

  if (txError) throw new Error(txError.message)

  const v = input.venta
  const componentesSnapshot = v.componentes_aplicados
    .filter((c: ComponenteAplicado) => c.activo)
    .map((c) => ({
      componente_id: c.componenteId,
      nombre: c.nombre,
      tipo_calculo: c.tipoCalculo,
      valor: c.valor,
      monto_aplicado: c.montoAplicado,
    }))

  const { error: ventaError } = await supabase.from('hydrex_ventas_detalle').insert({
    transaccion_id: transaccion.id,
    producto_id: v.producto_id,
    cliente_id: v.cliente_id ?? null,
    canal: v.canal,
    cantidad: v.cantidad,
    precio_venta_unitario: v.precio_venta_unitario,
    incluye_envio: v.incluye_envio,
    valor_envio: v.valor_envio,
    componentes_aplicados: componentesSnapshot,
    costo_total: v.costo_total,
    ganancia: v.ganancia,
    margen_pct: v.margen_pct,
    calificacion: v.calificacion,
  })

  if (ventaError) throw new Error(ventaError.message)

  return transaccion
}
