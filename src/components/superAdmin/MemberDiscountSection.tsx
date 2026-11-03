import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { DataTable, type Column } from '@/components/common/DataTable'
import { SearchInput } from '@/components/common/SearchInput'
import { planStrings } from '@/constants/strings'
import { usePlans } from '@/hooks/common/useMembers'
import { useUrlParams } from '@/hooks/common/useUrlParams'
import { useDiscountMembers } from '@/hooks/superAdmin/usePlansAdmin'
import type { DiscountMemberRow } from '@/types/superAdmin/plan.types'
import { formatPkr } from '@/utils/format'
import { MemberDiscountDialog } from './MemberDiscountDialog'

export function MemberDiscountSection() {
  const [params, setParams] = useUrlParams({ page: '1', search: '', discounted: '' })
  const filters = { page: Number(params.page), search: params.search, onlyDiscounted: params.discounted === '1' }
  const members = useDiscountMembers(filters)
  const plans = usePlans()
  const [selected, setSelected] = useState<DiscountMemberRow | null>(null)
  const d = planStrings.discounts

  const handleSetClick = (member: DiscountMemberRow) => setSelected(member)

  const columns: Column<DiscountMemberRow>[] = [
    { key: 'member', header: d.columns.member, render: (r) => <span className="font-semibold">{r.full_name}</span> },
    { key: 'phone', header: d.columns.phone, render: (r) => r.phone },
    {
      key: 'discount', header: d.columns.discount,
      render: (r) => (r.monthly_discount > 0 ? d.off(formatPkr(r.monthly_discount)) : <span className="text-muted">{d.none}</span>),
    },
    {
      key: 'actions', header: d.columns.actions,
      render: (r) => (
        <Button variant="secondary" size="sm" onClick={() => handleSetClick(r)} aria-label={`${d.set} for ${r.full_name}`}>
          {d.set}
        </Button>
      ),
    },
  ]

  return (
    <section aria-labelledby="discounts-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="discounts-heading" className="font-display text-2xl font-bold uppercase tracking-wider">
          {d.title}
        </h2>
        <p className="text-sm text-muted">{d.subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-64 flex-1">
          <SearchInput value={params.search} onChange={(search) => setParams({ search })} label={d.search} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox" className="h-4 w-4 accent-primary" checked={params.discounted === '1'}
            onChange={(e) => setParams({ discounted: e.target.checked ? '1' : '' })}
          />
          {d.onlyDiscounted}
        </label>
      </div>
      <DataTable
        caption={d.title}
        columns={columns}
        rows={members.data?.rows ?? []}
        total={members.data?.total ?? 0}
        page={filters.page}
        onPageChange={(next) => setParams({ page: String(next) }, { resetPage: false })}
        isLoading={members.isLoading}
        error={members.error}
        onRetry={() => members.refetch()}
        getRowKey={(r) => r.id}
      />
      <MemberDiscountDialog member={selected} plans={plans.data ?? []} onClose={() => setSelected(null)} />
    </section>
  )
}
