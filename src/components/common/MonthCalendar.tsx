import { attendanceStrings } from '@/constants/strings'
import type { MonthView } from '@/utils/attendance'

interface MonthCalendarProps {
  view: MonthView
}

/** One month as a Monday-first grid. Attended days are yellow; text labels keep it readable without colour. */
export function MonthCalendar({ view }: MonthCalendarProps) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wider text-muted">
        {attendanceStrings.weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <ol className="mt-1.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: view.leadingBlanks }, (_, i) => (
          <li key={`blank-${i}`} aria-hidden="true" />
        ))}
        {view.cells.map((cell) => {
          const outside = cell.beforeJoin || cell.future
          const tone = cell.attended
            ? 'bg-primary text-primary-foreground font-bold'
            : outside
              ? 'border border-dashed border-border text-border-strong'
              : 'bg-surface-raised text-muted'
          return (
            <li
              key={cell.date}
              aria-label={`${cell.date}: ${cell.attended ? attendanceStrings.legend.attended : outside ? attendanceStrings.legend.outside : attendanceStrings.legend.missed}${cell.scans > 1 ? `, ${cell.scans} scans` : ''}`}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-sm ${tone}`}
            >
              {cell.day}
              {cell.scans > 1 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 rounded-full bg-primary-foreground px-1.5 text-[10px] font-bold leading-4 text-primary"
                >
                  ×{cell.scans}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
