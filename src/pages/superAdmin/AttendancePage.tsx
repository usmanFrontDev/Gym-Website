import { AttendanceListView } from '@/components/common/AttendanceListView'
import { PageContainer } from '@/components/ui/PageContainer'
import { Path } from '@/constants/paths'
import { attendanceStrings } from '@/constants/strings'

export default function AttendancePage() {
  return (
    <PageContainer title={attendanceStrings.title} description={attendanceStrings.subtitle}>
      <AttendanceListView detailPath={Path.AdminAttendanceDetail} />
    </PageContainer>
  )
}
