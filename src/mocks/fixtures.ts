import { Role } from '@/constants/roles'
import type { ActivityRow } from '@/types/common/activity.types'
import type { MemberAttendance } from '@/types/common/attendance.types'
import type { DirectoryRow } from '@/types/common/directory.types'
import type { MemberRow, Plan } from '@/types/common/member.types'
import type { Profile } from '@/types/common/user.types'

export const adminProfile: Profile = {
  id: 'admin-1', role: Role.SUPER_ADMIN, full_name: 'Gym Owner', father_name: null, cnic: null, phone: null,
  address: null, email: 'admin@gym.test', trainer_type: null, fingerprint_id: null, blocked: false, deleted_at: null,
  created_at: '2025-01-01T00:00:00Z',
}

export const managerProfile: Profile = { ...adminProfile, id: 'manager-1', role: Role.MANAGER, full_name: 'Bilal Manager', email: 'bilal@gym.test' }

export const plans: Plan[] = [
  { code: 'MONTHLY', name: 'Monthly', price: 2500, months: 1, is_trainer_plan: false, active: true },
  { code: 'SIX_MONTH', name: '6-Month', price: 12500, months: 6, is_trainer_plan: false, active: true },
  { code: 'TWELVE_MONTH', name: '12-Month', price: 22000, months: 12, is_trainer_plan: false, active: true },
  { code: 'LIFETIME', name: 'Lifetime', price: 60000, months: null, is_trainer_plan: false, active: true },
  { code: 'TRAINER_8000', name: 'Trainer 8000', price: 8000, months: 1, is_trainer_plan: true, active: true },
  { code: 'TRAINER_12000', name: 'Trainer 12000', price: 12000, months: 1, is_trainer_plan: true, active: true },
]

export const memberRows: MemberRow[] = [
  {
    id: 'member-1', full_name: 'Ali Raza', father_name: 'Raza', phone: '0301-5555555', emergency_contact: null, email: null,
    fingerprint_id: '501', registration_date: '2025-06-02', registered_by: 'manager-1', registered_by_name: 'Bilal Manager',
    plan_code: 'MONTHLY', due_date: '2025-07-02', status: 'ACTIVE', last_payment_date: '2025-06-02', trainer_name: null,
  },
  {
    id: 'member-2', full_name: 'Sara Khan', father_name: null, phone: '0302-6666666', emergency_contact: null, email: null,
    fingerprint_id: '502', registration_date: '2025-05-01', registered_by: 'manager-1', registered_by_name: 'Bilal Manager',
    plan_code: 'MONTHLY', due_date: '2025-06-01', status: 'EXPIRED', last_payment_date: '2025-05-01', trainer_name: 'Tariq Trainer',
  },
]

export const activityRows: ActivityRow[] = [
  { id: 'a1', at: '2026-04-10T09:00:00Z', fingerprint_id: '12', status: 'ACTIVE', kind: 'GRANTED', name: 'Ali Raza', member_id: 'member-1' },
  { id: 'a2', at: '2026-04-10T08:00:00Z', fingerprint_id: '13', status: 'EXPIRED', kind: 'DENIED', name: 'Sara Khan', member_id: 'member-2' },
  { id: 'm3', at: '2026-04-09T08:00:00Z', fingerprint_id: '14', status: 'ONBOARDED', kind: 'ONBOARDED', name: 'Newcomer Noor', member_id: 'member-3' },
]

export const directoryRows: DirectoryRow[] = [
  { id: 'member-1', full_name: 'Ali Raza', father_name: 'Raza', registration_date: '2025-06-02', last_payment_date: '2025-06-02' },
  { id: 'member-9', full_name: 'Zain Malik', father_name: null, registration_date: '2025-08-15', last_payment_date: null },
]

export const memberAttendance: MemberAttendance = {
  member: { id: 'member-1', full_name: 'Ali Raza', fingerprint_id: '12', registration_date: '2026-02-17', status: 'ACTIVE' },
  today: '2026-04-10',
  days: [
    { day: '2026-02-20', punches: 1, first_punch: '2026-02-20T05:00:00Z', last_punch: '2026-02-20T05:00:00Z' },
    { day: '2026-03-02', punches: 2, first_punch: '2026-03-02T05:00:00Z', last_punch: '2026-03-02T14:00:00Z' },
    { day: '2026-03-03', punches: 1, first_punch: '2026-03-03T05:00:00Z', last_punch: '2026-03-03T05:00:00Z' },
  ],
}

export const gymSettings = { gym_name: 'Try Workout Gym', phone: '03001234567', address: 'Karachi', default_admission_fee: 1000 }

export const discountMembers = [
  { id: 'member-1', full_name: 'Ali Raza', phone: '03001112222', fingerprint_id: '12', monthly_discount: 500 },
  { id: 'member-2', full_name: 'Sara Khan', phone: '03003334444', fingerprint_id: '13', monthly_discount: 0 },
]
