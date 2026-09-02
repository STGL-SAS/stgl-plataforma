import {
  ConfigHydrexLinks,
  ConfigParticipacion,
  ConfigUsuariosRoles,
} from '@/modules/core/components/ConfiguracionPanels'
import { PlatformShell } from '@/modules/core/components/PlatformShell'
import {
  getParticipaciones,
  getSociosYNegocios,
  getUsuariosRoles,
} from '@/modules/core/lib/configuracion'
import { getConfigAuth } from '@/modules/core/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const auth = await getConfigAuth()

  let participaciones: Awaited<ReturnType<typeof getParticipaciones>> = []
  let usuarios: Awaited<ReturnType<typeof getUsuariosRoles>> = []
  let socios: { id: string; nombre: string }[] = []
  let negocios: { id: string; codigo: string; nombre: string }[] = []
  let error: string | null = null

  try {
    const [p, catalog, u] = await Promise.all([
      getParticipaciones(),
      getSociosYNegocios(),
      getUsuariosRoles(),
    ])
    participaciones = p
    socios = catalog.socios as { id: string; nombre: string }[]
    negocios = catalog.negocios as { id: string; codigo: string; nombre: string }[]
    usuarios = u
  } catch (e) {
    error = e instanceof Error ? e.message : 'Error al cargar configuración'
  }

  return (
    <PlatformShell
      title="Configuración"
      subtitle="Parámetros, participación societaria y roles"
    >
      <div className="space-y-10">
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        <ConfigHydrexLinks />
        <ConfigParticipacion
          initial={participaciones}
          socios={socios}
          negocios={negocios}
          canEdit={auth.isSuperadmin}
        />
        <ConfigUsuariosRoles
          initial={usuarios}
          socios={socios}
          canEdit={auth.isSuperadmin}
        />
      </div>
    </PlatformShell>
  )
}
