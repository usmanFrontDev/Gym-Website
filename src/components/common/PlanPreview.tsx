import { applyPayment } from '@/utils/billing/billing'
import { PLAN_MONTHS, type PlanCode } from '@/utils/billing/plans'
import { formatDate, formatPkr } from '@/utils/format'

interface PlanPreviewProps {
  plan: PlanCode
  payment: number
  credit: number
  anchorDate: string
  monthsAlreadyCovered: number
  admissionCharged: number
}

/** UI preview only. The Postgres RPC computes the final state. */
export function PlanPreview({ plan, payment, credit, anchorDate, monthsAlreadyCovered, admissionCharged }: PlanPreviewProps) {
  let body: string
  try {
    const result = applyPayment({ plan, payment, credit, anchorDate, monthsAlreadyCovered })
    const monthsPer = PLAN_MONTHS[plan]
    body =
      monthsPer === null
        ? 'Lifetime: never expires'
        : `${result.periods * monthsPer} month(s) added · credit ${formatPkr(result.credit)} · ${
            result.coveredMonths === 0 ? 'no access yet (credit only)' : `valid through ${formatDate(result.dueDate)}`
          }`
  } catch (error) {
    body = error instanceof Error ? error.message : ''
  }
  return (
    <div aria-live="polite" className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
      <p className="font-semibold text-primary">Preview</p>
      <p>{body}</p>
      <p className="mt-1">
        Total to collect: <strong>{formatPkr(payment + admissionCharged)}</strong>
        {admissionCharged > 0 && <span className="text-muted"> (incl. admission {formatPkr(admissionCharged)})</span>}
      </p>
    </div>
  )
}
