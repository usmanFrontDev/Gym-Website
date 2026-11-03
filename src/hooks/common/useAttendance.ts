import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { QueryKey } from '@/constants/queryKeys'
import { attendanceService } from '@/services/common/attendanceService'

export function useAttendanceOverview(search: string, page: number) {
  return useQuery({
    queryKey: [QueryKey.AttendanceOverview, search, page],
    queryFn: () => attendanceService.overview(search, page),
    placeholderData: keepPreviousData,
  })
}

export function useMemberAttendance(memberId: string) {
  return useQuery({
    queryKey: [QueryKey.MemberAttendance, memberId],
    queryFn: () => attendanceService.member(memberId),
  })
}
