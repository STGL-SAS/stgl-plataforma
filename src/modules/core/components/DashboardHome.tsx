import { DashboardAlertas } from './DashboardAlertas'
import {
  DashboardAportesSocios,
  DashboardEvolucionMensual,
  DashboardTareasEstado,
  DashboardUtilidadRepartible,
} from './DashboardSections'
import { computeDashboardForRange } from '../lib/dashboard-compute'
import { resolveDateRange, DEFAULT_DATE_FILTER } from '../lib/dashboard-date-filter'
import type { getDashboardData } from '../lib/dashboard'

type Data = Awaited<ReturnType<typeof getDashboardData>>

export function DashboardHome({ data }: { data: Data }) {
  const range = resolveDateRange(DEFAULT_DATE_FILTER)
  const { movimientosFiltered } = computeDashboardForRange(data, range)

  return (
    <div className="space-y-8">
      <DashboardAlertas alertas={data.alertas} />
      <DashboardEvolucionMensual movimientos={movimientosFiltered} />
      <div className="grid gap-8 lg:grid-cols-2">
        <DashboardAportesSocios aportes={data.aportes} />
        <DashboardTareasEstado tareas={data.tareas} />
      </div>
      <DashboardUtilidadRepartible rows={data.utilidad} />
    </div>
  )
}
