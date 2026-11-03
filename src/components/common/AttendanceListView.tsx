import { Link } from 'react-router-dom'
import { withParams } from '@/constants/paths'
import { attendanceStrings, strings } from '@/constants/strings'
import { useAttendanceOverview } from '@/hooks/common/useAttendance'
import { useUrlParams } from '@/hooks/common/useUrlParams'
import type { AttendanceOverviewRow } from '@/types/common/attendance.types'
import { formatDate, formatDateTime } from '@/utils/format'
import { DataTable, type Column } from './DataTable'
import { SearchInput } from './SearchInput'
import { StatusBadge } from './StatusBadge'

interface AttendanceListViewProps {
  /** Route pattern with `:memberId`. */
  detailPath: string
}

export function AttendanceListView({ detailPath }: AttendanceListViewProps) {
  const [params, setParams] = useUrlParams({ page: '1', search: '' })
  const page = Number(params.page)
  const overview = useAttendanceOverview(params.search, page)
  const c = attendanceStrings.columns

  const columns: Column<AttendanceOverviewRow>[] = [
    {
      key: 'name', header: c.name,
      render: (r) => (
        <Link to={withParams(detailPath, { memberId: r.id })} className="font-semibold text-primary underline-offset-2 hover:underline">
          {r.full_name}
        </Link>
      ),
    },
    { key: 'fp', header: c.fingerprint, render: (r) => r.fingerprint_id ?? strings.common.none },
    { key: 'joined', header: c.joined, render: (r) => formatDate(r.registration_date) },
    { key: 'status', header: c.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'days', header: c.days, render: (r) => <span className="font-display text-xl font-bold">{r.days_attended}</span> },
    { key: 'last', header: c.lastVisit, render: (r) => (r.last_visit ? formatDateTime(r.last_visit) : attendanceStrings.noVisits) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={params.search} onChange={(search) => setParams({ search })} label={attendanceStrings.searchLabel} />
      <DataTable
        caption={attendanceStrings.title}
        columns={columns}
        rows={overview.data?.rows ?? []}
        total={overview.data?.total ?? 0}
        page={page}
        onPageChange={(next) => setParams({ page: String(next) }, { resetPage: false })}
        isLoading={overview.isLoading}
        error={overview.error}
        onRetry={() => overview.refetch()}
        getRowKey={(r) => r.id}
      />
    </div>
  )
}
