import { describe, expect, it } from 'vitest'
import { recordPaymentSchema, registerMemberSchema } from './member.schema'

const valid = {
  full_name: 'Ali Raza', father_name: '', phone: '0301-5555555', emergency_contact: '', email: '', cnic: '', address: '',
  fingerprint_id: '501', plan_code: 'MONTHLY', amount: 2500, discount: 0, start_date: '2025-06-02', admission_fee: 1000,
  trainer_id: '', commission: undefined, payment_method: 'CASH',
}

describe('registerMemberSchema', () => {
  it('accepts a plain monthly registration', () => {
    expect(registerMemberSchema.safeParse(valid).success).toBe(true)
  })
  it('allows admission fee 0', () => {
    expect(registerMemberSchema.safeParse({ ...valid, admission_fee: 0 }).success).toBe(true)
  })
  it('rejects lifetime unless paid in full', () => {
    expect(registerMemberSchema.safeParse({ ...valid, plan_code: 'LIFETIME', amount: 30000 }).success).toBe(false)
    expect(registerMemberSchema.safeParse({ ...valid, plan_code: 'LIFETIME', amount: 60000 }).success).toBe(true)
  })
  it('requires a trainer and commission for trainer packages', () => {
    const result = registerMemberSchema.safeParse({ ...valid, plan_code: 'TRAINER_8000', amount: 8000 })
    expect(result.success).toBe(false)
    const ok = registerMemberSchema.safeParse({ ...valid, plan_code: 'TRAINER_8000', amount: 8000, trainer_id: 't1', commission: 3000 })
    expect(ok.success).toBe(true)
  })
  it('requires a scanned fingerprint', () => {
    const result = registerMemberSchema.safeParse({ ...valid, fingerprint_id: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['fingerprint_id'])
  })
  it('accepts cash or online but no other payment type', () => {
    expect(registerMemberSchema.safeParse({ ...valid, payment_method: 'ONLINE' }).success).toBe(true)
    expect(registerMemberSchema.safeParse({ ...valid, payment_method: 'CHEQUE' }).success).toBe(false)
    expect(registerMemberSchema.safeParse({ ...valid, payment_method: undefined }).success).toBe(false)
  })
  it('rejects a bad phone number', () => {
    expect(registerMemberSchema.safeParse({ ...valid, phone: 'abc' }).success).toBe(false)
  })
})

describe('recordPaymentSchema', () => {
  it('needs a positive amount', () => {
    expect(recordPaymentSchema.safeParse({ plan_code: 'MONTHLY', amount: 0, discount: 0, start_date: '', payment_method: 'CASH' }).success).toBe(false)
    expect(recordPaymentSchema.safeParse({ plan_code: 'MONTHLY', amount: 2500, discount: 0, start_date: '', payment_method: 'CASH' }).success).toBe(true)
  })
})
