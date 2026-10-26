import { useParams } from 'react-router-dom'
import { ManagerStatsCards } from '@/components/common/ManagerStatsCards'
import { MembersView } from '@/components/common/MembersView'
import { QueryState } from '@/components/common/QueryState'
import { PageContainer } from '@/components/ui/PageContainer'
import { Path } from '@/constants/paths'
import { useManager } from '@/hooks/superAdmin/useAdmin'

export default function ManagerDetailPage() {
  const { managerId = '' } = useParams()
  const manager = useManager(managerId)
  return (
    <PageContainer title={manager.data?.full_name ?? 'Manager'}>
      <QueryState isLoading={manager.isLoading} error={manager.error}>
        <ManagerStatsCards managerId={managerId} />
        <h2 className="text-lg font-bold">Registered members</h2>
        <MembersView detailPath={Path.AdminMemberDetail} registeredBy={managerId} />
      </QueryState>
    </PageContainer>
  )
}
