import { Link } from 'react-router-dom'
import { memberStrings, strings } from '@/constants/strings'
import { useMembers, usePlans } from '@/hooks/common/useMembers'
import { useUrlParams } from '@/hooks/common/useUrlParams'
import { withParams } from '@/constants/paths'
import type { MemberRow } from '@/types/common/member.types'
import { formatDate } from '@/utils/format'
import { DataTable, type Column } from './DataTable'
import { KpiCard } from './KpiCard'
import { SearchInput } from './SearchInput'
import { StatusBadge } from './StatusBadge'

interface MembersViewProps {
  /** Route pattern with `:memberId`. Omit when the role has no member detail page (trainers). */
  detailPath?: string
  showRegisteredBy?: boolean
  registeredBy?: string
}

const selectStyles = 'h-10 rounded-lg border border-border bg-surface px-3 text-foreground'

export function MembersView({ detailPath, showRegisteredBy = false, registeredBy }: MembersViewProps) {
  const [params, setParams] = useUrlParams({ page: '1', search: '', status: '', plan: '', from: '', to: '' })
  const filters = { ...params, page: Number(params.page), registeredBy }
  const members = useMembers(filters)
  const plans = usePlans()
  const planName = (code: string | null) => plans.data?.find((p) => p.code === code)?.name ?? strings.common.none
  const c = memberStrings.columns

  const columns: Column<MemberRow>[] = [
    {
      key: 'name', header: c.name,
      render: (r) =>
        detailPath ? (
          <Link to={withParams(detailPath, { memberId: r.id })} className="font-semibold text-primary underline-offset-2 hover:underline">
            {r.full_name}
          </Link>
        ) : (
          r.full_name
        ),
    },
    { key: 'father', header: c.father, render: (r) => r.father_name ?? strings.common.none },
    { key: 'phone', header: c.phone, render: (r) => r.phone },
    { key: 'emergency', header: c.emergency, render: (r) => r.emergency_contact ?? strings.common.none },
    { key: 'fingerprint', header: c.fingerprint, render: (r) => r.fingerprint_id ?? strings.common.none },
    { key: 'status', header: c.status, render: (r) => <StatusBadge status={r.status} /> },
    { key: 'plan', header: c.plan, render: (r) => planName(r.plan_code) },
    { key: 'registered', header: c.registered, render: (r) => formatDate(r.registration_date) },
    { key: 'lastPayment', header: c.lastPayment, render: (r) => formatDate(r.last_payment_date) },
    { key: 'nextDue', header: c.nextDue, render: (r) => (r.plan_code === 'LIFETIME' ? 'Never' : formatDate(r.due_date)) },
    { key: 'email', header: c.email, render: (r) => r.email ?? strings.common.none },
    { key: 'trainer', header: c.trainer, render: (r) => r.trainer_name ?? strings.common.none },
    ...(showRegisteredBy
      ? [{ key: 'registeredBy', header: c.registeredBy, render: (r: MemberRow) => r.registered_by_name }]
      : []),
  ]

  const kpis = members.data?.kpis
  const f = memberStrings.filters

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label={memberStrings.kpi.total} value={kpis?.total ?? 0} />
        <KpiCard label={memberStrings.kpi.active} value={kpis?.active ?? 0} />
        <KpiCard label={memberStrings.kpi.expired} value={kpis?.expired ?? 0} />
        <KpiCard label={memberStrings.kpi.frozen} value={kpis?.frozen ?? 0} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SearchInput value={params.search} onChange={(search) => setParams({ search })} label={f.search} />
        </div>
        <label>
          <span className="sr-only">{f.status}</span>
          <select className={`${selectStyles} w-full`} value={params.status} onChange={(e) => setParams({ status: e.target.value })}>
            <option value="">{f.allStatuses}</option>
            <option value="active">{f.active}</option>
            <option value="inactive">{f.inactive}</option>
          </select>
        </label>
        <label>
          <span className="sr-only">{f.plan}</span>
          <select className={`${selectStyles} w-full`} value={params.plan} onChange={(e) => setParams({ plan: e.target.value })}>
            <option value="">{f.allPlans}</option>
            {plans.data?.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">{f.from}</span>
            <input type="date" aria-label={f.from} className={`${selectStyles} w-full`} value={params.from} onChange={(e) => setParams({ from: e.target.value })} />
          </label>
          <label className="flex-1">
            <span className="sr-only">{f.to}</span>
            <input type="date" aria-label={f.to} className={`${selectStyles} w-full`} value={params.to} onChange={(e) => setParams({ to: e.target.value })} />
          </label>
        </div>
      </div>

      <DataTable
        caption="Members"
        columns={columns}
        rows={members.data?.rows ?? []}
        total={members.data?.total ?? 0}
        page={filters.page}
        onPageChange={(page) => setParams({ page: String(page) }, { resetPage: false })}
        isLoading={members.isLoading}
        error={members.error}
        onRetry={() => members.refetch()}
        getRowKey={(r) => r.id}
      />
    </div>
  )
}
