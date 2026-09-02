import {
  getMovimientosDivisas,
  getSaldoDivisasUsd,
  getUltimaTasaCambio,
} from '@/modules/hardtech/lib/queries'
import { DivisasSaldoPanel } from '@/modules/hardtech/components/DivisasSaldoPanel'

export const dynamic = 'force-dynamic'

export default async function DivisasHardtechPage() {
  const [saldoUsd, tasaReciente, movimientos] = await Promise.all([
    getSaldoDivisasUsd(),
    getUltimaTasaCambio(),
    getMovimientosDivisas(),
  ])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Cuenta de divisas (USD)</h2>
      <DivisasSaldoPanel saldoUsd={saldoUsd} tasaReciente={tasaReciente} movimientos={movimientos} />
    </div>
  )
}
