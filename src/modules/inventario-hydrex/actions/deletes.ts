'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type DeleteAction = 'deleted' | 'deactivated' | 'blocked'

export interface DeleteResult {
  action: DeleteAction
  message: string
}

async function countEq(table: string, column: string, value: string): Promise<number> {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value)
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function deleteTipoInsumo(id: string, nombre: string): Promise<DeleteResult> {
  const supabase = createAdminClient()
  const insumos = await countEq('hydrex_insumos', 'tipo_insumo_id', id)
  if (insumos > 0) {
    const { error } = await supabase.from('hydrex_tipos_insumo').update({ activo: false }).eq('id', id)
    if (error) throw new Error(error.message)
    return {
      action: 'deactivated',
      message: `"${nombre}" tiene insumos asociados — se desactivó en vez de eliminarse.`,
    }
  }
  const { error } = await supabase.from('hydrex_tipos_insumo').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { action: 'deleted', message: `"${nombre}" eliminado.` }
}

export async function deleteInsumo(id: string, nombre: string): Promise<DeleteResult> {
  const supabase = createAdminClient()
  const [compras, movimientos] = await Promise.all([
    countEq('hydrex_compras', 'insumo_id', id),
    countEq('hydrex_inventario_movimientos', 'insumo_id', id),
  ])
  if (compras > 0 || movimientos > 0) {
    const { error } = await supabase.from('hydrex_insumos').update({ activo: false }).eq('id', id)
    if (error) throw new Error(error.message)
    return {
      action: 'deactivated',
      message: `"${nombre}" ya tiene compras o movimientos — se desactivó para conservar el historial.`,
    }
  }
  const { error } = await supabase.from('hydrex_insumos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { action: 'deleted', message: `"${nombre}" eliminado.` }
}

export async function deleteProducto(id: string, nombre: string): Promise<DeleteResult> {
  const supabase = createAdminClient()
  const ventas = await countEq('hydrex_ventas_detalle', 'producto_id', id)
  if (ventas > 0) {
    const { error } = await supabase.from('hydrex_productos').update({ activo: false }).eq('id', id)
    if (error) throw new Error(error.message)
    return {
      action: 'deactivated',
      message: `"${nombre}" ya tiene ventas — se desactivó para conservar el historial.`,
    }
  }
  const { error } = await supabase.from('hydrex_productos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { action: 'deleted', message: `"${nombre}" eliminado.` }
}

export async function deletePrecio(id: string): Promise<DeleteResult> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hydrex_precios').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { action: 'deleted', message: 'Precio eliminado.' }
}

export async function deleteComponente(id: string, nombre: string): Promise<DeleteResult> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hydrex_componentes_costo').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { action: 'deleted', message: `"${nombre}" eliminado.` }
}

export async function deleteEnvioTarifa(id: string, nombre: string): Promise<DeleteResult> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hydrex_envio_tarifas').update({ activo: false }).eq('id', id)
  if (error) throw new Error(error.message)
  return { action: 'deactivated', message: `"${nombre}" desactivado.` }
}

export async function deleteProveedor(id: string, nombre: string): Promise<DeleteResult> {
  const compras = await countEq('hydrex_compras', 'proveedor_id', id)
  if (compras > 0) {
    return {
      action: 'blocked',
      message: `"${nombre}" tiene compras registradas y no puede eliminarse.`,
    }
  }
  const supabase = createAdminClient()
  const { error } = await supabase.from('proveedores').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { action: 'deleted', message: `"${nombre}" eliminado.` }
}

export async function deleteCompra(id: string): Promise<DeleteResult> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('hydrex_compras').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return {
    action: 'deleted',
    message: 'Compra eliminada. Los movimientos de inventario generados permanecen en el historial.',
  }
}

export async function deleteGastoFijo(id: string, concepto: string): Promise<DeleteResult> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('gastos_fijos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { action: 'deleted', message: `"${concepto}" eliminado.` }
}

export async function deleteCliente(id: string, nombre: string): Promise<DeleteResult> {
  const ventas = await countEq('hydrex_ventas_detalle', 'cliente_id', id)
  if (ventas > 0) {
    return {
      action: 'blocked',
      message: `"${nombre}" tiene ventas asociadas y no puede eliminarse.`,
    }
  }
  const supabase = createAdminClient()
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { action: 'deleted', message: `"${nombre}" eliminado.` }
}
