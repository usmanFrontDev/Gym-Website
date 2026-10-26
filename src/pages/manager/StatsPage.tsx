import { ManagerStatsCards } from '@/components/common/ManagerStatsCards'
import { PageContainer } from '@/components/ui/PageContainer'
import { strings } from '@/constants/strings'

export default function StatsPage() {
  return (
    <PageContainer title={strings.nav.stats}>
      <ManagerStatsCards />
    </PageContainer>
  )
}
