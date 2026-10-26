import { useNavigate } from 'react-router-dom'
import { RegisterMemberForm } from '@/components/common/RegisterMemberForm'
import { PageContainer } from '@/components/ui/PageContainer'
import { Path } from '@/constants/paths'
import { memberStrings } from '@/constants/strings'

export default function MemberNewPage() {
  const navigate = useNavigate()
  return (
    <PageContainer title={memberStrings.register}>
      <RegisterMemberForm onRegistered={() => navigate(Path.ManagerMembers)} />
    </PageContainer>
  )
}
