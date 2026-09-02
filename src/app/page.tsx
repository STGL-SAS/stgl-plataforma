import { PlatformShell } from '@/modules/core/components/PlatformShell'
import { DashboardHome } from '@/modules/core/components/DashboardHome'
import { getDashboardData } from '@/modules/core/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null
  let error: string | null = null

  try {
    data = await getDashboardData()
  } catch (e) {
    error =
      e instanceof Error
        ? e.message
        : 'No se pudo cargar el dashboard. ¿Aplicaste las migraciones de Fase 8?'
  }

  return (
    <PlatformShell
      title="Inicio"
      subtitle="Dashboard general · HYDREX · HARDTECH · HANGARC · VirtualWaiter"
    >
      {error && (
        <div className="space-y-3">
          <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>
          <p className="text-sm text-zinc-600">
            Mientras tanto puedes entrar a los módulos desde la barra superior. Tras{' '}
            <code className="text-xs">supabase db push</code> de las migraciones{' '}
            <code className="text-xs">20260902160000</code> y{' '}
            <code className="text-xs">20260902170000</code>, este panel mostrará datos reales.
          </p>
        </div>
      )}
      {data && <DashboardHome data={data} />}
    </PlatformShell>
  )
}
