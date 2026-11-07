import { RecentActivityTable } from '@/components/common/RecentActivityTable'
import { PageContainer } from '@/components/ui/PageContainer'
import { strings } from '@/constants/strings'

export default function DashboardPage() {
  return (
    <PageContainer title={strings.nav.dashboard}>
      <RecentActivityTable showBridge />
    </PageContainer>
  )
}
