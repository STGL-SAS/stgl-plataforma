import {
  ConfigHydrexLinks,
  ConfigParticipacion,
  ConfigUsuariosRoles,
} from '@/modules/core/components/ConfiguracionPanels'
import { ConfiguracionShell } from '@/modules/core/components/ConfiguracionShell'
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
    <ConfiguracionShell>
      <div className="space-y-10">
        {error && (
          <p className="cmd-panel rounded-xl px-4 py-3 text-sm text-[var(--cmd-decline)]">{error}</p>
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
    </ConfiguracionShell>
  )
}
