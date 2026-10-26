import type { TrainerType } from '@/constants/roles'

export interface RevenueSummary {
  revenue_daily: number
  revenue_monthly: number
  revenue_total: number
  expenses_monthly: number
  expenses_total: number
  active_members: number
  expired_members: number
}

export interface ManagerRow {
  id: string
  full_name: string
  father_name: string | null
  cnic: string | null
  email: string
  phone: string | null
  address: string | null
  blocked: boolean
  registered_month: number
  registered_total: number
  revenue_daily: number
  revenue_monthly: number
  revenue_total: number
}

export interface TrainerRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  trainer_type: TrainerType | null
  blocked: boolean
  members_trained: number
  commission_earned: number
  commission_paid: number
}

export interface PayoutRow {
  id: string
  amount: number
  paid_on: string
  note: string | null
}

export type ExpenseCategoryValue = 'RENT' | 'ELECTRICITY' | 'SALARIES' | 'EQUIPMENT' | 'MAINTENANCE' | 'OTHER'

export interface ExpenseRow {
  id: string
  category: ExpenseCategoryValue
  amount: number
  spent_on: string
  note: string | null
}

export interface ExpenseSummary {
  revenue: number
  expenses: number
  net: number
  by_category: { category: ExpenseCategoryValue; total: number }[]
}

export interface StaffCredentials {
  id?: string
  password: string
}
