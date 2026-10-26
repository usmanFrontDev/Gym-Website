import { zodResolver } from '@hookform/resolvers/zod'
import { endOfMonth, endOfYear, format, parseISO, startOfMonth, startOfYear } from 'date-fns'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, type Column } from '@/components/common/DataTable'
import { KpiCard } from '@/components/common/KpiCard'
import { QueryState } from '@/components/common/QueryState'
import { FormDatePicker } from '@/components/form/FormDatePicker'
import { FormInput } from '@/components/form/FormInput'
import { FormSelect } from '@/components/form/FormSelect'
import { PageContainer } from '@/components/ui/PageContainer'
import { expenseLabels, strings } from '@/constants/strings'
import { useClientPagination } from '@/hooks/common/useClientPagination'
import { useUrlParams } from '@/hooks/common/useUrlParams'
import { useAddExpense, useDeleteExpense, useExpenses, useExpenseSummary } from '@/hooks/superAdmin/useAdmin'
import { expenseSchema, type ExpenseValues } from '@/schemas/superAdmin/staff.schema'
import type { ExpenseRow } from '@/types/superAdmin/admin.types'
import { formatDate, formatPkr, todayKarachi } from '@/utils/format'

type View = 'daily' | 'monthly' | 'yearly'
const ymd = (d: Date) => format(d, 'yyyy-MM-dd')

function rangeFor(view: View, today: string): [string, string] {
  const d = parseISO(today)
  if (view === 'daily') return [today, today]
  if (view === 'monthly') return [ymd(startOfMonth(d)), ymd(endOfMonth(d))]
  return [ymd(startOfYear(d)), ymd(endOfYear(d))]
}

export default function ExpensesPage() {
  const today = todayKarachi()
  const [params, setParams] = useUrlParams({ view: 'monthly', page: '1' })
  const view = params.view as View
  const [from, to] = rangeFor(view, today)

  const expenses = useExpenses(from, to)
  const summary = useExpenseSummary(from, to)
  const add = useAddExpense()
  const remove = useDeleteExpense()
  const { page, total, pageRows, setPage } = useClientPagination(expenses.data)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { control, handleSubmit, reset } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: 'RENT', amount: undefined, spent_on: today, note: '' },
  })
  const handleAdd = (values: ExpenseValues) => add.mutate(values, { onSuccess: () => reset({ ...values, amount: undefined, note: '' }) })
  const handleDeleteClick = (id: string) => setDeleteId(id)
  const handleConfirmDelete = () => deleteId && remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })

  const columns: Column<ExpenseRow>[] = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.spent_on) },
    { key: 'cat', header: 'Category', render: (r) => expenseLabels[r.category] },
    { key: 'amount', header: 'Amount', render: (r) => formatPkr(r.amount) },
    { key: 'note', header: 'Note', render: (r) => r.note ?? strings.common.none },
    { key: 'actions', header: strings.common.actions, render: (r) => <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(r.id)}>Delete</Button> },
  ]
  const s = summary.data

  return (
    <PageContainer title={strings.nav.expenses}>
      <div role="tablist" aria-label="Report period" className="flex gap-2">
        {(['daily', 'monthly', 'yearly'] as View[]).map((v) => (
          <Button key={v} role="tab" aria-selected={view === v} variant={view === v ? 'primary' : 'secondary'} size="sm" onClick={() => setParams({ view: v })}>
            {v[0].toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </div>

      <QueryState isLoading={summary.isLoading} error={summary.error} onRetry={() => summary.refetch()}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Money in (revenue)" value={formatPkr(s?.revenue ?? 0)} />
          <KpiCard label="Money out (expenses)" value={formatPkr(s?.expenses ?? 0)} />
          <KpiCard label="Profit (in minus out)" value={formatPkr(s?.net ?? 0)} />
        </div>
        {s && s.by_category.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Spending by category">
            {s.by_category.map((c) => (
              <li key={c.category} className="flex justify-between rounded-lg border border-border bg-surface px-4 py-2">
                <span>{expenseLabels[c.category]}</span>
                <strong>{formatPkr(c.total)}</strong>
              </li>
            ))}
          </ul>
        )}
      </QueryState>

      <form onSubmit={handleSubmit(handleAdd)} noValidate className="grid gap-4 rounded-card border border-border bg-surface p-5 md:grid-cols-5">
        <FormSelect control={control} name="category" label="Category" options={Object.entries(expenseLabels).map(([value, label]) => ({ value, label }))} />
        <FormInput control={control} name="amount" label="Amount (PKR)" asNumber />
        <FormDatePicker control={control} name="spent_on" label="Date" />
        <FormInput control={control} name="note" label="Note (optional)" />
        <div className="flex items-end">
          <Button type="submit" loading={add.isPending}>Add expense</Button>
        </div>
      </form>

      <DataTable
        caption="Expenses" columns={columns} rows={pageRows} total={total} page={page} onPageChange={setPage}
        isLoading={expenses.isLoading} error={expenses.error} onRetry={() => expenses.refetch()} getRowKey={(r) => r.id}
      />
      <ConfirmDialog open={deleteId !== null} title="Delete expense" message="This removes the expense from the reports." loading={remove.isPending} onCancel={() => setDeleteId(null)} onConfirm={handleConfirmDelete} />
    </PageContainer>
  )
}
