import { z } from 'zod'
import { TRAINER_PLANS, PLAN_PRICE, type PlanCode } from '@/utils/billing/plans'
import { cnicField, dateField, emailField, moneyField, phoneField, requiredString } from './primitives'

const optional = <T extends z.ZodType>(schema: T) => z.union([z.literal(''), schema])

const memberBase = z.object({
  full_name: requiredString('Name'),
  father_name: z.string().trim(),
  phone: phoneField,
  emergency_contact: optional(phoneField),
  email: optional(emailField),
  cnic: optional(cnicField),
  address: z.string().trim(),
  fingerprint_id: z.string().trim().min(1, "Scan the member's fingerprint first"),
})

const paymentBase = z.object({
  plan_code: requiredString('Plan'),
  amount: moneyField,
  discount: moneyField,
  start_date: optional(dateField),
})

/** Plan rules shared by registration and renewal. */
function refinePlan(
  value: { plan_code: string; amount: number; trainer_id?: string; commission?: number },
  ctx: z.RefinementCtx,
) {
  const code = value.plan_code as PlanCode
  if (code === 'LIFETIME' && value.amount !== PLAN_PRICE.LIFETIME) {
    ctx.addIssue({ code: 'custom', path: ['amount'], message: `Lifetime must be paid in full (${PLAN_PRICE.LIFETIME})` })
  }
  if (TRAINER_PLANS.includes(code)) {
    if (!value.trainer_id) ctx.addIssue({ code: 'custom', path: ['trainer_id'], message: 'Choose a trainer for this package' })
    if (value.commission === undefined) ctx.addIssue({ code: 'custom', path: ['commission'], message: 'Enter the trainer commission' })
  }
}

export const registerMemberSchema = memberBase
  .extend(paymentBase.shape)
  .extend({
    admission_fee: moneyField,
    trainer_id: z.string(),
    commission: moneyField.optional(),
  })
  .superRefine(refinePlan)

export type RegisterMemberValues = z.infer<typeof registerMemberSchema>

export const recordPaymentSchema = paymentBase.superRefine((value, ctx) => {
  if (value.amount <= 0) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Enter the amount received' })
  refinePlan(value, ctx)
})

export type RecordPaymentValues = z.infer<typeof recordPaymentSchema>

export const voidPaymentSchema = z.object({ reason: requiredString('Reason') })
export type VoidPaymentValues = z.infer<typeof voidPaymentSchema>
