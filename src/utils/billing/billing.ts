import { addMonths, format, parseISO } from 'date-fns'
import { ADMISSION_GRACE_MONTHS, PLAN_MONTHS, PLAN_PRICE, type PlanCode } from './plans'

/** Dates are 'YYYY-MM-DD' strings. `today` is passed in (Asia/Karachi), never read here. */
export type DateString = string
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'BLOCKED'

const toDate = (value: DateString) => parseISO(value)
const toString = (value: Date) => format(value, 'yyyy-MM-dd')

/** Always computed from the cycle anchor so month-end never drifts. */
export function addMonthsFromAnchor(anchorDate: DateString, months: number): DateString {
  return toString(addMonths(toDate(anchorDate), months))
}

export interface ApplyPaymentInput {
  plan: PlanCode
  payment: number
  credit: number
  anchorDate: DateString
  /** Months of this cycle already paid before this payment. */
  monthsAlreadyCovered: number
}

export interface ApplyPaymentResult {
  periods: number
  /** Total months paid in this cycle. 0 means credit only: no access. */
  coveredMonths: number
  credit: number
  /** null for lifetime: never expires. */
  dueDate: DateString | null
}

export interface ApplyPaymentAtPriceInput {
  /** What one paid period costs this member (after any monthly discount). */
  price: number
  /** Months covered by one period, null for lifetime. */
  monthsPerPeriod: number | null
  payment: number
  credit: number
  anchorDate: DateString
  monthsAlreadyCovered: number
}

/** The credit model for any plan, built-in or added by the owner. Mirrors the Postgres RPC. */
export function applyPaymentAtPrice(input: ApplyPaymentAtPriceInput): ApplyPaymentResult {
  const { price, monthsPerPeriod, payment, credit, anchorDate, monthsAlreadyCovered } = input

  if (monthsPerPeriod === null) {
    if (payment !== price) throw new Error(`Lifetime requires exactly ${price}`)
    return { periods: 1, coveredMonths: 0, credit: 0, dueDate: null }
  }

  const total = credit + payment
  const periods = Math.floor(total / price)
  const coveredMonths = monthsAlreadyCovered + periods * monthsPerPeriod
  return {
    periods,
    coveredMonths,
    credit: total - periods * price,
    dueDate: addMonthsFromAnchor(anchorDate, coveredMonths),
  }
}

/** Plan price for one member: price minus (monthly discount x months). Lifetime is never discounted. */
export function effectivePrice(plan: { price: number; months: number | null }, monthlyDiscount: number): number {
  if (plan.months === null) return plan.price
  return Math.max(1, plan.price - monthlyDiscount * plan.months)
}

export function applyPayment(input: ApplyPaymentInput): ApplyPaymentResult {
  const { plan, ...rest } = input
  return applyPaymentAtPrice({ ...rest, price: PLAN_PRICE[plan], monthsPerPeriod: PLAN_MONTHS[plan] })
}

export interface MembershipStatusInput {
  dueDate: DateString | null | undefined
  today: DateString
  /** 0 = credit only, which gives no access. */
  coveredMonths?: number
  frozen?: boolean
  blocked?: boolean
}

/** Valid through 11:59 PM on the due date, grace period 0. */
export function computeMembershipStatus(input: MembershipStatusInput): MembershipStatus {
  if (input.blocked) return 'BLOCKED'
  if (input.frozen) return 'FROZEN'
  if (input.dueDate === null) return 'ACTIVE'
  if (input.coveredMonths === 0) return 'EXPIRED'
  if (input.dueDate === undefined) return 'EXPIRED'
  return input.today <= input.dueDate ? 'ACTIVE' : 'EXPIRED'
}

export interface ResumeInput {
  resumeDate: DateString
  monthsPerPeriod: number
}

/** On resume a fresh cycle starts from the resume date; unused days are forgiven. */
export function resumeFromFreeze({ resumeDate, monthsPerPeriod }: ResumeInput) {
  return {
    anchorDate: resumeDate,
    dueDate: addMonthsFromAnchor(resumeDate, monthsPerPeriod),
  }
}

export interface AdmissionFeeInput {
  defaultFee: number
  discount: number
  lastExpiry: DateString | null
  today: DateString
}

/** Waived within 6 months of the last expiry; discount applies to this fee only. */
export function computeAdmissionFee({ defaultFee, discount, lastExpiry, today }: AdmissionFeeInput): number {
  if (lastExpiry !== null && today <= addMonthsFromAnchor(lastExpiry, ADMISSION_GRACE_MONTHS)) return 0
  return Math.max(0, defaultFee - discount)
}
