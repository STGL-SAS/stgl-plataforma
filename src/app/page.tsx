import { CommandDashboard } from '@/modules/core/components/CommandDashboard'
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

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10">
        <p className="cmd-panel rounded-xl px-4 py-3 text-sm text-[var(--cmd-decline)]">{error}</p>
        <p className="mt-3 text-sm text-[var(--cmd-text-muted)]">
          Tras <code className="text-xs">supabase db push</code> de las migraciones de dashboard, este
          panel mostrará datos reales.
        </p>
      </div>
    )
  }

  return data ? <CommandDashboard data={data} /> : null
}
