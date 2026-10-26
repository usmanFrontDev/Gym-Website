import { describe, expect, it } from 'vitest'
import {
  addMonthsFromAnchor,
  applyPayment,
  computeAdmissionFee,
  computeMembershipStatus,
  resumeFromFreeze,
} from './billing'
import { PLAN_PRICE } from './plans'

describe('addMonthsFromAnchor', () => {
  it('31 Jan month-end: 1 month lands on 28 Feb, 2 months on 31 Mar (no drift)', () => {
    expect(addMonthsFromAnchor('2025-01-31', 1)).toBe('2025-02-28')
    expect(addMonthsFromAnchor('2025-01-31', 2)).toBe('2025-03-31')
  })
  it('leap year: 31 Jan 2024 + 1 month = 29 Feb', () => {
    expect(addMonthsFromAnchor('2024-01-31', 1)).toBe('2024-02-29')
  })
  it('2 Jun + 1 month = 2 Jul', () => {
    expect(addMonthsFromAnchor('2025-06-02', 1)).toBe('2025-07-02')
  })
})

describe('applyPayment (credit model)', () => {
  it('5000 on Monthly = 2 months, credit 0', () => {
    const r = applyPayment({ plan: 'MONTHLY', payment: 5000, credit: 0, anchorDate: '2025-06-02', monthsAlreadyCovered: 0 })
    expect(r.periods).toBe(2)
    expect(r.credit).toBe(0)
    expect(r.dueDate).toBe('2025-08-02')
  })
  it('3000 on Monthly = 1 month + 500 credit', () => {
    const r = applyPayment({ plan: 'MONTHLY', payment: 3000, credit: 0, anchorDate: '2025-06-02', monthsAlreadyCovered: 0 })
    expect(r.periods).toBe(1)
    expect(r.credit).toBe(500)
    expect(r.dueDate).toBe('2025-07-02')
  })
  it('credit alone gives no access: 2000 with 0 periods stays as credit', () => {
    const r = applyPayment({ plan: 'MONTHLY', payment: 2000, credit: 0, anchorDate: '2025-06-02', monthsAlreadyCovered: 0 })
    expect(r.periods).toBe(0)
    expect(r.credit).toBe(2000)
    expect(r.dueDate).toBe('2025-06-02')
  })
  it('500 credit + 2000 payment completes another month', () => {
    const r = applyPayment({ plan: 'MONTHLY', payment: 2000, credit: 500, anchorDate: '2025-06-02', monthsAlreadyCovered: 1 })
    expect(r.periods).toBe(1)
    expect(r.credit).toBe(0)
    expect(r.dueDate).toBe('2025-08-02')
  })
  it('late payment 7 Jul continues the cycle: due 2 Jul -> next due 2 Aug', () => {
    const r = applyPayment({ plan: 'MONTHLY', payment: 2500, credit: 0, anchorDate: '2025-06-02', monthsAlreadyCovered: 1 })
    expect(r.dueDate).toBe('2025-08-02')
  })
  it('6-month plan: 12500 = 6 months', () => {
    const r = applyPayment({ plan: 'SIX_MONTH', payment: 12500, credit: 0, anchorDate: '2025-01-31', monthsAlreadyCovered: 0 })
    expect(r.dueDate).toBe('2025-07-31')
  })
  it('12-month plan: 22000 = 12 months', () => {
    const r = applyPayment({ plan: 'TWELVE_MONTH', payment: 22000, credit: 0, anchorDate: '2025-01-15', monthsAlreadyCovered: 0 })
    expect(r.dueDate).toBe('2026-01-15')
  })
  it('lifetime: exactly 60000 required, never expires', () => {
    const r = applyPayment({ plan: 'LIFETIME', payment: PLAN_PRICE.LIFETIME, credit: 0, anchorDate: '2025-06-02', monthsAlreadyCovered: 0 })
    expect(r.dueDate).toBeNull()
    expect(() =>
      applyPayment({ plan: 'LIFETIME', payment: 30000, credit: 0, anchorDate: '2025-06-02', monthsAlreadyCovered: 0 }),
    ).toThrow()
  })
})

describe('computeMembershipStatus', () => {
  it('valid through the due date, expired the day after (grace 0)', () => {
    expect(computeMembershipStatus({ dueDate: '2025-07-02', today: '2025-07-02' })).toBe('ACTIVE')
    expect(computeMembershipStatus({ dueDate: '2025-07-02', today: '2025-07-03' })).toBe('EXPIRED')
  })
  it('lifetime (no due date) is always active', () => {
    expect(computeMembershipStatus({ dueDate: null, today: '2099-01-01' })).toBe('ACTIVE')
  })
  it('frozen and blocked override expiry', () => {
    expect(computeMembershipStatus({ dueDate: '2025-07-02', today: '2025-09-01', frozen: true })).toBe('FROZEN')
    expect(computeMembershipStatus({ dueDate: '2025-07-02', today: '2025-06-10', blocked: true })).toBe('BLOCKED')
  })
  it('credit only (0 months covered) gives no access even on the anchor day', () => {
    expect(computeMembershipStatus({ dueDate: '2025-06-02', today: '2025-06-02', coveredMonths: 0 })).toBe('EXPIRED')
  })
  it('no membership yet is EXPIRED', () => {
    expect(computeMembershipStatus({ dueDate: undefined, today: '2025-06-10' })).toBe('EXPIRED')
  })
})

describe('resumeFromFreeze', () => {
  it('paid 2 Jun, freeze 28 Jun, resume 18 Jul -> next due 18 Aug', () => {
    expect(resumeFromFreeze({ resumeDate: '2025-07-18', monthsPerPeriod: 1 })).toEqual({
      anchorDate: '2025-07-18',
      dueDate: '2025-08-18',
    })
  })
})

describe('computeAdmissionFee', () => {
  const base = { defaultFee: 1000, discount: 0 }
  it('first registration charges the full fee', () => {
    expect(computeAdmissionFee({ ...base, lastExpiry: null, today: '2025-06-01' })).toBe(1000)
  })
  it('returning within 6 months is not charged again', () => {
    expect(computeAdmissionFee({ ...base, lastExpiry: '2025-01-10', today: '2025-07-10' })).toBe(0)
  })
  it('returning after more than 6 months is charged again', () => {
    expect(computeAdmissionFee({ ...base, lastExpiry: '2025-01-10', today: '2025-07-11' })).toBe(1000)
  })
  it('discount applies to admission fee only and never goes below 0', () => {
    expect(computeAdmissionFee({ defaultFee: 1000, discount: 300, lastExpiry: null, today: '2025-06-01' })).toBe(700)
    expect(computeAdmissionFee({ defaultFee: 1000, discount: 5000, lastExpiry: null, today: '2025-06-01' })).toBe(0)
  })
})
