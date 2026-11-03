import { z } from 'zod'
import { moneyField, requiredString } from '../common/primitives'

export const planSchema = z.object({
  name: requiredString('Plan name'),
  price: moneyField.min(1, 'Enter a price'),
  /** Empty means lifetime. */
  months: z.number({ error: 'Enter whole months' }).int('Whole months only').min(1, 'At least 1 month').optional(),
  is_trainer_plan: z.boolean(),
})
export type PlanValues = z.infer<typeof planSchema>

export const planEditSchema = planSchema.pick({ name: true, price: true }).extend({ active: z.boolean() })
export type PlanEditValues = z.infer<typeof planEditSchema>

export const memberDiscountSchema = z.object({ amount: moneyField })
export type MemberDiscountValues = z.infer<typeof memberDiscountSchema>
