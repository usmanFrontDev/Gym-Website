import { QueryState } from '@/components/common/QueryState'
import { useManagerStats } from '@/hooks/common/useStats'
import { formatPkr } from '@/utils/format'
import { KpiCard } from './KpiCard'

/** Manager's own numbers, or any manager's when a SUPER_ADMIN passes `managerId`. */
export function ManagerStatsCards({ managerId }: { managerId?: string }) {
  const stats = useManagerStats(managerId)
  const s = stats.data
  return (
    <QueryState isLoading={stats.isLoading} error={stats.error} onRetry={() => stats.refetch()}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Registered this month" value={s?.registered_month ?? 0} />
        <KpiCard label="Registered total" value={s?.registered_total ?? 0} />
        <KpiCard label="Revenue today" value={formatPkr(s?.revenue_daily ?? 0)} />
        <KpiCard label="Revenue this month" value={formatPkr(s?.revenue_monthly ?? 0)} />
        <KpiCard label="Revenue total" value={formatPkr(s?.revenue_total ?? 0)} />
      </div>
    </QueryState>
  )
}
