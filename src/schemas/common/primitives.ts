import { z } from 'zod'

export const requiredString = (label: string) => z.string().trim().min(1, `${label} is required`)
export const emailField = z.email('Enter a valid email')
export const phoneField = z.string().trim().regex(/^[0-9+\-\s]{7,16}$/, 'Enter a valid phone number')
export const passwordField = z.string().min(8, 'Password must be at least 8 characters')
export const cnicField = z.string().trim().regex(/^\d{5}-?\d{7}-?\d$/, 'Enter a valid CNIC (13 digits)')
export const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date')
export const moneyField = z.number({ error: 'Enter an amount' }).int('Whole rupees only').min(0, 'Cannot be negative')
