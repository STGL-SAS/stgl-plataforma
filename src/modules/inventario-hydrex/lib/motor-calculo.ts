import type {
  CalculoVentaInput,
  CalculoVentaResultado,
  Calificacion,
  ComponenteAplicado,
  ComponenteCosto,
  PrecioRow,
  TipoPrecio,
} from './tipos'

const COSTO_NO_DISPONIBLE: CalculoVentaResultado = {
  costoDisponible: false,
  costoProductoTotal: null,
  componentesAplicados: [],
  costoTotal: null,
  gananciaTotal: null,
  gananciaPorUnidad: null,
  margenPct: null,
  calificacion: null,
}

export function tieneCostoDisponible(costo: number | null | undefined): costo is number {
  return costo != null && !Number.isNaN(costo)
}

export function productoCostoDisponible(producto: {
  costo_por_unidad?: number | null
  costo_incompleto?: boolean
}): boolean {
  if (producto.costo_incompleto) return false
  return tieneCostoDisponible(producto.costo_por_unidad)
}

function estaActivo(
  componente: ComponenteCosto,
  canal: string,
  componentesActivos: Record<string, boolean>
): boolean {
  if (componente.id in componentesActivos) {
    return componentesActivos[componente.id]
  }
  return componente.premarcado_canales.includes(canal)
}

function calcularMontoComponente(
  componente: ComponenteCosto,
  precioVentaUnitario: number,
  cantidad: number,
  unidadesEquivalentes: number
): number {
  let monto: number
  switch (componente.tipo_calculo) {
    case 'porcentaje':
      monto = componente.valor * precioVentaUnitario * cantidad
      break
    case 'valor_fijo':
      monto = componente.valor
      break
    case 'valor_por_unidad':
      monto = componente.valor * cantidad
      break
    default:
      monto = 0
  }
  if (componente.prorratea_por_lote && unidadesEquivalentes > 0) {
    monto /= unidadesEquivalentes
  }
  return monto
}

function calificar(margenPct: number, gananciaTotal: number): Calificacion {
  if (margenPct >= 0.2) return 'excelente'
  if (margenPct >= 0.1) return 'ajustado'
  if (gananciaTotal > 0) return 'critico'
  return 'perdida'
}

/** Función pura — sin Supabase. Usada por calculadora y registro de venta. */
export function calcularVenta(input: CalculoVentaInput): CalculoVentaResultado {
  if (!tieneCostoDisponible(input.costoProductoTotal)) {
    return COSTO_NO_DISPONIBLE
  }

  const {
    costoProductoTotal,
    precioVentaUnitario,
    cantidad,
    canal,
    componentesDisponibles,
    componentesActivos,
    incluyeEnvio,
    valorEnvio,
    unidadesEquivalentes = 1,
  } = input

  const unidadesLote = unidadesEquivalentes > 0 ? unidadesEquivalentes : 1
  const ingresoTotal = precioVentaUnitario * cantidad

  const componentesAplicados: ComponenteAplicado[] = componentesDisponibles.map(
    (componente) => {
      const activo = estaActivo(componente, canal, componentesActivos)
      const montoAplicado = activo
        ? calcularMontoComponente(componente, precioVentaUnitario, cantidad, unidadesLote)
        : 0
      return {
        componenteId: componente.id,
        nombre: componente.nombre,
        tipoCalculo: componente.tipo_calculo,
        valor: componente.valor,
        montoAplicado,
        activo,
      }
    }
  )

  const sumaComponentes = componentesAplicados
    .filter((c) => c.activo)
    .reduce((sum, c) => sum + c.montoAplicado, 0)

  const costoTotal =
    costoProductoTotal + (incluyeEnvio ? valorEnvio : 0) + sumaComponentes
  const gananciaTotal = ingresoTotal - costoTotal
  const gananciaPorUnidad = cantidad > 0 ? gananciaTotal / cantidad : 0
  const margenPct = ingresoTotal > 0 ? gananciaTotal / ingresoTotal : 0

  return {
    costoDisponible: true,
    costoProductoTotal,
    componentesAplicados,
    costoTotal,
    gananciaTotal,
    gananciaPorUnidad,
    margenPct,
    calificacion: calificar(margenPct, gananciaTotal),
  }
}

export function tienePrecioParaTipo(precios: PrecioRow[], tipoPrecio: TipoPrecio): boolean {
  return precios.some((p) => p.tipo_precio === tipoPrecio)
}

export function filasPrecioDistribuidor(precios: PrecioRow[]): PrecioRow[] {
  return precios
    .filter((p) => p.tipo_precio === 'distribuidor')
    .sort((a, b) => a.cantidad_min - b.cantidad_min)
}

export function filaPrecioDistribuidor(
  precios: PrecioRow[],
  cantidad: number
): PrecioRow | null {
  return (
    filasPrecioDistribuidor(precios).find((p) => {
      const enMin = cantidad >= p.cantidad_min
      const enMax = p.cantidad_max == null || cantidad <= p.cantidad_max
      return enMin && enMax
    }) ?? null
  )
}

/** Resuelve precio unitario desde filas de hydrex_precios según tipo y cantidad. */
export function resolverPrecioVenta(
  precios: PrecioRow[],
  tipoPrecio: TipoPrecio,
  cantidad: number
): number {
  const filas = precios
    .filter((p) => p.tipo_precio === tipoPrecio)
    .sort((a, b) => a.cantidad_min - b.cantidad_min)

  if (filas.length === 0) return 0

  if (tipoPrecio === 'individual') {
    return filas[0]?.precio_unitario ?? 0
  }

  if (tipoPrecio === 'caja') {
    const base = filas.find((p) => p.cantidad_min <= 1) ?? filas[0]
    let precio = base.precio_unitario
    if (cantidad >= 2) {
      const descuento = filas.find((p) => p.cantidad_min >= 2 && p.descuento_pct > 0)
      if (descuento) {
        precio = base.precio_unitario * (1 - descuento.descuento_pct)
      } else {
        const fila2 = filas.find((p) => p.cantidad_min === 2)
        if (fila2) precio = fila2.precio_unitario
      }
    }
    return precio
  }

  return filaPrecioDistribuidor(precios, cantidad)?.precio_unitario ?? 0
}

/** Mensaje cuando no hay precio válido para tipo/cantidad; null si el precio sí aplica. */
export function mensajePrecioNoDisponible(
  precios: PrecioRow[],
  tipoPrecio: TipoPrecio,
  cantidad: number
): string | null {
  if (resolverPrecioVenta(precios, tipoPrecio, cantidad) > 0) return null

  if (!tienePrecioParaTipo(precios, tipoPrecio)) {
    return 'Este producto no tiene precio definido para el tipo seleccionado.'
  }

  if (tipoPrecio === 'distribuidor') {
    const filas = filasPrecioDistribuidor(precios)
    const menorMin = filas[0]?.cantidad_min
    if (menorMin != null && cantidad < menorMin) {
      return `No hay precio distribuidor para esa cantidad — el tramo disponible empieza en ${menorMin} unidades`
    }
    return 'No hay precio distribuidor para esa cantidad.'
  }

  return 'Este producto no tiene precio definido para el tipo seleccionado.'
}

export function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatCostoDisplay(costo: number | null | undefined): string {
  if (!tieneCostoDisponible(costo)) return 'Sin compras'
  return formatCOP(costo)
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}
