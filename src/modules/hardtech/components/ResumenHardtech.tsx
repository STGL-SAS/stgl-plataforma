import { CommandPanel } from '@/components/layout/ModuleShell'
import { getBalancePorNegocio } from '@/modules/contabilidad/actions/balance'
import { formatCOP } from '@/modules/contabilidad/utils'
import { ResumenNegocio } from '@/modules/negocios/components/ResumenNegocio'
import { getResumenNegocioData } from '@/modules/negocios/lib/resumen-data'
import { getHardtechNegocioId, getUtilidadHardtechCalculada } from '@/modules/hardtech/lib/queries'

export async function ResumenHardtech() {
  const negocioId = await getHardtechNegocioId()
  const [balance, utilidadCalculada, resumen] = await Promise.all([
    getBalancePorNegocio(negocioId),
    getUtilidadHardtechCalculada(),
    getResumenNegocioData(negocioId),
  ])

  return (
    <div className="space-y-5">
      <CommandPanel>
        <h2 className="mb-3 text-sm font-semibold text-[var(--cmd-text)]">Utilidad operativa HARDTECH</h2>
        <p className="font-display text-3xl font-semibold text-[var(--cmd-text)]">
          {formatCOP(utilidadCalculada)}
        </p>
        <p className="mt-2 text-xs text-[var(--cmd-text-dim)]">
          Ganancia neta de ventas y mantenimientos cerrados, menos gastos fijos y ocasionales del
          módulo HARDTECH. No sale del ledger de transacciones.
        </p>
      </CommandPanel>

      <CommandPanel>
        <h2 className="mb-4 text-sm font-semibold text-[var(--cmd-text)]">Ledger (transacciones clasificadas)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Ingresos del mes', value: formatCOP(balance.ingresos_mes) },
            { label: 'Egresos del mes', value: formatCOP(balance.egresos_mes) },
            { label: 'Saldo del mes', value: formatCOP(balance.saldo_mes) },
            { label: 'Saldo acumulado', value: formatCOP(balance.saldo_acumulado) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[var(--cmd-border)] bg-black/20 px-4 py-3"
            >
              <p className="text-[11px] text-[var(--cmd-text-dim)]">{item.label}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--cmd-text)]">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--cmd-text-dim)]">
          HARDTECH normalmente no mueve dinero por el ledger; la utilidad real está arriba.
        </p>
      </CommandPanel>

      <ResumenNegocio
        negocioId={negocioId}
        baseHref="/hardtech"
        data={resumen}
        showBalance={false}
        showTareas
        sectionLinks={{
          gastos: '/hardtech/gastos',
          tareas: '/hardtech/tareas',
          documentos: '/hardtech/documentos',
        }}
      />
    </div>
  )
}
