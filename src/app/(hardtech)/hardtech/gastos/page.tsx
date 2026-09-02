import {
  getGastosFijosHardtech,
  getGastosOcasionalesHardtech,
  getSocios,
} from '@/modules/hardtech/lib/queries'
import { GastosHardtechPanel } from '@/modules/hardtech/gastos/GastosHardtechPanel'

export const dynamic = 'force-dynamic'

export default async function GastosHardtechPage() {
  const [gastosFijos, gastosOcasionales, socios] = await Promise.all([
    getGastosFijosHardtech(),
    getGastosOcasionalesHardtech(),
    getSocios(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Gastos HARDTECH</h2>
        <p className="text-sm text-zinc-600">
          Fijos recurrentes y ocasionales. Si los paga un socio con plata personal, se refleja
          automáticamente en Pagos entre socios.
        </p>
      </div>
      <GastosHardtechPanel
        gastosFijos={gastosFijos}
        gastosOcasionales={gastosOcasionales}
        socios={socios}
      />
    </div>
  )
}
