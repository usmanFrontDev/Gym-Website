import { KpiCard } from '@/components/common/KpiCard'
import { QueryState } from '@/components/common/QueryState'
import { RecentActivityTable } from '@/components/common/RecentActivityTable'
import { PageContainer } from '@/components/ui/PageContainer'
import { strings } from '@/constants/strings'
import { useRevenueSummary } from '@/hooks/superAdmin/useAdmin'
import { formatPkr } from '@/utils/format'

export default function DashboardPage() {
  const summary = useRevenueSummary()
  const s = summary.data
  return (
    <PageContainer title={strings.nav.dashboard}>
      <QueryState isLoading={summary.isLoading} error={summary.error} onRetry={() => summary.refetch()}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Revenue today" value={formatPkr(s?.revenue_daily ?? 0)} />
          <KpiCard label="Revenue this month" value={formatPkr(s?.revenue_monthly ?? 0)} />
          <KpiCard label="Revenue total" value={formatPkr(s?.revenue_total ?? 0)} />
          <KpiCard label="Expenses this month" value={formatPkr(s?.expenses_monthly ?? 0)} />
          <KpiCard label="Net this month" value={formatPkr((s?.revenue_monthly ?? 0) - (s?.expenses_monthly ?? 0))} hint="Revenue minus expenses" />
          <KpiCard label="Net total" value={formatPkr((s?.revenue_total ?? 0) - (s?.expenses_total ?? 0))} />
          <KpiCard label="Active members" value={s?.active_members ?? 0} />
          <KpiCard label="Expired members" value={s?.expired_members ?? 0} />
        </div>
      </QueryState>
      <RecentActivityTable />
    </PageContainer>
  )
}
