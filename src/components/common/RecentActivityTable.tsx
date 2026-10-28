import { useState } from 'react'
import { useActivity, useActivityRealtime } from '@/hooks/common/useActivity'
import { enableAlertSound } from '@/utils/alertPlayer'
import { useUiStore } from '@/stores/uiStore'
import type { ActivityRow } from '@/types/common/member.types'
import { alertForStatus } from '@/utils/alerts'
import { formatDateTime } from '@/utils/format'
import { Button } from './Button'
import { DataTable, type Column } from './DataTable'
import { StatusBadge } from './StatusBadge'

/** Realtime, paginated, newest first. Shows a punch card for the latest punch. */
export function RecentActivityTable() {
  const [page, setPage] = useState(1)
  const activity = useActivity(page)
  const { soundEnabled, setSoundEnabled } = useUiStore()

  useActivityRealtime(() => {
    setPage(1)
  })

  const latest = page === 1 ? activity.data?.rows[0] : undefined
  const card = latest ?? null
  const cardTone = card && alertForStatus(card.status).sound === 'beep' ? 'border-success text-success' : 'border-danger text-danger'

  const columns: Column<ActivityRow>[] = [
    { key: 'time', header: 'Time', render: (r) => formatDateTime(r.punched_at) },
    { key: 'name', header: 'Name', render: (r) => r.member?.full_name ?? r.profile?.full_name ?? 'Unknown' },
    { key: 'fp', header: 'Fingerprint ID', render: (r) => r.fingerprint_id },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  const handleToggleSound = () => setSoundEnabled(soundEnabled ? false : enableAlertSound())

  return (
    <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="activity-heading" className="text-lg font-bold">Recent activity</h2>
        <Button variant={soundEnabled ? 'secondary' : 'outline'} size="sm" onClick={handleToggleSound} aria-pressed={soundEnabled}>
          {soundEnabled ? 'Sound on (click to mute)' : 'Enable sound'}
        </Button>
      </div>
      {card && (
        <div aria-live="polite" className={`rounded-card border-2 bg-surface p-5 ${cardTone}`}>
          <p className="text-sm text-muted">Latest punch · {formatDateTime(card.punched_at)}</p>
          <p className="text-2xl font-extrabold">{card.member?.full_name ?? card.profile?.full_name ?? 'Unknown fingerprint'}</p>
          <p className="font-semibold">{alertForStatus(card.status).message ?? 'Welcome'}</p>
        </div>
      )}
      <DataTable
        caption="Recent activity"
        columns={columns}
        rows={activity.data?.rows ?? []}
        total={activity.data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isLoading={activity.isLoading}
        error={activity.error}
        onRetry={() => activity.refetch()}
        getRowKey={(r) => r.id}
      />
    </section>
  )
}
