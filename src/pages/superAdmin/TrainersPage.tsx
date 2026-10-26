import { useState } from 'react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { DataTable, type Column } from '@/components/common/DataTable'
import { PasswordRevealDialog } from '@/components/common/PasswordRevealDialog'
import { PayoutDialog } from '@/components/superAdmin/PayoutDialog'
import { StaffActions } from '@/components/superAdmin/StaffActions'
import { StaffFormDialog } from '@/components/superAdmin/StaffFormDialog'
import { PageContainer } from '@/components/ui/PageContainer'
import { Role } from '@/constants/roles'
import { strings } from '@/constants/strings'
import { useClientPagination } from '@/hooks/common/useClientPagination'
import { useTrainers } from '@/hooks/superAdmin/useAdmin'
import type { TrainerRow } from '@/types/superAdmin/admin.types'
import { formatPkr } from '@/utils/format'

export default function TrainersPage() {
  const trainers = useTrainers()
  const { page, total, pageRows, setPage } = useClientPagination(trainers.data)
  const [adding, setAdding] = useState(false)
  const [password, setPassword] = useState<string | null>(null)
  const [payoutFor, setPayoutFor] = useState<TrainerRow | null>(null)

  const columns: Column<TrainerRow>[] = [
    { key: 'name', header: 'Name', render: (r) => r.full_name },
    { key: 'type', header: 'Type', render: (r) => (r.trainer_type ? strings.trainerTypes[r.trainer_type] : strings.common.none) },
    { key: 'email', header: 'Email', render: (r) => r.email },
    { key: 'phone', header: 'Phone', render: (r) => r.phone ?? strings.common.none },
    { key: 'status', header: 'Status', render: (r) => (r.blocked ? <Badge tone="danger">Blocked</Badge> : <Badge tone="success">Active</Badge>) },
    { key: 'members', header: 'Members trained', render: (r) => r.members_trained },
    { key: 'earned', header: 'Commission earned', render: (r) => formatPkr(r.commission_earned) },
    { key: 'paid', header: 'Paid out', render: (r) => formatPkr(r.commission_paid) },
    { key: 'due', header: 'Balance due', render: (r) => formatPkr(r.commission_earned - r.commission_paid) },
    {
      key: 'actions', header: strings.common.actions,
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPayoutFor(r)}>Payouts</Button>
          <StaffActions id={r.id} name={r.full_name} blocked={r.blocked} onPassword={setPassword} />
        </div>
      ),
    },
  ]

  return (
    <PageContainer title={strings.nav.trainers} actions={<Button onClick={() => setAdding(true)}>Add trainer</Button>}>
      <DataTable
        caption="Trainers" columns={columns} rows={pageRows} total={total} page={page} onPageChange={setPage}
        isLoading={trainers.isLoading} error={trainers.error} onRetry={() => trainers.refetch()} getRowKey={(r) => r.id}
      />
      <StaffFormDialog role={adding ? Role.TRAINER : null} onClose={() => setAdding(false)} onCreated={setPassword} />
      <PasswordRevealDialog password={password} onClose={() => setPassword(null)} />
      <PayoutDialog trainerId={payoutFor?.id ?? null} trainerName={payoutFor?.full_name ?? ''} onClose={() => setPayoutFor(null)} />
    </PageContainer>
  )
}
