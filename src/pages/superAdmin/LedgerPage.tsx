import { zodResolver } from '@hookform/resolvers/zod'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type Column } from '@/components/common/DataTable'
import { QueryState } from '@/components/common/QueryState'
import { FormDatePicker } from '@/components/form/FormDatePicker'
import { FormInput } from '@/components/form/FormInput'
import { FormSelect } from '@/components/form/FormSelect'
import { PageContainer } from '@/components/ui/PageContainer'
import { expenseLabels, ledgerStrings, paymentMethodStrings, strings } from '@/constants/strings'
import { useClientPagination } from '@/hooks/common/useClientPagination'
import { useUrlParams } from '@/hooks/common/useUrlParams'
import { useAddExpense, useDeleteExpense, useLedger } from '@/hooks/superAdmin/useAdmin'
import { expenseSchema, type ExpenseValues } from '@/schemas/superAdmin/staff.schema'
import type { ExpenseCategoryValue, LedgerRow, LedgerView } from '@/types/superAdmin/admin.types'
import { formatDate, formatPkr, todayKarachi } from '@/utils/format'
import { ledgerCsv, ledgerRange } from '@/utils/ledger'

type Filter = 'all' | 'income' | 'expense'
const VIEWS: LedgerView[] = ['daily', 'monthly', 'yearly', 'all']

interface SummaryCardProps {
  label: string
  value: string
  hint: string
  pressed: boolean
  tone: string
  onClick: () => void
}

function SummaryCard({ label, value, hint, pressed, tone, onClick }: SummaryCardProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-card border bg-surface p-5 text-left shadow-card transition-colors hover:border-border-strong ${pressed ? 'border-primary' : 'border-border'}`}
    >
      <span className="block text-sm font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className={`mt-3 block font-display text-4xl font-bold leading-none tracking-wide ${tone}`}>{value}</span>
      <span className="mt-2 block text-xs text-muted">{hint}</span>
    </button>
  )
}

function downloadCsv(rows: LedgerRow[], name: string) {
  const url = URL.createObjectURL(new Blob([ledgerCsv(rows)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Owner-only: daily, monthly, yearly and all-time income (membership payments) and expenses in one list. */
export default function LedgerPage() {
  const today = todayKarachi()
  const [params, setParams] = useUrlParams({ view: 'monthly', date: today, filter: 'all' })
  const view = params.view as LedgerView
  const filter = params.filter as Filter
  const [from, to] = ledgerRange(view, params.date)

  const ledger = useLedger(from, to)
  const add = useAddExpense()
  const remove = useDeleteExpense()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const all = ledger.data?.rows ?? []
  const shown = all.filter((r) => filter === 'all' || r.kind === filter.toUpperCase())
  const { page, total, pageRows, setPage } = useClientPagination(shown)

  const { control, handleSubmit, reset } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: 'RENT', amount: undefined, spent_on: today, note: '' },
  })
  const handleAdd = (values: ExpenseValues) => add.mutate(values, { onSuccess: () => reset({ ...values, amount: undefined, note: '' }) })
  const handleConfirmDelete = () => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
  const toggleFilter = (next: Filter) => setParams({ filter: filter === next ? 'all' : next })
  const handleExport = () => downloadCsv(shown, `ledger-${view}-${params.date}.csv`)

  const d = ledger.data
  const columns: Column<LedgerRow>[] = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.day) },
    {
      key: 'type', header: 'Type',
      render: (r) => <Badge tone={r.kind === 'INCOME' ? 'success' : 'danger'}>{r.kind === 'INCOME' ? ledgerStrings.income : ledgerStrings.expense}</Badge>,
    },
    { key: 'details', header: 'Details', render: (r) => (r.kind === 'EXPENSE' ? expenseLabels[r.label as ExpenseCategoryValue] ?? r.label : r.label) },
    { key: 'method', header: paymentMethodStrings.label, render: (r) => (r.method ? paymentMethodStrings.labels[r.method] : strings.common.none) },
    { key: 'note', header: 'Note', render: (r) => r.note ?? strings.common.none },
    {
      key: 'amount', header: 'Amount',
      render: (r) => <span className={r.kind === 'INCOME' ? 'text-success' : 'text-danger'}>{`${r.kind === 'INCOME' ? '+' : '-'}${formatPkr(r.amount)}`}</span>,
    },
    {
      key: 'actions', header: strings.common.actions,
      render: (r) => (r.kind === 'EXPENSE' ? <Button variant="ghost" size="sm" onClick={() => setDeleteId(r.id)}>Delete</Button> : null),
    },
  ]

  return (
    <PageContainer title={strings.nav.ledger}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Report period" className="flex flex-wrap gap-2">
          {VIEWS.map((v) => (
            <Button key={v} role="tab" aria-selected={view === v} variant={view === v ? 'primary' : 'secondary'} size="sm" onClick={() => setParams({ view: v })}>
              {ledgerStrings.views[v]}
            </Button>
          ))}
        </div>
        {view !== 'all' && (
          <label className="flex items-center gap-2 text-sm text-muted">
            {ledgerStrings.pickDay}
            <input
              type="date"
              value={params.date}
              max={today}
              onChange={(e) => e.target.value && setParams({ date: e.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
            />
          </label>
        )}
      </div>
      <p className="text-sm text-muted">{ledgerStrings.range(from, to)}</p>

      <QueryState isLoading={ledger.isLoading} error={ledger.error} onRetry={() => ledger.refetch()}>
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label={ledgerStrings.totalIncome} value={formatPkr(d?.income ?? 0)} tone="text-success" pressed={filter === 'income'}
            hint={`Cash ${formatPkr(d?.cash ?? 0)} · Online ${formatPkr(d?.online ?? 0)}`} onClick={() => toggleFilter('income')}
          />
          <SummaryCard
            label={ledgerStrings.totalExpense} value={formatPkr(d?.expense ?? 0)} tone="text-danger" pressed={filter === 'expense'}
            hint={ledgerStrings.filterExpense} onClick={() => toggleFilter('expense')}
          />
          <SummaryCard
            label={ledgerStrings.netProfit} value={formatPkr(d?.net ?? 0)} tone={(d?.net ?? 0) < 0 ? 'text-danger' : 'text-primary'} pressed={filter === 'all'}
            hint={ledgerStrings.showAll} onClick={() => setParams({ filter: 'all' })}
          />
        </div>
      </QueryState>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <form onSubmit={handleSubmit(handleAdd)} noValidate aria-label={ledgerStrings.addTitle} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
          <h2 className="text-lg font-bold">{ledgerStrings.addTitle}</h2>
          <FormSelect control={control} name="category" label="Category" options={Object.entries(expenseLabels).map(([value, label]) => ({ value, label }))} />
          <FormInput control={control} name="amount" label="Amount (PKR)" asNumber />
          <FormDatePicker control={control} name="spent_on" label="Date" />
          <FormInput control={control} name="note" label="Note (optional)" />
          <Button type="submit" loading={add.isPending}>{ledgerStrings.addExpense}</Button>
        </form>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">{ledgerStrings.transactions(total)}</p>
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={shown.length === 0}>
              <Download aria-hidden="true" size={16} /> {ledgerStrings.export}
            </Button>
          </div>
          {d && d.row_count > d.rows.length && <p role="status" className="text-sm text-warning">{ledgerStrings.truncated(d.rows.length, d.row_count)}</p>}
          <DataTable
            caption={ledgerStrings.tableCaption} columns={columns} rows={pageRows} total={total} page={page} onPageChange={setPage}
            isLoading={ledger.isLoading} error={ledger.error} onRetry={() => ledger.refetch()} getRowKey={(r) => r.id}
          />
        </div>
      </div>
      <ConfirmDialog open={deleteId !== null} title="Delete expense" message="This removes the expense from the ledger." loading={remove.isPending} onCancel={() => setDeleteId(null)} onConfirm={handleConfirmDelete} />
    </PageContainer>
  )
}
