'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Canal,
  ComponenteCosto,
  HydrexInsumo,
  HydrexProducto,
  HydrexProductoInsumo,
  HydrexStockProducto,
  HydrexStockRow,
  HydrexTipoInsumo,
  PrecioRow,
} from './tipos'

export async function getHydrexNegocioId(): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('negocios')
    .select('id')
    .eq('codigo', 'HYDREX')
    .single()
  if (error || !data) throw new Error('Negocio HYDREX no encontrado')
  return data.id
}

export async function getTiposInsumo(activoOnly = false): Promise<HydrexTipoInsumo[]> {
  const supabase = createAdminClient()
  let q = supabase.from('hydrex_tipos_insumo').select('*').order('orden')
  if (activoOnly) q = q.eq('activo', true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as HydrexTipoInsumo[]
}

export async function getInsumos(activoOnly = false): Promise<HydrexInsumo[]> {
  const supabase = createAdminClient()
  let q = supabase
    .from('hydrex_insumos')
    .select('*, hydrex_tipos_insumo!tipo_insumo_id(*)')
    .order('nombre')
  if (activoOnly) q = q.eq('activo', true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Array<HydrexInsumo & { hydrex_tipos_insumo?: HydrexTipoInsumo | null }>
  return rows
    .map((r) => ({
      ...r,
      tipo: r.hydrex_tipos_insumo ?? undefined,
      hydrex_tipos_insumo: undefined,
      costo_unitario: r.costo_unitario != null ? Number(r.costo_unitario) : null,
      costo_arte: r.costo_arte != null ? Number(r.costo_arte) : null,
    }))
    .sort((a, b) => {
      const ordenA = a.tipo?.orden ?? 999
      const ordenB = b.tipo?.orden ?? 999
      if (ordenA !== ordenB) return ordenA - ordenB
      return a.nombre.localeCompare(b.nombre)
    })
}

export async function getProductosConCosto(activoOnly = false): Promise<HydrexProducto[]> {
  const supabase = createAdminClient()
  let q = supabase
    .from('hydrex_productos_costo')
    .select('producto_id, tipo_producto, nombre, costo_por_unidad, costo_incompleto')
  if (activoOnly) {
    const { data: prods } = await supabase
      .from('hydrex_productos')
      .select('id')
      .eq('activo', true)
    const ids = (prods ?? []).map((p) => p.id)
    if (ids.length === 0) return []
    q = q.in('producto_id', ids)
  }
  const { data, error } = await q.order('nombre')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => {
    const costoIncompleto = Boolean(r.costo_incompleto)
    return {
      id: r.producto_id as string,
      tipo_producto: r.tipo_producto as HydrexProducto['tipo_producto'],
      nombre: r.nombre as string,
      activo: true,
      costo_incompleto: costoIncompleto,
      costo_por_unidad: costoIncompleto
        ? null
        : r.costo_por_unidad != null
          ? Number(r.costo_por_unidad)
          : null,
    }
  })
}

export async function getRecetaPorProducto(): Promise<Record<string, HydrexProductoInsumo[]>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hydrex_producto_insumos')
    .select(
      `
      id,
      producto_id,
      insumo_id,
      cantidad,
      hydrex_insumos (
        id,
        nombre,
        atributo_1,
        atributo_2,
        hydrex_tipos_insumo!tipo_insumo_id (codigo, nombre)
      )
    `
    )
    .order('producto_id')
  if (error) throw new Error(error.message)

  const map: Record<string, HydrexProductoInsumo[]> = {}
  for (const row of data ?? []) {
    const productoId = row.producto_id as string
    const insumoJoined = row.hydrex_insumos as unknown
    const insumoRaw = (
      Array.isArray(insumoJoined) ? insumoJoined[0] : insumoJoined
    ) as Record<string, unknown> | null
    const tipoJoined = insumoRaw?.hydrex_tipos_insumo as unknown
    const tipoRaw = (
      Array.isArray(tipoJoined) ? tipoJoined[0] : tipoJoined
    ) as Record<string, unknown> | null
    const linea: HydrexProductoInsumo = {
      id: row.id as string,
      producto_id: productoId,
      insumo_id: row.insumo_id as string,
      cantidad: Number(row.cantidad),
      insumo: insumoRaw
        ? {
            id: insumoRaw.id as string,
            nombre: insumoRaw.nombre as string,
            atributo_1: insumoRaw.atributo_1 as string,
            atributo_2: insumoRaw.atributo_2 as string | null,
            tipo: tipoRaw
              ? {
                  codigo: tipoRaw.codigo as string,
                  nombre: tipoRaw.nombre as string,
                }
              : undefined,
          }
        : undefined,
    }
    if (!map[productoId]) map[productoId] = []
    map[productoId].push(linea)
  }
  return map
}

export async function getProductosFull(): Promise<HydrexProducto[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('hydrex_productos').select('*').order('nombre')
  if (error) throw new Error(error.message)
  return (data ?? []) as HydrexProducto[]
}

export async function getPreciosProducto(productoId: string): Promise<PrecioRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hydrex_precios')
    .select('*')
    .eq('producto_id', productoId)
    .order('tipo_precio')
    .order('cantidad_min')
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({
    ...p,
    cantidad_max: p.cantidad_max as number | null,
    precio_unitario: Number(p.precio_unitario),
    descuento_pct: Number(p.descuento_pct),
  })) as PrecioRow[]
}

export async function getComponentesCosto(canal?: Canal, activoOnly = true): Promise<ComponenteCosto[]> {
  const negocioId = await getHydrexNegocioId()
  const supabase = createAdminClient()
  let q = supabase
    .from('hydrex_componentes_costo')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('orden')
  if (activoOnly) q = q.eq('activo', true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  let rows = (data ?? []) as ComponenteCosto[]
  if (canal) {
    rows = rows.filter(
      (c) => !c.canales_aplica?.length || c.canales_aplica.includes(canal)
    )
  }
  return rows.map((c) => ({
    ...c,
    valor: Number(c.valor),
  }))
}

export async function getEnvioTarifas(activoOnly = true) {
  const negocioId = await getHydrexNegocioId()
  const supabase = createAdminClient()
  let q = supabase
    .from('hydrex_envio_tarifas')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('orden')
  if (activoOnly) q = q.eq('activo', true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []).map((t) => ({ ...t, valor_referencia: Number(t.valor_referencia) }))
}


export async function getStockActual(): Promise<HydrexStockRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hydrex_stock_actual')
    .select('*')
    .order('tipo_insumo_nombre')
    .order('nombre')
  if (error) throw new Error(error.message)
  return (data ?? []).map((s) => ({
    insumo_id: s.insumo_id as string,
    tipo_insumo_codigo: s.tipo_insumo_codigo as string,
    tipo_insumo_nombre: s.tipo_insumo_nombre as string,
    nombre: s.nombre as string,
    atributo_1: s.atributo_1 as string,
    atributo_2: s.atributo_2 as string | null,
    stock_disponible: Number(s.stock_disponible),
  }))
}

export async function getStockProductos(): Promise<HydrexStockProducto[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hydrex_stock_productos')
    .select('producto_id, nombre, tipo_producto, stock_disponible')
    .order('nombre')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    producto_id: r.producto_id as string,
    nombre: r.nombre as string,
    tipo_producto: r.tipo_producto as HydrexStockProducto['tipo_producto'],
    stock_disponible: Number(r.stock_disponible),
  }))
}

export async function getMovimientosInventario(limit = 50) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hydrex_inventario_movimientos')
    .select('*, hydrex_insumos(nombre, hydrex_tipos_insumo!tipo_insumo_id(codigo, nombre))')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getGastosFijosHydrex() {
  const negocioId = await getHydrexNegocioId()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('gastos_fijos')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('concepto')
  if (error) throw new Error(error.message)
  return (data ?? []).map((g) => ({ ...g, monto: Number(g.monto) }))
}

export async function getGastosFijosMensuales(): Promise<number> {
  const negocioId = await getHydrexNegocioId()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('gastos_fijos')
    .select('monto, periodicidad')
    .eq('negocio_id', negocioId)
    .eq('activo', true)
  if (error) throw new Error(error.message)
  return (data ?? []).reduce((sum, g) => {
    const m = Number(g.monto)
    if (g.periodicidad === 'mensual') return sum + m
    if (g.periodicidad === 'anual') return sum + m / 12
    return sum
  }, 0)
}

export async function getClientesHydrex() {
  const negocioId = await getHydrexNegocioId()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('nombre')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProveedoresHydrex() {
  const negocioId = await getHydrexNegocioId()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('nombre')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getComprasHydrex() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hydrex_compras')
    .select('*, proveedores(nombre), hydrex_insumos(nombre, hydrex_tipos_insumo!tipo_insumo_id(codigo, nombre))')
    .order('fecha', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getVentasCliente(clienteId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('hydrex_ventas_detalle')
    .select('*, hydrex_productos(nombre), transacciones(fecha, monto)')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}
