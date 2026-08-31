import { getNegocios, getSocios } from '@/modules/contabilidad/actions/transacciones'
import { SociosPageClient } from './SociosPageClient'

export default async function SociosPage() {
  const [socios, negocios] = await Promise.all([getSocios(), getNegocios()])
  return <SociosPageClient socios={socios} negocios={negocios} />
}
