import { ManagerStatsCards } from '@/components/common/ManagerStatsCards'
import { RecentActivityTable } from '@/components/common/RecentActivityTable'
import { PageContainer } from '@/components/ui/PageContainer'
import { strings } from '@/constants/strings'

export default function DashboardPage() {
  return (
    <PageContainer title={strings.nav.dashboard}>
      <ManagerStatsCards />
      <RecentActivityTable showBridge />
    </PageContainer>
  )
}
