import { strings } from '@/constants/strings'
import { Button } from './Button'

export const PAGE_SIZE = 10

interface PaginationProps {
  page: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, total, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 p-4 text-sm text-muted">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {strings.common.previous}
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          {strings.common.next}
        </Button>
      </div>
    </nav>
  )
}
