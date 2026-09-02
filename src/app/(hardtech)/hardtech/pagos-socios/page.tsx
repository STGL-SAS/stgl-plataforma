import {
  getPagosSociosHardtech,
  getSocios,
} from '@/modules/hardtech/lib/queries'
import { PagosSociosPanel } from '@/modules/hardtech/pagos-socios/PagosSociosPanel'

export const dynamic = 'force-dynamic'

export default async function PagosSociosHardtechPage() {
  const [pagos, socios] = await Promise.all([
    getPagosSociosHardtech(),
    getSocios(),
  ])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pagos entre socios — Fondo HARDTECH</h2>
      <p className="text-sm text-zinc-600">
        Plata operativa temporal (no confundir con aportes de capital en Contabilidad → Socios).
      </p>
      <PagosSociosPanel pagos={pagos} socios={socios} />
    </div>
  )
}
