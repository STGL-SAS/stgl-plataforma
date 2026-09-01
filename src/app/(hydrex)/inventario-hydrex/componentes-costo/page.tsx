import { getComponentesCosto, getEnvioTarifas } from '@/modules/inventario-hydrex/lib/queries'
import { ComponentesPageClient } from './ComponentesPageClient'

export const dynamic = 'force-dynamic'

export default async function ComponentesCostoPage() {
  const [componentes, envioTarifas] = await Promise.all([
    getComponentesCosto(undefined, false),
    getEnvioTarifas(false),
  ])
  return <ComponentesPageClient initialComponentes={componentes} initialTarifas={envioTarifas} />
}
