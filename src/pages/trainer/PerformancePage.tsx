import { DataTable, type Column } from '@/components/common/DataTable'
import { Badge } from '@/components/common/Badge'
import { TrainerStatsCards } from '@/components/common/TrainerStatsCards'
import { PageContainer } from '@/components/ui/PageContainer'
import { strings } from '@/constants/strings'
import { useClientPagination } from '@/hooks/common/useClientPagination'
import { useTrainerCommissions } from '@/hooks/common/useStats'
import type { TrainerCommissionLine } from '@/types/common/stats.types'
import { formatDate, formatPkr } from '@/utils/format'

export default function PerformancePage() {
  const lines = useTrainerCommissions()
  const { page, total, pageRows, setPage } = useClientPagination(lines.data)
  const columns: Column<TrainerCommissionLine>[] = [
    { key: 'member', header: 'Member', render: (r) => r.member_name },
    { key: 'since', header: 'Assigned since', render: (r) => formatDate(r.start_date) },
    { key: 'rate', header: 'Commission / month', render: (r) => formatPkr(r.commission_amount) },
    { key: 'earned', header: 'Earned', render: (r) => formatPkr(r.earned) },
    { key: 'status', header: 'Status', render: (r) => (r.active ? <Badge tone="success">Current</Badge> : <Badge>Ended</Badge>) },
  ]
  return (
    <PageContainer title={strings.nav.performance}>
      <TrainerStatsCards />
      <DataTable
        caption="Commission per member" columns={columns} rows={pageRows} total={total} page={page} onPageChange={setPage}
        isLoading={lines.isLoading} error={lines.error} onRetry={() => lines.refetch()} getRowKey={(r) => r.assignment_id}
      />
    </PageContainer>
  )
}
