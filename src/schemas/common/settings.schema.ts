import { z } from 'zod'
import { moneyField, passwordField, phoneField, requiredString } from './primitives'

export const profileSchema = z.object({
  full_name: requiredString('Name'),
  father_name: z.string().trim(),
  phone: z.union([z.literal(''), phoneField]),
  address: z.string().trim(),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const changePasswordSchema = z
  .object({
    current_password: requiredString('Current password'),
    new_password: passwordField,
    confirm_password: requiredString('Confirm the new password'),
  })
  .refine((v) => v.new_password === v.confirm_password, { path: ['confirm_password'], message: 'Passwords do not match' })
  .refine((v) => v.new_password !== v.current_password, { path: ['new_password'], message: 'Choose a different password' })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export const gymSettingsSchema = z.object({
  gym_name: requiredString('Gym name'),
  phone: z.union([z.literal(''), phoneField]),
  address: z.string().trim(),
  default_admission_fee: moneyField,
})
export type GymSettingsValues = z.infer<typeof gymSettingsSchema>
