import { useState } from 'react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { QueryState } from '@/components/common/QueryState'
import { planStrings } from '@/constants/strings'
import { usePlans } from '@/hooks/common/useMembers'
import type { Plan } from '@/types/common/member.types'
import { formatPkr } from '@/utils/format'
import { PlanEditDialog } from './PlanEditDialog'

export function PlansTable() {
  const plans = usePlans()
  const [editing, setEditing] = useState<Plan | null>(null)
  const c = planStrings.columns

  const handleEditClick = (plan: Plan) => setEditing(plan)

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <QueryState isLoading={plans.isLoading} error={plans.error} isEmpty={plans.data?.length === 0} onRetry={() => plans.refetch()}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{planStrings.title}</caption>
            <thead className="bg-surface-raised text-xs uppercase tracking-wider text-muted">
              <tr>
                {[c.name, c.code, c.price, c.duration, c.type, c.status, c.actions].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-3.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(plans.data ?? []).map((plan) => (
                <tr key={plan.code} className="border-t border-border transition-colors hover:bg-surface-raised/60">
                  <td className="px-4 py-3.5 font-semibold">{plan.name}</td>
                  <td className="px-4 py-3.5 text-muted">{plan.code}</td>
                  <td className="px-4 py-3.5 font-display text-lg font-bold">{formatPkr(plan.price)}</td>
                  <td className="px-4 py-3.5">{planStrings.duration(plan.months)}</td>
                  <td className="px-4 py-3.5">{plan.is_trainer_plan ? planStrings.types.trainer : planStrings.types.gym}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone={plan.active ? 'success' : 'neutral'}>{plan.active ? planStrings.active : planStrings.off}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Button variant="secondary" size="sm" onClick={() => handleEditClick(plan)} aria-label={`${planStrings.edit} ${plan.name}`}>
                      {planStrings.edit}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
      <PlanEditDialog plan={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
