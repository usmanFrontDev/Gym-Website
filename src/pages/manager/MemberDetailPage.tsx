import { useParams } from 'react-router-dom'
import { MemberDetailView } from '@/components/common/MemberDetailView'

export default function MemberDetailPage() {
  const { memberId = '' } = useParams()
  return <MemberDetailView memberId={memberId} canChangeTrainer={false} />
}
