import type { AppErrorShape } from '@/types/common/api.types'

export class AppError extends Error implements AppErrorShape {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message, code } = error as { message: unknown; code?: unknown }
    return new AppError(String(message), typeof code === 'string' ? code : undefined)
  }
  return new AppError('Something went wrong')
}
