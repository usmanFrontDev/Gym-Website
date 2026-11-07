import { useState } from 'react'
import { directoryStrings, strings } from '@/constants/strings'
import { useDirectory } from '@/hooks/common/useDirectory'
import { useUrlParams } from '@/hooks/common/useUrlParams'
import type { DirectoryRow } from '@/types/common/directory.types'
import { formatDate } from '@/utils/format'
import { Button } from './Button'
import { CollectFeeDialog } from './CollectFeeDialog'
import { DataTable, type Column } from './DataTable'
import { SearchInput } from './SearchInput'

/** Search across every gym member with the limited profile managers are allowed to see. */
export function DirectoryView() {
  const [params, setParams] = useUrlParams({ page: '1', search: '' })
  const page = Number(params.page)
  const directory = useDirectory(params.search, page)
  const [collecting, setCollecting] = useState<DirectoryRow | null>(null)
  const c = directoryStrings.columns

  const columns: Column<DirectoryRow>[] = [
    { key: 'name', header: c.name, render: (r) => <span className="font-semibold">{r.full_name}</span> },
    { key: 'father', header: c.father, render: (r) => r.father_name ?? strings.common.none },
    { key: 'registered', header: c.registered, render: (r) => formatDate(r.registration_date) },
    { key: 'lastPayment', header: c.lastPayment, render: (r) => formatDate(r.last_payment_date) },
    {
      key: 'actions', header: c.actions,
      render: (r) => (
        <Button size="sm" onClick={() => setCollecting(r)} aria-label={`${directoryStrings.collect.action}: ${r.full_name}`}>
          {directoryStrings.collect.action}
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <SearchInput value={params.search} onChange={(search) => setParams({ search })} label={directoryStrings.searchLabel} />
      <DataTable
        caption={directoryStrings.title}
        columns={columns}
        rows={directory.data?.rows ?? []}
        total={directory.data?.total ?? 0}
        page={page}
        onPageChange={(next) => setParams({ page: String(next) }, { resetPage: false })}
        isLoading={directory.isLoading}
        error={directory.error}
        onRetry={() => directory.refetch()}
        getRowKey={(r) => r.id}
      />
      <CollectFeeDialog member={collecting} onClose={() => setCollecting(null)} />
    </div>
  )
}
