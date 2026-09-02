import type {
  GananciaMantenimientoResultado,
  GananciaVentaResultado,
  HardtechCompraCalcInput,
  HardtechGastoExtraCalcInput,
  HardtechMantenimientoCalcInput,
  HardtechPagoSocioCalcInput,
  HardtechVentaCalcInput,
  SaldoSocioResultado,
} from './lib/tipos'

function n(v: number | null | undefined): number {
  return v != null && !Number.isNaN(v) ? Number(v) : 0
}

/** Compras agrupadas (agrupada_con) no suman al costo — el envío va en la compra principal. */
function costoCompras(compras: HardtechCompraCalcInput[]): number {
  return compras
    .filter((c) => !c.agrupada_con)
    .reduce((sum, c) => sum + n(c.monto_cop_equivalente), 0)
}

function costoGastosExtra(gastos: HardtechGastoExtraCalcInput[]): number {
  return gastos.reduce((sum, g) => sum + n(g.monto_cop_equivalente), 0)
}

function comisionTerceros(
  venta: HardtechVentaCalcInput,
  ganancia: number
): number {
  if (n(venta.comision_terceros_monto) > 0) {
    return n(venta.comision_terceros_monto)
  }
  const pct = n(venta.comision_terceros_pct)
  if (pct > 0 && ganancia > 0) {
    return ganancia * pct
  }
  return 0
}

/** Ganancia = ingreso − compras − gastos extra; ganancia neta = ganancia − comisión terceros */
export function calcularGananciaVenta(
  venta: HardtechVentaCalcInput,
  compras: HardtechCompraCalcInput[],
  gastosExtra: HardtechGastoExtraCalcInput[]
): GananciaVentaResultado {
  const ingresoTotal = n(venta.valor_venta_final) + n(venta.propina)
  const costoComprasVal = costoCompras(compras)
  const costoGastosExtraVal = costoGastosExtra(gastosExtra)
  const costoTotal = costoComprasVal + costoGastosExtraVal
  const ganancia = ingresoTotal - costoTotal
  const comision = comisionTerceros(venta, ganancia)
  const gananciaNeta = ganancia - comision

  return {
    ingresoTotal,
    costoCompras: costoComprasVal,
    costoGastosExtra: costoGastosExtraVal,
    costoTotal,
    ganancia,
    comisionTerceros: comision,
    gananciaNeta,
  }
}

/** Ganancia = valor cobrado − honorarios − insumos − domicilio */
export function calcularGananciaMantenimiento(
  m: HardtechMantenimientoCalcInput
): GananciaMantenimientoResultado {
  const valorCobrado = n(m.anticipo_monto) + n(m.pago_final_monto)
  const costoTotal = n(m.honorarios_monto) + n(m.insumos_monto) + n(m.domicilio_monto)
  const ganancia = valorCobrado - costoTotal

  return { valorCobrado, costoTotal, ganancia }
}

/**
 * Saldo neto por socio: positivo = HARDTECH le debe al socio (puso más de lo que recibió).
 */
export function calcularSaldoSocios(
  pagos: HardtechPagoSocioCalcInput[],
  sociosCatalogo: { id: string; nombre: string }[] = []
): SaldoSocioResultado[] {
  const map = new Map<string, SaldoSocioResultado>()

  for (const s of sociosCatalogo) {
    map.set(s.id, {
      socio_id: s.id,
      socio_nombre: s.nombre,
      total_puesto: 0,
      total_recibido: 0,
      saldo_neto: 0,
    })
  }

  for (const p of pagos) {
    if (!map.has(p.socio_id)) {
      map.set(p.socio_id, {
        socio_id: p.socio_id,
        socio_nombre: p.socio_nombre ?? p.socio_id,
        total_puesto: 0,
        total_recibido: 0,
        saldo_neto: 0,
      })
    }
    const row = map.get(p.socio_id)!
    if (p.tipo === 'socio_puso_plata') {
      row.total_puesto += p.monto
      row.saldo_neto += p.monto
    } else {
      row.total_recibido += p.monto
      row.saldo_neto -= p.monto
    }
  }

  return [...map.values()].sort((a, b) => a.socio_nombre.localeCompare(b.socio_nombre))
}

export function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}
