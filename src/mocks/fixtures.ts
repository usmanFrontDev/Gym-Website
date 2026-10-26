import { Role } from '@/constants/roles'
import type { MemberRow, Plan } from '@/types/common/member.types'
import type { Profile } from '@/types/common/user.types'

export const adminProfile: Profile = {
  id: 'admin-1', role: Role.SUPER_ADMIN, full_name: 'Gym Owner', father_name: null, cnic: null, phone: null,
  address: null, email: 'admin@gym.test', trainer_type: null, fingerprint_id: null, blocked: false, deleted_at: null,
  created_at: '2025-01-01T00:00:00Z',
}

export const managerProfile: Profile = { ...adminProfile, id: 'manager-1', role: Role.MANAGER, full_name: 'Bilal Manager', email: 'bilal@gym.test' }

export const plans: Plan[] = [
  { code: 'MONTHLY', name: 'Monthly', price: 2500, months: 1, is_trainer_plan: false },
  { code: 'SIX_MONTH', name: '6-Month', price: 12500, months: 6, is_trainer_plan: false },
  { code: 'TWELVE_MONTH', name: '12-Month', price: 22000, months: 12, is_trainer_plan: false },
  { code: 'LIFETIME', name: 'Lifetime', price: 60000, months: null, is_trainer_plan: false },
  { code: 'TRAINER_8000', name: 'Trainer 8000', price: 8000, months: 1, is_trainer_plan: true },
  { code: 'TRAINER_12000', name: 'Trainer 12000', price: 12000, months: 1, is_trainer_plan: true },
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
