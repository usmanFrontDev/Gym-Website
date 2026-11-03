import { addMonths, format, getDaysInMonth, getISODay, parseISO, startOfMonth } from 'date-fns'

/** Pure helpers for the attendance views. Dates are 'YYYY-MM-DD', months 'YYYY-MM'; `today` is passed in. */

const monthOf = (date: string) => date.slice(0, 7)

/** Every month from the joining month to the current month, newest first. */
export function listMonths(joinDate: string, today: string): string[] {
  const months: string[] = []
  const last = startOfMonth(parseISO(today))
  for (let cursor = startOfMonth(parseISO(joinDate)); cursor <= last; cursor = addMonths(cursor, 1)) {
    months.push(format(cursor, 'yyyy-MM'))
  }
  return months.reverse()
}

export interface CalendarCell {
  date: string
  day: number
  attended: boolean
  /** Granted scans that day (a day counts once however many scans). */
  scans: number
  beforeJoin: boolean
  future: boolean
}

export interface MonthView {
  month: string
  attended: number
  /** Days of this month the member could have come: from joining (or day 1) up to today (or month end). */
  countableDays: number
  /** Blank cells before day 1 when the week starts on Monday. */
  leadingBlanks: number
  cells: CalendarCell[]
}

export function buildMonthView(
  month: string,
  attendedDays: string[],
  joinDate: string,
  today: string,
  scansByDay: Record<string, number> = {},
): MonthView {
  const first = parseISO(`${month}-01`)
  const length = getDaysInMonth(first)
  const attendedSet = new Set(attendedDays)

  const cells: CalendarCell[] = Array.from({ length }, (_, i) => {
    const day = i + 1
    const date = `${month}-${String(day).padStart(2, '0')}`
    return { date, day, attended: attendedSet.has(date), scans: attendedSet.has(date) ? (scansByDay[date] ?? 1) : 0, beforeJoin: date < joinDate, future: date > today }
  })

  return {
    month,
    attended: cells.filter((c) => c.attended).length,
    countableDays: cells.filter((c) => !c.beforeJoin && !c.future).length,
    leadingBlanks: getISODay(first) - 1,
    cells,
  }
}

export interface AttendanceSummary {
  total: number
  byMonth: Record<string, number>
  busiestMonth: string | null
}

export function summarizeMonths(attendedDays: string[]): AttendanceSummary {
  const byMonth: Record<string, number> = {}
  attendedDays.forEach((d) => {
    byMonth[monthOf(d)] = (byMonth[monthOf(d)] ?? 0) + 1
  })
  const busiestMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))[0]?.[0] ?? null
  return { total: attendedDays.length, byMonth, busiestMonth }
}
