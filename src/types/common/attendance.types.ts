import type { MemberStatusValue } from '@/components/common/StatusBadge'

export interface AttendanceOverviewRow {
  id: string
  full_name: string
  fingerprint_id: string | null
  registration_date: string
  status: MemberStatusValue
  days_attended: number
  last_visit: string | null
}

export interface AttendanceOverviewPage {
  rows: AttendanceOverviewRow[]
  total: number
}

export interface AttendanceDay {
  day: string
  punches: number
  first_punch: string
  last_punch: string
}

export interface MemberAttendance {
  member: {
    id: string
    full_name: string
    fingerprint_id: string | null
    registration_date: string
    status: MemberStatusValue
  }
  today: string
  days: AttendanceDay[]
}
