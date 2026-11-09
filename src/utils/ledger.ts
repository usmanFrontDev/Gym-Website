import { endOfMonth, endOfYear, format, parseISO, startOfMonth, startOfYear } from 'date-fns'
import { expenseLabels, paymentMethodStrings } from '@/constants/strings'
import type { ExpenseCategoryValue, LedgerRow, LedgerView } from '@/types/superAdmin/admin.types'

const ymd = (d: Date) => format(d, 'yyyy-MM-dd')

/** The [from, to] dates a ledger tab covers around the chosen day; null bounds mean all time. */
export function ledgerRange(view: LedgerView, day: string): [string | null, string | null] {
  const d = parseISO(day)
  if (view === 'daily') return [day, day]
  if (view === 'monthly') return [ymd(startOfMonth(d)), ymd(endOfMonth(d))]
  if (view === 'yearly') return [ymd(startOfYear(d)), ymd(endOfYear(d))]
  return [null, null]
}

const csvCell = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Spreadsheet-friendly export of the visible ledger lines. */
export function ledgerCsv(rows: LedgerRow[]): string {
  const lines = rows.map((r) =>
    [
      r.day,
      r.kind === 'INCOME' ? 'Income' : 'Expense',
      r.kind === 'EXPENSE' ? (expenseLabels[r.label as ExpenseCategoryValue] ?? r.label) : r.label,
      r.method ? paymentMethodStrings.labels[r.method] : '',
      r.note ?? '',
      r.amount,
    ].map(csvCell).join(','),
  )
  return ['Date,Type,Details,Payment type,Note,Amount', ...lines].join('\n')
}
