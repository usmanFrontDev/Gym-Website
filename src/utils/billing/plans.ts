export type PlanCode = 'MONTHLY' | 'SIX_MONTH' | 'TWELVE_MONTH' | 'LIFETIME' | 'TRAINER_8000' | 'TRAINER_12000'

export const PLAN_PRICE: Record<PlanCode, number> = {
  MONTHLY: 2500,
  SIX_MONTH: 12500,
  TWELVE_MONTH: 22000,
  LIFETIME: 60000,
  TRAINER_8000: 8000,
  TRAINER_12000: 12000,
}

/** Months covered by one paid period of the plan. Lifetime never expires. */
export const PLAN_MONTHS: Record<PlanCode, number | null> = {
  MONTHLY: 1,
  SIX_MONTH: 6,
  TWELVE_MONTH: 12,
  LIFETIME: null,
  TRAINER_8000: 1,
  TRAINER_12000: 1,
}

/** Trainer packages are monthly only and include the 2500 gym fee. */
export const TRAINER_PLANS: PlanCode[] = ['TRAINER_8000', 'TRAINER_12000']

export const DEFAULT_ADMISSION_FEE = 1000
export const ADMISSION_GRACE_MONTHS = 6
