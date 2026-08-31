import {
  getCategoriasSugeridas,
  getNegocios,
} from '@/modules/contabilidad/actions/transacciones'
import { TransaccionesPageClient } from './TransaccionesPageClient'

export default async function TransaccionesPage() {
  const [negocios, categorias] = await Promise.all([
    getNegocios(),
    getCategoriasSugeridas(),
  ])

  return <TransaccionesPageClient negocios={negocios} categorias={categorias} />
}
