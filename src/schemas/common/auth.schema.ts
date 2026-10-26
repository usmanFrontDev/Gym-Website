import { z } from 'zod'
import { emailField, requiredString } from './primitives'

export const loginSchema = z.object({
  email: emailField,
  password: requiredString('Password'),
})

export type LoginValues = z.infer<typeof loginSchema>
