import { FingerprintPattern, ShieldAlert, ShieldCheck } from 'lucide-react'
import { activityStrings, strings } from '@/constants/strings'
import type { ActivityRow } from '@/types/common/activity.types'
import { alertForStatus } from '@/utils/alerts'
import { formatDate, formatDateTime } from '@/utils/format'

interface ScanCardProps {
  scan: ActivityRow | null
}

/** The latest scan as a big card: green when access is granted, red when denied. */
export function ScanCard({ scan }: ScanCardProps) {
  if (!scan || scan.status === 'ONBOARDED') {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border-strong bg-surface p-6 text-center text-muted">
        <FingerprintPattern aria-hidden="true" size={44} className="motion-safe:animate-pulse" />
        <p className="font-display text-lg font-semibold uppercase tracking-widest">{activityStrings.waiting}</p>
      </div>
    )
  }

  const granted = scan.kind === 'GRANTED'
  const Icon = granted ? ShieldCheck : ShieldAlert
  const message = alertForStatus(scan.status).message ?? 'Welcome'

  return (
    <div
      aria-live="polite"
      className={`rounded-card border-2 p-6 shadow-card ${
        granted ? 'border-success bg-success/10 text-success' : 'border-danger bg-danger/10 text-danger'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest">{activityStrings.latest}</p>
        <Icon aria-hidden="true" size={28} />
      </div>
      <p className="mt-2 font-display text-4xl font-extrabold uppercase leading-tight tracking-wide text-foreground">
        {scan.name ?? 'Unknown fingerprint'}
      </p>
      <p className="mt-1 text-lg font-semibold">{message}</p>
      {scan.registration_date && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">{activityStrings.scanDetails.father}</dt>
          <dd className="font-semibold text-foreground">{scan.father_name ?? strings.common.none}</dd>
          <dt className="text-muted">{activityStrings.scanDetails.registered}</dt>
          <dd className="font-semibold text-foreground">{formatDate(scan.registration_date)}</dd>
          <dt className="text-muted">{activityStrings.scanDetails.lastPayment}</dt>
          <dd className="font-semibold text-foreground">{formatDate(scan.last_payment_date)}</dd>
        </dl>
      )}
      <p className="mt-3 text-sm text-muted">{formatDateTime(scan.at)}</p>
    </div>
  )
}
