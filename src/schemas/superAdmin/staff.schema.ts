import { z } from 'zod'
import { cnicField, dateField, emailField, moneyField, phoneField, requiredString } from '../common/primitives'

export const staffSchema = z.object({
  full_name: requiredString('Name'),
  father_name: requiredString('Father name'),
  cnic: cnicField,
  phone: phoneField,
  address: requiredString('Address'),
  email: emailField,
  password: z.union([z.literal(''), z.string().min(8, 'Password must be at least 8 characters')]),
  fingerprint_id: z.string().trim(),
})

export const trainerSchema = staffSchema.extend({
  trainer_type: z.enum(['GYM', 'MARTIAL_ARTS']),
})

export type StaffValues = z.infer<typeof staffSchema>
export type TrainerValues = z.infer<typeof trainerSchema>

export const expenseSchema = z.object({
  category: z.enum(['RENT', 'ELECTRICITY', 'SALARIES', 'EQUIPMENT', 'MAINTENANCE', 'OTHER']),
  amount: moneyField.min(1, 'Enter an amount'),
  spent_on: dateField,
  note: z.string().trim(),
})
export type ExpenseValues = z.infer<typeof expenseSchema>

export const payoutSchema = z.object({
  amount: moneyField.min(1, 'Enter an amount'),
  note: z.string().trim(),
})
export type PayoutValues = z.infer<typeof payoutSchema>
