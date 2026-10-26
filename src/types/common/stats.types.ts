export interface ManagerStats {
  registered_total: number
  registered_month: number
  revenue_daily: number
  revenue_monthly: number
  revenue_total: number
}

export interface TrainerStats {
  members_trained: number
  commission_earned: number
  commission_paid: number
}

export interface TrainerCommissionLine {
  assignment_id: string
  member_id: string
  member_name: string
  commission_amount: number
  start_date: string
  active: boolean
  earned: number
}
