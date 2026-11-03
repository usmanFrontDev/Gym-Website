import { PAGE_SIZE } from '@/components/common/Pagination'
import { Rpc } from '@/constants/tables'
import type { AttendanceOverviewPage, MemberAttendance } from '@/types/common/attendance.types'
import { supabase, unwrap } from '../supabase-client'

export const attendanceService = {
  async overview(search: string, page: number): Promise<AttendanceOverviewPage> {
    return unwrap(
      await supabase.rpc(Rpc.AttendanceOverview, { p_search: search || null, p_page: page, p_page_size: PAGE_SIZE }),
    ) as AttendanceOverviewPage
  },

  async member(memberId: string): Promise<MemberAttendance> {
    return unwrap(await supabase.rpc(Rpc.MemberAttendance, { p_member_id: memberId })) as MemberAttendance
  },
}
