import { QueryState } from '@/components/common/QueryState'
import { useTrainerStats } from '@/hooks/common/useStats'
import { formatPkr } from '@/utils/format'
import { KpiCard } from './KpiCard'

export function TrainerStatsCards({ trainerId }: { trainerId?: string }) {
  const stats = useTrainerStats(trainerId)
  const s = stats.data
  return (
    <QueryState isLoading={stats.isLoading} error={stats.error} onRetry={() => stats.refetch()}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Members trained" value={s?.members_trained ?? 0} />
        <KpiCard label="Commission earned" value={formatPkr(s?.commission_earned ?? 0)} />
        <KpiCard label="Paid out" value={formatPkr(s?.commission_paid ?? 0)} />
        <KpiCard label="Balance due" value={formatPkr((s?.commission_earned ?? 0) - (s?.commission_paid ?? 0))} />
      </div>
    </QueryState>
  )
}
