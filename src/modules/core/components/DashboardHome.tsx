import { DashboardAlertas, DashboardBalanceCards } from './DashboardAlertas'
import {
  DashboardAportesSocios,
  DashboardEvolucionMensual,
  DashboardTareasEstado,
  DashboardUtilidadRepartible,
} from './DashboardSections'
import type { getDashboardData } from '../lib/dashboard'

type Data = Awaited<ReturnType<typeof getDashboardData>>

export function DashboardHome({ data }: { data: Data }) {
  return (
    <div className="space-y-8">
      <DashboardAlertas alertas={data.alertas} />
      <DashboardBalanceCards balances={data.balances} />
      <DashboardEvolucionMensual movimientos={data.movimientos} />
      <div className="grid gap-8 lg:grid-cols-2">
        <DashboardAportesSocios aportes={data.aportes} />
        <DashboardTareasEstado tareas={data.tareas} />
      </div>
      <DashboardUtilidadRepartible rows={data.utilidad} />
    </div>
  )
}
