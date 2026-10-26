import type { MemberStatusValue } from '@/components/common/StatusBadge'

export interface MemberRow {
  id: string
  full_name: string
  father_name: string | null
  phone: string
  emergency_contact: string | null
  email: string | null
  fingerprint_id: string | null
  registration_date: string
  registered_by: string
  registered_by_name: string
  plan_code: string | null
  due_date: string | null
  status: MemberStatusValue
  last_payment_date: string | null
  trainer_name: string | null
}

export interface MembersKpis {
  total: number
  active: number
  expired: number
  frozen: number
}

export interface MembersPageData {
  rows: MemberRow[]
  total: number
  kpis: MembersKpis
}

export interface MembersFilters {
  page: number
  search: string
  status: string
  plan: string
  from: string
  to: string
  registeredBy?: string
}

export interface Plan {
  code: string
  name: string
  price: number
  months: number | null
  is_trainer_plan: boolean
}

export interface Membership {
  id: string
  member_id: string
  plan_code: string
  anchor_date: string
  months_covered: number
  credit: number
  due_date: string | null
  frozen: boolean
}

export interface MemberRecord {
  id: string
  full_name: string
  father_name: string | null
  phone: string
  emergency_contact: string | null
  email: string | null
  cnic: string | null
  address: string | null
  fingerprint_id: string | null
  blocked: boolean
  registered_by: string
  registration_date: string
}

export interface MemberDetail {
  member: MemberRecord
  membership: Membership | null
  status: MemberStatusValue
  registeredByName: string
  trainerName: string | null
}

export interface PaymentRecord {
  id: string
  amount: number
  admission_fee: number
  discount: number
  paid_on: string
  voided_at: string | null
  void_reason: string | null
}

export interface FreezeRecord {
  id: string
  frozen_on: string
  resumed_on: string | null
}

export interface AssignmentRecord {
  id: string
  start_date: string
  end_date: string | null
  commission_amount: number
  trainer: { full_name: string } | null
}

export interface ActivityRow {
  id: string
  fingerprint_id: string
  punched_at: string
  status: MemberStatusValue
  member: { full_name: string } | null
  profile: { full_name: string } | null
}
