export type HardtechEstadoVenta = 'pendiente_compra' | 'pendiente_pago_final' | 'cerrada'

export type HardtechMoneda = 'COP' | 'USD'

export type HardtechGastoExtraTipo = 'envio_internacional' | 'empaque' | 'otro'

export type HardtechPagoSocioTipo = 'socio_puso_plata' | 'socio_recibio_plata'

export interface HardtechVentaCalcInput {
  valor_venta_final: number | null
  propina: number | null
  comision_terceros_pct: number | null
  comision_terceros_monto: number | null
}

export interface HardtechCompraCalcInput {
  monto_cop_equivalente: number
  agrupada_con: string | null
}

export interface HardtechGastoExtraCalcInput {
  monto_cop_equivalente: number
}

export interface HardtechMantenimientoCalcInput {
  anticipo_monto: number | null
  pago_final_monto: number | null
  honorarios_monto: number | null
  insumos_monto: number | null
  domicilio_monto: number | null
}

export interface HardtechPagoSocioCalcInput {
  socio_id: string
  socio_nombre?: string
  tipo: HardtechPagoSocioTipo
  monto: number
}

export interface GananciaVentaResultado {
  ingresoTotal: number
  costoCompras: number
  costoGastosExtra: number
  costoTotal: number
  ganancia: number
  comisionTerceros: number
  gananciaNeta: number
}

export interface GananciaMantenimientoResultado {
  valorCobrado: number
  costoTotal: number
  ganancia: number
}

export interface SaldoSocioResultado {
  socio_id: string
  socio_nombre: string
  total_puesto: number
  total_recibido: number
  /** Positivo = HARDTECH le debe al socio */
  saldo_neto: number
}

export interface HardtechVenta {
  id: string
  cliente_id: string
  titulo: string
  descripcion: string | null
  estado: HardtechEstadoVenta
  fecha_cotizacion: string | null
  documento_cotizacion: string | null
  anticipo_monto: number | null
  anticipo_fecha: string | null
  anticipo_comprobante: string | null
  anticipo_nota: string | null
  valor_venta_final: number | null
  propina: number | null
  pago_final_fecha: string | null
  pago_final_comprobante: string | null
  comision_terceros_pct: number | null
  comision_terceros_destinatario: string | null
  comision_terceros_monto: number | null
  created_at: string
  updated_at: string
  clientes?: { nombre: string } | null
}

export interface HardtechCompra {
  id: string
  venta_id: string
  lugar_compra: string
  metodo_pago: string
  moneda: HardtechMoneda
  monto: number
  tasa_cambio: number | null
  monto_cop_equivalente: number
  fecha_compra: string
  comprobante: string | null
  agrupada_con: string | null
  transaccion_divisas_id: string | null
}

export interface HardtechGastoExtra {
  id: string
  venta_id: string
  tipo: HardtechGastoExtraTipo
  monto: number
  moneda: HardtechMoneda
  tasa_cambio: number | null
  monto_cop_equivalente: number
  fecha: string
  comprobante: string | null
  nota: string | null
}

export interface HardtechMantenimiento {
  id: string
  cliente_id: string
  titulo: string
  descripcion: string | null
  fecha: string
  anticipo_monto: number | null
  anticipo_fecha: string | null
  pago_final_monto: number | null
  pago_final_fecha: string | null
  honorarios_monto: number | null
  honorarios_destinatario: string | null
  insumos_monto: number | null
  insumos_detalle: unknown
  domicilio_monto: number | null
  created_at: string
  updated_at: string
  clientes?: { nombre: string } | null
}

export interface HardtechPagoSocio {
  id: string
  socio_id: string
  tipo: HardtechPagoSocioTipo
  monto: number
  fecha: string
  nota: string | null
  venta_id: string | null
  mantenimiento_id: string | null
  created_at: string
  socios?: { nombre: string } | null
}

export const ESTADOS_VENTA: { value: HardtechEstadoVenta; label: string }[] = [
  { value: 'pendiente_compra', label: 'Pendiente compra' },
  { value: 'pendiente_pago_final', label: 'Pendiente pago final' },
  { value: 'cerrada', label: 'Cerrada' },
]

export const TIPOS_GASTO_EXTRA: { value: HardtechGastoExtraTipo; label: string }[] = [
  { value: 'envio_internacional', label: 'Envío internacional' },
  { value: 'empaque', label: 'Empaque' },
  { value: 'otro', label: 'Otro' },
]

export const TIPOS_PAGO_SOCIO: { value: HardtechPagoSocioTipo; label: string }[] = [
  { value: 'socio_puso_plata', label: 'Socio puso plata (HARDTECH le debe)' },
  { value: 'socio_recibio_plata', label: 'Socio recibió plata (debe a HARDTECH)' },
]
