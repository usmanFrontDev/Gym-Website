import { useNavigate, useParams } from 'react-router-dom'
import { MemberDetailView } from '@/components/common/MemberDetailView'
import { Path } from '@/constants/paths'

export default function MemberDetailPage() {
  const { memberId = '' } = useParams()
  const navigate = useNavigate()
  return <MemberDetailView memberId={memberId} canChangeTrainer canDelete canEdit onDeleted={() => navigate(Path.AdminMembers)} />
}
