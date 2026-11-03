import { format, parseISO } from 'date-fns'
import { ArrowLeft, CalendarCheck, CalendarDays, Clock, Flame, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { attendanceStrings, strings } from '@/constants/strings'
import { useMemberAttendance } from '@/hooks/common/useAttendance'
import { buildMonthView, listMonths, summarizeMonths } from '@/utils/attendance'
import { formatDate, formatDateTime } from '@/utils/format'
import { KpiCard } from './KpiCard'
import { MonthCalendar } from './MonthCalendar'
import { QueryState } from './QueryState'
import { StatusBadge } from './StatusBadge'

interface AttendanceDetailViewProps {
  memberId: string
  listPath: string
}

const monthLabel = (month: string) => format(parseISO(`${month}-01`), 'MMMM yyyy')
const timeOf = (value: string) => format(parseISO(value), 'hh:mm a')

/** Joining month to current month, each month expandable into a calendar of the days the member came. */
export function AttendanceDetailView({ memberId, listPath }: AttendanceDetailViewProps) {
  const attendance = useMemberAttendance(memberId)
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})
  const data = attendance.data

  const days = data?.days ?? []
  const dayKeys = days.map((d) => d.day)
  const today = data?.today ?? ''
  const join = data?.member.registration_date ?? ''
  const months = data ? listMonths(join, today) : []
  const scansByDay = Object.fromEntries(days.map((d) => [d.day, d.punches]))
  const summary = summarizeMonths(dayKeys)
  const lastDay = days.at(-1)

  const handleToggle = (month: string, isOpenNow: boolean) => setOpenMonths((prev) => ({ ...prev, [month]: !isOpenNow }))

  return (
    <div className="flex flex-col gap-6">
      <Link to={listPath} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-primary">
        <ArrowLeft aria-hidden="true" size={16} />
        {attendanceStrings.back}
      </Link>

      <QueryState isLoading={attendance.isLoading} error={attendance.error} onRetry={() => attendance.refetch()}>
        {data && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide">{data.member.full_name}</h2>
              <StatusBadge status={data.member.status} />
              <span className="text-sm text-muted">
                ID {data.member.fingerprint_id ?? strings.common.none} · Joined {formatDate(join)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard icon={CalendarCheck} label={attendanceStrings.totalDays} value={summary.total} />
              <KpiCard icon={CalendarDays} label={attendanceStrings.monthsActive} value={months.length} />
              <KpiCard icon={Flame} label={attendanceStrings.busiest} value={summary.busiestMonth ? monthLabel(summary.busiestMonth) : '---'} />
              <KpiCard icon={Clock} label={attendanceStrings.lastVisit} value={lastDay ? formatDate(lastDay.day) : '---'} />
            </div>

            <p className="text-sm text-muted">
              {attendanceStrings.detailSubtitle} {attendanceStrings.multiScanHint}
            </p>

            <ul className="flex flex-col gap-3">
              {months.map((month, index) => {
                const view = buildMonthView(month, dayKeys, join, today, scansByDay)
                const open = openMonths[month] ?? index === 0
                const percent = view.countableDays ? Math.round((view.attended / view.countableDays) * 100) : 0
                const monthDays = days.filter((d) => d.day.startsWith(month))
                const panelId = `month-${month}`
                return (
                  <li key={month} className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => handleToggle(month, open)}
                      className="flex w-full cursor-pointer items-center gap-4 p-4 text-left transition-colors hover:bg-surface-raised/60"
                    >
                      <span className="min-w-36 font-display text-xl font-bold uppercase tracking-wide">{monthLabel(month)}</span>
                      <progress
                        value={percent}
                        max={100}
                        aria-hidden="true"
                        className="hidden h-2 flex-1 appearance-none overflow-hidden rounded-full sm:block [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-surface-raised [&::-webkit-progress-value]:bg-primary"
                      />
                      <span className="ml-auto text-sm font-semibold">{attendanceStrings.monthDays(view.attended, view.countableDays)}</span>
                      <ChevronDown aria-hidden="true" size={18} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>

                    {open && (
                      <div id={panelId} className="grid gap-6 border-t border-border p-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
                        <MonthCalendar view={view} />
                        <div>
                          {monthDays.length === 0 ? (
                            <p className="text-sm text-muted">{attendanceStrings.noVisits}</p>
                          ) : (
                            <ul className="divide-y divide-border text-sm">
                              {monthDays.map((d) => (
                                <li key={d.day} className="flex items-center justify-between gap-3 py-2">
                                  <span className="font-semibold">{format(parseISO(d.day), 'EEE, dd MMM')}</span>
                                  <span className="text-muted" title={formatDateTime(d.first_punch)}>
                                    {attendanceStrings.firstLast(timeOf(d.first_punch), timeOf(d.last_punch), d.punches)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </QueryState>
    </div>
  )
}
