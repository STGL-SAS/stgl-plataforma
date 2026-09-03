import { getAlertsData } from '@/modules/core/lib/alerts'
import { AlertsBellButton } from '@/components/ui/AlertsBellButton'

export async function BusinessAlertsBell({ negocioCodigo }: { negocioCodigo: string }) {
  const { alertCount, liveFeed } = await getAlertsData(negocioCodigo)
  return <AlertsBellButton count={alertCount} items={liveFeed} />
}
