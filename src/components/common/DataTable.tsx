import type { ReactNode } from 'react'
import { QueryState } from './QueryState'
import { Pagination } from './Pagination'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  total: number
  page: number
  onPageChange: (page: number) => void
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
  getRowKey: (row: T) => string
  caption: string
}

export function DataTable<T>({
  columns, rows, total, page, onPageChange, isLoading, error, onRetry, getRowKey, caption,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <QueryState isLoading={isLoading && rows.length === 0} error={error} isEmpty={!isLoading && rows.length === 0} onRetry={onRetry}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="bg-surface-raised text-xs uppercase tracking-wider text-muted">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col" className="whitespace-nowrap px-4 py-3.5 font-semibold">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={isLoading ? 'opacity-60' : undefined}>
              {rows.map((row) => (
                <tr key={getRowKey(row)} className="border-t border-border transition-colors hover:bg-surface-raised/60">
                  {columns.map((c) => (
                    <td key={c.key} className="whitespace-nowrap px-4 py-3.5">
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} onPageChange={onPageChange} />
      </QueryState>
    </div>
  )
}
