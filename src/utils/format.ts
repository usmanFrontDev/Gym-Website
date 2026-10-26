import { format, parseISO } from 'date-fns'

/** 'YYYY-MM-DD' for the current day in Asia/Karachi. `now` is injectable for tests. */
export function todayKarachi(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(now)
}

export function formatPkr(amount: number): string {
  return `Rs ${amount.toLocaleString('en-US')}`
}

export function formatDate(value: string | null | undefined): string {
  return value ? format(parseISO(value), 'dd MMM yyyy') : '---'
}

export function formatDateTime(value: string): string {
  return format(parseISO(value), 'dd MMM yyyy, hh:mm a')
}
