export type Canal = 'mercado_libre' | 'rappi' | 'web' | 'directo'

export type TipoCalculo = 'porcentaje' | 'valor_fijo' | 'valor_por_unidad'

export type Calificacion = 'excelente' | 'ajustado' | 'critico' | 'perdida'

export type TipoPrecio = 'individual' | 'caja' | 'distribuidor'

export interface ComponenteCosto {
  id: string
  nombre: string
  tipo_calculo: TipoCalculo
  valor: number
  premarcado_canales: string[]
  canales_aplica?: string[]
  activo?: boolean
  prorratea_por_lote?: boolean
}

export interface CalculoVentaInput {
  /** Costo total del producto para la cantidad exacta evaluada (FIFO, ya no se multiplica por cantidad). */
  costoProductoTotal: number | null | undefined
  precioVentaUnitario: number
  cantidad: number
  canal: Canal
  componentesDisponibles: ComponenteCosto[]
  componentesActivos: Record<string, boolean>
  incluyeEnvio: boolean
  valorEnvio: number
  /** Unidades del lote para prorratear componentes (vista hydrex_productos_unidades_equivalentes) */
  unidadesEquivalentes?: number
}

export interface ComponenteAplicado {
  componenteId: string
  nombre: string
  tipoCalculo: TipoCalculo
  valor: number
  montoAplicado: number
  activo: boolean
}

export interface CalculoVentaResultado {
  costoDisponible: boolean
  costoProductoTotal: number | null
  componentesAplicados: ComponenteAplicado[]
  costoTotal: number | null
  gananciaTotal: number | null
  gananciaPorUnidad: number | null
  margenPct: number | null
  calificacion: Calificacion | null
}

export interface PrecioRow {
  id: string
  producto_id: string
  tipo_precio: TipoPrecio
  cantidad_min: number
  cantidad_max: number | null
  precio_unitario: number
  descuento_pct: number
}

export interface HydrexTipoInsumo {
  id: string
  codigo: string
  nombre: string
  label_atributo_1: string
  label_atributo_2: string | null
  requiere_atributo_2: boolean
  usa_costo_arte: boolean
  activo: boolean
  orden: number
}

export interface HydrexStockRow {
  insumo_id: string
  tipo_insumo_codigo: string
  tipo_insumo_nombre: string
  nombre: string
  atributo_1: string
  atributo_2: string | null
  stock_disponible: number
}

export interface HydrexStockProducto {
  producto_id: string
  nombre: string
  tipo_producto: 'individual' | 'caja'
  stock_disponible: number
}

export interface HydrexInsumo {
  id: string
  tipo_insumo_id: string
  /** Join opcional desde hydrex_tipos_insumo */
  tipo?: HydrexTipoInsumo
  nombre: string
  atributo_1: string
  atributo_2: string | null
  costo_unitario: number | null
  costo_arte: number | null
  unidad_medida: string
  activo: boolean
}

export interface HydrexProductoRecetaLinea {
  id?: string
  producto_id?: string
  insumo_id?: string | null
  componente_producto_id?: string | null
  cantidad: number
  insumo?: Pick<HydrexInsumo, 'id' | 'nombre' | 'atributo_1' | 'atributo_2'> & {
    tipo?: Pick<HydrexTipoInsumo, 'codigo' | 'nombre'>
  }
  componente?: Pick<HydrexProducto, 'id' | 'nombre' | 'tipo_producto'>
}

export interface HydrexProducto {
  id: string
  tipo_producto: 'individual' | 'caja'
  nombre: string
  activo: boolean
  unidades_equivalentes?: number
  costo_por_unidad?: number | null
  costo_incompleto?: boolean
  receta?: HydrexProductoRecetaLinea[]
}

export interface HydrexVentaInput {
  producto_id: string
  cliente_id?: string
  canal: Canal
  cantidad: number
  precio_venta_unitario: number
  incluye_envio: boolean
  valor_envio: number
  componentes_activos: Record<string, boolean>
  costo_producto_unitario: number | null
  componentes_aplicados: ComponenteAplicado[]
  costo_total: number | null
  ganancia: number | null
  margen_pct: number | null
  calificacion: Calificacion | null
}

export const CANALES: { value: Canal; label: string }[] = [
  { value: 'mercado_libre', label: 'Mercado Libre' },
  { value: 'rappi', label: 'Rappi' },
  { value: 'web', label: 'Web' },
  { value: 'directo', label: 'Directo' },
]

export const CALIFICACION_UI: Record<
  Calificacion,
  { emoji: string; label: string; className: string }
> = {
  excelente: { emoji: '✅', label: 'Excelente', className: 'bg-emerald-100 text-emerald-800' },
  ajustado: { emoji: '🟡', label: 'Ajustado', className: 'bg-yellow-100 text-yellow-800' },
  critico: { emoji: '🔴', label: 'Crítico', className: 'bg-orange-100 text-orange-800' },
  perdida: { emoji: '❌', label: 'Pérdida', className: 'bg-red-100 text-red-800' },
}
