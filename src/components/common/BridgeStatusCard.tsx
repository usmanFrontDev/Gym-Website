import { Cpu, Radio } from 'lucide-react'
import type { ReactNode } from 'react'
import { bridgeStrings } from '@/constants/strings'
import { useBridgeStatus } from '@/hooks/common/useActivity'
import { formatDateTime } from '@/utils/format'
import { Badge } from './Badge'

const at = (value: string | null | undefined) => (value ? formatDateTime(value) : bridgeStrings.never)

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold">{children}</dd>
    </div>
  )
}

/** Live view of the reception bridge: heartbeat, device counters, last scan, last error. */
export function BridgeStatusCard() {
  const { data: bridge } = useBridgeStatus()
  const r = bridgeStrings.rows
  const online = bridge?.online ?? false
  const seen = Boolean(bridge?.last_seen_at)

  return (
    <section aria-labelledby="bridge-heading" className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 id="bridge-heading" className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wider">
          <Cpu aria-hidden="true" size={20} className="text-primary" />
          {bridgeStrings.title}
        </h2>
        <Badge tone={online ? 'success' : 'danger'}>
          <Radio aria-hidden="true" size={12} className={online ? 'motion-safe:animate-pulse' : undefined} />
          {online ? bridgeStrings.online : bridgeStrings.offline}
        </Badge>
      </div>

      {!online && (
        <p role="status" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {seen ? bridgeStrings.offlineHint : bridgeStrings.neverSeen}
        </p>
      )}

      <dl className="mt-3 divide-y divide-border">
        <Row label={r.lastSeen}>{at(bridge?.last_seen_at)}</Row>
        <Row label={r.lastPunch}>
          {bridge?.last_punch_at ? `${at(bridge.last_punch_at)} · ID ${bridge.last_punch_fingerprint_id ?? '?'}` : bridgeStrings.never}
        </Row>
        <Row label={r.lastSync}>{at(bridge?.last_sync_at)}</Row>
        <Row label={r.device}>{bridge?.device_ip ?? bridgeStrings.none}</Row>
        <Row label={r.users}>{bridge?.device_users ?? '---'}</Row>
        <Row label={r.fingerprints}>{bridge?.device_fingerprints ?? '---'}</Row>
        <Row label={r.records}>{bridge?.device_records ?? '---'}</Row>
        <Row label={r.enrollment}>
          {bridge?.last_enrollment_at ? `${at(bridge.last_enrollment_at)} · ${bridge.last_enrollment_status ?? ''}` : bridgeStrings.never}
        </Row>
        <Row label={r.uptime}>{at(bridge?.started_at)}</Row>
        <Row label={r.version}>{bridge?.bridge_version ?? '---'}</Row>
        <Row label={r.error}>
          {bridge?.last_error ? (
            <span className="text-danger">
              {bridge.last_error}
              {bridge.last_error_at ? ` · ${formatDateTime(bridge.last_error_at)}` : ''}
            </span>
          ) : (
            bridgeStrings.none
          )}
        </Row>
      </dl>
    </section>
  )
}
