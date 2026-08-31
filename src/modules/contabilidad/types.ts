/** Tipos alineados con el esquema real de Fase 2 (nombres de columna de BD). */

export type EstadoTransaccion = 'pendiente_revision' | 'clasificada'
export type TipoTransaccion = 'ingreso' | 'egreso' | 'aporte' | 'intercompania'
export type TipoTransaccionManual = 'ingreso' | 'egreso'
export type OrigenTransaccion = 'manual' | 'bold' | 'shopify'
export type ClasificacionAporte = 'capital' | 'prestamo' | 'sin_definir'
export type EstadoIntercompania = 'pendiente' | 'saldado'

export interface Transaccion {
  id: string
  negocio_id: string
  cuenta_id: string | null
  tipo: TipoTransaccion
  categoria: string | null
  monto: number
  fecha: string
  estado: EstadoTransaccion
  origen: OrigenTransaccion
  nombre_original: string | null
  nombre_interno: string | null
  observaciones: string | null
  /** En BD: origen_referencia_id (Bold payment_id / subject) */
  origen_referencia_id: string | null
  created_at: string
  negocio?: { codigo: string; nombre: string }
}

export interface TransaccionFiltros {
  estado?: EstadoTransaccion
  negocio_id?: string
  categoria?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export interface TransaccionManualInput {
  negocio_id: string
  cuenta_id: string
  tipo: TipoTransaccionManual
  categoria: string
  monto: number
  fecha: string
  nombre_interno: string
  observaciones?: string
}

export interface AporteSocio {
  id: string
  transaccion_id: string
  negocio_id: string
  socio_id: string
  monto: number
  fecha: string
  clasificacion: ClasificacionAporte
  observaciones: string | null
  negocio?: { codigo: string; nombre: string }
}

export interface AporteSocioInput {
  socio_id: string
  negocio_id: string
  monto: number
  fecha: string
  clasificacion: 'capital' | 'prestamo'
  observaciones?: string
}

export interface EstadoCuentaNegocio {
  negocio_id: string
  negocio_codigo: string
  negocio_nombre: string
  total: number
  capital: number
  prestamo: number
  sin_definir: number
}

export interface EstadoCuentaSocio {
  socio_id: string
  por_negocio: EstadoCuentaNegocio[]
  total_general: number
}

export interface MovimientoIntercompania {
  id: string
  negocio_origen_id: string
  negocio_destino_id: string
  monto: number
  fecha: string
  concepto: string
  observaciones: string | null
  estado: EstadoIntercompania
  negocio_origen?: { codigo: string; nombre: string }
  negocio_destino?: { codigo: string; nombre: string }
}

export interface MovimientoIntercompaniaInput {
  negocio_origen_id: string
  negocio_destino_id: string
  monto: number
  fecha: string
  concepto: string
  observaciones?: string
}

export interface Negocio {
  id: string
  codigo: string
  nombre: string
}

export interface CuentaBancaria {
  id: string
  nombre: string
  tipo: string
}

export interface Socio {
  id: string
  nombre: string
}
