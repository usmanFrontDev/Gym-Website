import { Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { activityStrings } from '@/constants/strings'
import { useActivity, useActivityRealtime } from '@/hooks/common/useActivity'
import { useUrlParams } from '@/hooks/common/useUrlParams'
import { useUiStore } from '@/stores/uiStore'
import type { ActivityKind, ActivityRow } from '@/types/common/activity.types'
import { enableAlertSound } from '@/utils/alertPlayer'
import { formatDateTime } from '@/utils/format'
import { Badge } from './Badge'
import { BridgeStatusCard } from './BridgeStatusCard'
import { Button } from './Button'
import { DataTable, type Column } from './DataTable'
import { ScanCard } from './ScanCard'
import { SearchInput } from './SearchInput'

interface RecentActivityTableProps {
  /** Bridge heartbeat is visible to super admins and managers only. */
  showBridge?: boolean
}

const KINDS: (ActivityKind | '')[] = ['', 'GRANTED', 'DENIED', 'ONBOARDED']
const countKey = { '': 'all', GRANTED: 'granted', DENIED: 'denied', ONBOARDED: 'onboarded' } as const
const kindTone = { ONBOARDED: 'primary', GRANTED: 'success', DENIED: 'danger' } as const

/** Live scanner feed: bridge status and latest scan on the left, filterable decision log on the right. */
export function RecentActivityTable({ showBridge = false }: RecentActivityTableProps) {
  const [params, setParams] = useUrlParams({ page: '1', kind: '', search: '' })
  const filters = { page: Number(params.page), kind: params.kind as ActivityKind | '', search: params.search }
  const activity = useActivity(filters)
  const { soundEnabled, setSoundEnabled } = useUiStore()
  const [livePunch, setLivePunch] = useState<ActivityRow | null>(null)

  useActivityRealtime((row) => {
    setLivePunch(row)
    setParams({ page: '1' }, { resetPage: false })
  })

  const rows = activity.data?.rows ?? []
  const counts = activity.data?.counts
  const scan = livePunch ?? rows.find((r) => r.kind !== 'ONBOARDED') ?? null
  const c = activityStrings.columns

  const columns: Column<ActivityRow>[] = [
    { key: 'time', header: c.time, render: (r) => formatDateTime(r.at) },
    { key: 'name', header: c.name, render: (r) => <span className="font-semibold">{r.name ?? 'Unknown'}</span> },
    { key: 'fp', header: c.fingerprint, render: (r) => r.fingerprint_id ?? '---' },
    { key: 'kind', header: c.decision, render: (r) => <Badge tone={kindTone[r.kind]}>{activityStrings.kinds[r.kind]}</Badge> },
    { key: 'detail', header: c.detail, render: (r) => <span className="text-muted">{activityStrings.details[r.status]}</span> },
  ]

  const handleToggleSound = () => setSoundEnabled(soundEnabled ? false : enableAlertSound())
  const handleKindClick = (kind: ActivityKind | '') => setParams({ kind })
  const handlePageChange = (page: number) => setParams({ page: String(page) }, { resetPage: false })

  return (
    <section aria-labelledby="activity-heading" className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <ScanCard scan={scan} />
        {showBridge && <BridgeStatusCard />}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="activity-heading" className="font-display text-2xl font-bold uppercase tracking-wider">
              {activityStrings.title}
            </h2>
            <p className="text-sm text-muted">{activityStrings.subtitle}</p>
          </div>
          <Button variant={soundEnabled ? 'secondary' : 'outline'} size="sm" onClick={handleToggleSound} aria-pressed={soundEnabled}>
            {soundEnabled ? <Volume2 aria-hidden="true" size={16} /> : <VolumeX aria-hidden="true" size={16} />}
            {soundEnabled ? activityStrings.soundOn : activityStrings.soundOff}
          </Button>
        </div>

        <div role="group" aria-label="Filter by decision" className="flex flex-wrap gap-2">
          {KINDS.map((kind) => {
            const active = params.kind === kind
            return (
              <button
                key={kind || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => handleKindClick(kind)}
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-raised'
                }`}
              >
                {kind ? activityStrings.filters[kind] : activityStrings.filters.all}
                {counts && <span className={active ? 'text-primary-foreground/70' : 'text-muted'}>{counts[countKey[kind]]}</span>}
              </button>
            )
          })}
        </div>

        <SearchInput value={params.search} onChange={(search) => setParams({ search })} label={activityStrings.searchLabel} />

        <DataTable
          caption={activityStrings.title}
          columns={columns}
          rows={rows}
          total={activity.data?.total ?? 0}
          page={filters.page}
          onPageChange={handlePageChange}
          isLoading={activity.isLoading}
          error={activity.error}
          onRetry={() => activity.refetch()}
          getRowKey={(r) => `${r.kind}-${r.id}`}
        />
      </div>
    </section>
  )
}
