import { Link } from 'react-router-dom'
import { MembersView } from '@/components/common/MembersView'
import { PageContainer } from '@/components/ui/PageContainer'
import { Path } from '@/constants/paths'
import { memberStrings, strings } from '@/constants/strings'

export default function MembersPage() {
  return (
    <PageContainer
      title={strings.nav.myMembers}
      actions={
        <Link to={Path.ManagerMemberNew} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          {memberStrings.register}
        </Link>
      }
    >
      <MembersView detailPath={Path.ManagerMemberDetail} />
    </PageContainer>
  )
}
