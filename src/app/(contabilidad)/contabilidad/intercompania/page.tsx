import { getNegocios } from '@/modules/contabilidad/actions/transacciones'
import { IntercompaniaPageClient } from './IntercompaniaPageClient'

export default async function IntercompaniaPage() {
  const negocios = await getNegocios()
  return <IntercompaniaPageClient negocios={negocios} />
}
