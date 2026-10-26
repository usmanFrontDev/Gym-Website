import { MembersView } from '@/components/common/MembersView'
import { PageContainer } from '@/components/ui/PageContainer'
import { strings } from '@/constants/strings'

export default function MembersPage() {
  return (
    <PageContainer title={strings.nav.myMembers}>
      <MembersView />
    </PageContainer>
  )
}
