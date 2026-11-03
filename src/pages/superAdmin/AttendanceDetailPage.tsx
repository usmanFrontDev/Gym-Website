import { useParams } from 'react-router-dom'
import { AttendanceDetailView } from '@/components/common/AttendanceDetailView'
import { PageContainer } from '@/components/ui/PageContainer'
import { Path } from '@/constants/paths'
import { attendanceStrings } from '@/constants/strings'

export default function AttendanceDetailPage() {
  const { memberId = '' } = useParams()
  return (
    <PageContainer title={attendanceStrings.title}>
      <AttendanceDetailView memberId={memberId} listPath={Path.AdminAttendance} />
    </PageContainer>
  )
}
