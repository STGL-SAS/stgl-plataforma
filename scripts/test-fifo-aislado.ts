/**
 * Prueba FIFO aislada — usa mutations/actions reales del proyecto.
 * Ejecutar: npx tsx --env-file=.env.local scripts/test-fifo-aislado.ts
 */
import { createAdminClient } from '../src/lib/supabase/admin'
import {
  crearCompra,
  createTransaccionConVentaHydrex,
  upsertInsumo,
  upsertProducto,
} from '../src/modules/inventario-hydrex/actions/mutations'
import { calcularVenta } from '../src/modules/inventario-hydrex/lib/motor-calculo'
import {
  getComponentesCosto,
  getHydrexNegocioId,
  obtenerCostoProductoFifo,
} from '../src/modules/inventario-hydrex/lib/queries'

const INSUMO_NOMBRE = 'TEST - insumo FIFO'
const PRODUCTO_NOMBRE = 'TEST - producto FIFO'
const ATRIBUTO_TEST = 'PRUEBA-FIFO-001'

async function main() {
  const supabase = createAdminClient()

  const { data: tipo } = await supabase
    .from('hydrex_tipos_insumo')
    .select('id, label_atributo_1, requiere_atributo_2')
    .eq('activo', true)
    .eq('requiere_atributo_2', false)
    .order('orden')
    .limit(1)
    .single()
  if (!tipo) throw new Error('No hay categoría de insumo activa sin atributo 2')

  const { data: proveedor } = await supabase.from('proveedores').select('id').limit(1).single()
  if (!proveedor) throw new Error('No hay proveedor')

  const negocioId = await getHydrexNegocioId()
  const { data: cuenta } = await supabase.from('cuentas_bancarias').select('id').limit(1).single()
  if (!cuenta) throw new Error('No hay cuenta bancaria')

  console.log('1. Creando insumo de prueba…')
  const insumo = await upsertInsumo({
    tipo_insumo_id: tipo.id,
    nombre: INSUMO_NOMBRE,
    atributo_1: ATRIBUTO_TEST,
    atributo_2: null,
    unidad_medida: 'unidad',
    activo: true,
  })
  console.log(`   insumo_id: ${insumo.id}`)

  console.log('2. Creando producto de prueba con receta 1:1…')
  await upsertProducto({
    nombre: PRODUCTO_NOMBRE,
    tipo_producto: 'individual',
    activo: true,
    receta: [{ tipo_linea: 'insumo', insumo_id: insumo.id, cantidad: 1 }],
    precios: [{ tipo_precio: 'individual', cantidad_min: 1, cantidad_max: null, precio_unitario: 5000 }],
  })

  const { data: producto } = await supabase
    .from('hydrex_productos')
    .select('id')
    .eq('nombre', PRODUCTO_NOMBRE)
    .single()
  if (!producto) throw new Error('Producto de prueba no creado')
  console.log(`   producto_id: ${producto.id}`)

  const hoy = new Date().toISOString().slice(0, 10)
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  console.log('3. Registrando dos compras del insumo de prueba…')
  await crearCompra({
    proveedor_id: proveedor.id,
    insumo_id: insumo.id,
    cantidad: 50,
    valor_total: 100_000,
    fecha: ayer,
    notas: 'TEST FIFO lote 1 — 50 u × $2.000',
  })
  await crearCompra({
    proveedor_id: proveedor.id,
    insumo_id: insumo.id,
    cantidad: 50,
    valor_total: 125_000,
    fecha: hoy,
    notas: 'TEST FIFO lote 2 — 50 u × $2.500',
  })

  const { data: compras } = await supabase
    .from('hydrex_compras')
    .select('id, cantidad, valor_total, costo_unitario, fecha')
    .eq('insumo_id', insumo.id)
    .order('fecha')
  console.log('   Compras creadas:')
  for (const c of compras ?? []) {
    console.log(
      `   - ${c.id}: ${c.cantidad} u, valor_total $${Number(c.valor_total).toLocaleString('es-CO')}, costo_unitario $${Number(c.costo_unitario).toLocaleString('es-CO')}, fecha ${c.fecha}`
    )
  }

  const cantidadVenta = 70
  const precioUnitario = 5000

  console.log('4. Calculando costo FIFO y registrando venta vía createTransaccionConVentaHydrex…')
  const { costo: costoProductoTotal, incompleto } = await obtenerCostoProductoFifo(
    producto.id,
    cantidadVenta
  )
  if (incompleto || costoProductoTotal == null) {
    throw new Error(`Costo FIFO incompleto: ${costoProductoTotal}`)
  }

  const componentes = await getComponentesCosto('directo')
  const componentesActivos = Object.fromEntries(
    componentes.map((c) => [c.id, c.premarcado_canales.includes('directo')])
  )
  const calc = calcularVenta({
    costoProductoTotal,
    precioVentaUnitario: precioUnitario,
    cantidad: cantidadVenta,
    canal: 'directo',
    componentesDisponibles: componentes,
    componentesActivos,
    incluyeEnvio: false,
    valorEnvio: 0,
    unidadesEquivalentes: 1,
  })

  if (!calc.costoDisponible) throw new Error('calcularVenta: costo no disponible')

  const transaccion = await createTransaccionConVentaHydrex({
    negocio_id: negocioId,
    cuenta_id: cuenta.id,
    categoria: 'test_fifo_aislado',
    monto: precioUnitario * cantidadVenta,
    fecha: hoy,
    nombre_interno: 'TEST FIFO aislado — venta 70 u',
    observaciones: 'Prueba automatizada FIFO; no usar en reportes operativos.',
    venta: {
      producto_id: producto.id,
      canal: 'directo',
      cantidad: cantidadVenta,
      precio_venta_unitario: precioUnitario,
      incluye_envio: false,
      valor_envio: 0,
      componentes_activos: componentesActivos,
      costo_producto_unitario: costoProductoTotal / cantidadVenta,
      componentes_aplicados: calc.componentesAplicados,
      costo_total: calc.costoTotal,
      ganancia: calc.gananciaTotal,
      margen_pct: calc.margenPct,
      calificacion: calc.calificacion,
    },
  })
  console.log(`   transaccion_id: ${transaccion.id}`)

  const { data: venta } = await supabase
    .from('hydrex_ventas_detalle')
    .select('id, cantidad, costo_total, ganancia, margen_pct')
    .eq('transaccion_id', transaccion.id)
    .single()

  const { data: movs } = await supabase
    .from('hydrex_inventario_movimientos')
    .select('id, cantidad, lote_compra_id, tipo_movimiento, origen')
    .eq('insumo_id', insumo.id)
    .eq('tipo_movimiento', 'salida')
    .eq('origen', 'venta')
    .order('cantidad', { ascending: false })

  const costoEsperado = 50 * 2000 + 20 * 2500

  console.log('\n========== RESULTADOS PASO 5 ==========')
  console.log(`Costo producto FIFO (antes de componentes/envío): $${costoProductoTotal.toLocaleString('es-CO')}`)
  console.log(`Costo esperado (50×2.000 + 20×2.500):           $${costoEsperado.toLocaleString('es-CO')}`)
  console.log(`¿Coincide costo producto? ${costoProductoTotal === costoEsperado ? 'SÍ' : `NO (diff ${costoProductoTotal - costoEsperado})`}`)
  console.log(`Costo producto unitario promedio:                $${(costoProductoTotal / cantidadVenta).toLocaleString('es-CO')}`)
  console.log(`Costo total venta (con componentes directo):     $${Number(venta?.costo_total).toLocaleString('es-CO')}`)
  console.log(`Ganancia registrada:                             $${Number(venta?.ganancia).toLocaleString('es-CO')}`)
  console.log(`Margen %:                                        ${(Number(venta?.margen_pct) * 100).toFixed(2)}%`)
  console.log(`venta_detalle_id:                                ${venta?.id}`)
  console.log(`\nMovimientos de salida del insumo de prueba (${movs?.length ?? 0} filas):`)
  for (const m of movs ?? []) {
    const compra = compras?.find((c) => c.id === m.lote_compra_id)
    console.log(
      `  - cantidad ${m.cantidad}, lote_compra_id ${m.lote_compra_id}, costo_unitario lote $${compra ? Number(compra.costo_unitario).toLocaleString('es-CO') : '?'}`
    )
  }
  const lotesUnicos = new Set((movs ?? []).map((m) => m.lote_compra_id).filter(Boolean))
  console.log(`Lotes distintos en salidas: ${lotesUnicos.size}`)
  console.log('========================================\n')

  console.log('6. Desactivando insumo y producto de prueba (activo=false)…')
  await upsertInsumo({
    id: insumo.id,
    tipo_insumo_id: tipo.id,
    nombre: INSUMO_NOMBRE,
    atributo_1: ATRIBUTO_TEST,
    atributo_2: null,
    unidad_medida: 'unidad',
    activo: false,
  })
  await upsertProducto({
    id: producto.id,
    nombre: PRODUCTO_NOMBRE,
    tipo_producto: 'individual',
    activo: false,
    receta: [{ tipo_linea: 'insumo', insumo_id: insumo.id, cantidad: 1 }],
  })
  console.log('   insumo y producto desactivados. Transacción y venta conservadas sin borrar.')
}

main().catch((e) => {
  console.error('ERROR:', e instanceof Error ? e.message : e)
  process.exit(1)
})
