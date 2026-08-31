import { getCategoriasSugeridas } from '@/modules/contabilidad/actions/transacciones'
import { BoldPendientesPageClient } from './BoldPendientesPageClient'

export default async function BoldPendientesPage() {
  const categorias = await getCategoriasSugeridas()
  return <BoldPendientesPageClient categorias={categorias} />
}
