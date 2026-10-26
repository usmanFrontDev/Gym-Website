import { PAGE_SIZE } from '@/components/common/Pagination'
import { useUrlParams } from './useUrlParams'

/** For small, fully loaded lists (managers, trainers): slices 10 rows per page, page kept in the URL. */
export function useClientPagination<T>(rows: T[] | undefined) {
  const [params, setParams] = useUrlParams({ page: '1' })
  const page = Number(params.page)
  const all = rows ?? []
  return {
    page,
    total: all.length,
    pageRows: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    setPage: (next: number) => setParams({ page: String(next) }, { resetPage: false }),
  }
}
