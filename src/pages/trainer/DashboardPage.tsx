import { RecentActivityTable } from '@/components/common/RecentActivityTable'
import { TrainerStatsCards } from '@/components/common/TrainerStatsCards'
import { PageContainer } from '@/components/ui/PageContainer'
import { strings } from '@/constants/strings'

export default function DashboardPage() {
  return (
    <PageContainer title={strings.nav.dashboard}>
      <TrainerStatsCards />
      <RecentActivityTable />
    </PageContainer>
  )
}
