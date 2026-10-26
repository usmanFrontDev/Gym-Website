import { createClient } from '@supabase/supabase-js'
import { env } from '@/constants/env'
import { toAppError } from './appError'

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)

/** Unwraps a Supabase response, normalising any error into AppError. */
export function unwrap<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw toAppError(error)
  return data as T
}
