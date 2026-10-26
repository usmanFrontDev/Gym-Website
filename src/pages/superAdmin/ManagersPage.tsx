import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PasswordRevealDialog } from '@/components/common/PasswordRevealDialog'
import { StaffActions } from '@/components/superAdmin/StaffActions'
import { StaffFormDialog } from '@/components/superAdmin/StaffFormDialog'
import { PageContainer } from '@/components/ui/PageContainer'
import { Path, withParams } from '@/constants/paths'
import { Role } from '@/constants/roles'
import { strings } from '@/constants/strings'
import { useClientPagination } from '@/hooks/common/useClientPagination'
import { useManagers } from '@/hooks/superAdmin/useAdmin'
import type { ManagerRow } from '@/types/superAdmin/admin.types'
import { formatPkr } from '@/utils/format'

export default function ManagersPage() {
  const managers = useManagers()
  const { page, total, pageRows, setPage } = useClientPagination(managers.data)
  const [adding, setAdding] = useState(false)
  const [password, setPassword] = useState<string | null>(null)

  const dash = (v: string | null) => v ?? strings.common.none
  const columns: Column<ManagerRow>[] = [
    {
      key: 'name', header: 'Name',
      render: (r) => (
        <Link to={withParams(Path.AdminManagerDetail, { managerId: r.id })} className="font-semibold text-primary hover:underline">{r.full_name}</Link>
      ),
    },
    { key: 'father', header: 'Father name', render: (r) => dash(r.father_name) },
    { key: 'cnic', header: 'CNIC', render: (r) => dash(r.cnic) },
    { key: 'role', header: 'Role', render: () => strings.roles.MANAGER },
    { key: 'email', header: 'Email', render: (r) => r.email },
    { key: 'phone', header: 'Phone', render: (r) => dash(r.phone) },
    { key: 'address', header: 'Address', render: (r) => dash(r.address) },
    { key: 'status', header: 'Status', render: (r) => (r.blocked ? <Badge tone="danger">Blocked</Badge> : <Badge tone="success">Active</Badge>) },
    { key: 'month', header: 'Registered (month)', render: (r) => r.registered_month },
    { key: 'totalReg', header: 'Registered (total)', render: (r) => r.registered_total },
    { key: 'rd', header: 'Revenue today', render: (r) => formatPkr(r.revenue_daily) },
    { key: 'rm', header: 'Revenue month', render: (r) => formatPkr(r.revenue_monthly) },
    { key: 'rt', header: 'Revenue total', render: (r) => formatPkr(r.revenue_total) },
    { key: 'actions', header: strings.common.actions, render: (r) => <StaffActions id={r.id} name={r.full_name} blocked={r.blocked} onPassword={setPassword} /> },
  ]

  return (
    <PageContainer title={strings.nav.managers} actions={<Button onClick={() => setAdding(true)}>Add manager</Button>}>
      <DataTable
        caption="Managers" columns={columns} rows={pageRows} total={total} page={page} onPageChange={setPage}
        isLoading={managers.isLoading} error={managers.error} onRetry={() => managers.refetch()} getRowKey={(r) => r.id}
      />
      <StaffFormDialog role={adding ? Role.MANAGER : null} onClose={() => setAdding(false)} onCreated={setPassword} />
      <PasswordRevealDialog password={password} onClose={() => setPassword(null)} />
    </PageContainer>
  )
}
