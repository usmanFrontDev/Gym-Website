import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { QueryState } from '@/components/common/QueryState'
import { PageContainer } from '@/components/ui/PageContainer'
import { memberEditStrings, paymentMethodStrings, strings } from '@/constants/strings'
import {
  useDeleteMember, useFreezeMember, useMember, useMemberAssignments, useMemberFreezes, useMemberPayments, usePlans, useResumeMember,
} from '@/hooks/common/useMembers'
import { formatDate, formatPkr, todayKarachi } from '@/utils/format'
import { Button } from './Button'
import { Badge } from './Badge'
import { ChangeTrainerDialog } from './ChangeTrainerDialog'
import { EditMemberDialog } from './EditMemberDialog'
import { PaymentDialog } from './PaymentDialog'
import { StatusBadge } from './StatusBadge'
import { VoidPaymentDialog } from './VoidPaymentDialog'

interface MemberDetailViewProps {
  memberId: string
  canChangeTrainer: boolean
  canDelete?: boolean
  /** Owner only: shows Edit details. */
  canEdit?: boolean
  onDeleted?: () => void
}

export function MemberDetailView({ memberId, canChangeTrainer, canDelete = false, canEdit = false, onDeleted }: MemberDetailViewProps) {
  const member = useMember(memberId)
  const payments = useMemberPayments(memberId)
  const freezes = useMemberFreezes(memberId)
  const assignments = useMemberAssignments(memberId)
  const plans = usePlans()
  const freeze = useFreezeMember()
  const resume = useResumeMember()
  const deleteMember = useDeleteMember()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [voidId, setVoidId] = useState<string | null>(null)
  const [confirmFreeze, setConfirmFreeze] = useState(false)
  const [trainerOpen, setTrainerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const handleFreezeClick = () => setConfirmFreeze(true)
  const handleConfirmFreeze = () => freeze.mutate(memberId, { onSuccess: () => setConfirmFreeze(false) })
  const handleResume = () => resume.mutate(memberId)
  const handleDeleteClick = () => setConfirmDelete(true)
  const handleConfirmDelete = () =>
    deleteMember.mutate(memberId, {
      onSuccess: () => {
        setConfirmDelete(false)
        onDeleted?.()
      },
    })

  const detail = member.data
  const membership = detail?.membership ?? null
  const plan = plans.data?.find((p) => p.code === membership?.plan_code)
  const isLifetime = plan !== undefined && plan.months === null
  const today = todayKarachi()
  const planFinished = membership === null || (!isLifetime && (membership.months_covered === 0 || (membership.due_date ?? '') < today))
  const latestPaymentId = payments.data?.find((p) => !p.voided_at)?.id ?? null

  return (
    <PageContainer title={detail?.member.full_name ?? 'Member'}>
      <QueryState isLoading={member.isLoading} error={member.error} onRetry={() => member.refetch()}>
        {detail && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={detail.status} />
              <Button onClick={() => setPayOpen(true)} disabled={detail.status === 'FROZEN' || isLifetime}>
                Take payment
              </Button>
              {detail.status === 'ACTIVE' && !isLifetime && (
                <Button variant="outline" onClick={handleFreezeClick}>Freeze</Button>
              )}
              {detail.status === 'FROZEN' && (
                <Button variant="outline" loading={resume.isPending} onClick={handleResume}>Resume</Button>
              )}
              {canChangeTrainer && (
                <Button variant="secondary" onClick={() => setTrainerOpen(true)}>Change trainer</Button>
              )}
              {canEdit && (
                <Button variant="secondary" onClick={() => setEditOpen(true)}>{memberEditStrings.action}</Button>
              )}
              {canDelete && (
                <Button variant="danger" onClick={handleDeleteClick}>Delete member</Button>
              )}
            </div>

            <dl className="grid gap-3 rounded-card border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Father name', detail.member.father_name],
                ['Phone', detail.member.phone],
                ['Emergency contact', detail.member.emergency_contact],
                ['Email', detail.member.email],
                ['CNIC', detail.member.cnic],
                ['Address', detail.member.address],
                ['Fingerprint ID', detail.member.fingerprint_id],
                ['Registered', formatDate(detail.member.registration_date)],
                ['Registered by', detail.registeredByName],
                ['Trainer', detail.trainerName],
                ['Plan', plan?.name],
                ['Monthly discount', detail.member.monthly_discount > 0 ? `${formatPkr(detail.member.monthly_discount)} off every month` : 'None'],
                ['Next payment due', isLifetime ? 'Never' : formatDate(membership?.due_date)],
                ['Credit', membership ? formatPkr(membership.credit) : null],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-medium">{value || strings.common.none}</dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="payments-heading" className="rounded-card border border-border bg-surface">
              <h2 id="payments-heading" className="p-4 text-lg font-bold">Payment history</h2>
              <QueryState isLoading={payments.isLoading} error={payments.error} isEmpty={payments.data?.length === 0}>
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-raised text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-2">Date</th>
                      <th scope="col" className="px-4 py-2">Amount</th>
                      <th scope="col" className="px-4 py-2">{paymentMethodStrings.label}</th>
                      <th scope="col" className="px-4 py-2">Admission</th>
                      <th scope="col" className="px-4 py-2">Status</th>
                      <th scope="col" className="px-4 py-2">{strings.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.data?.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-2">{formatDate(p.paid_on)}</td>
                        <td className="px-4 py-2">{formatPkr(p.amount)}</td>
                        <td className="px-4 py-2">{paymentMethodStrings.labels[p.payment_method] ?? strings.common.none}</td>
                        <td className="px-4 py-2">{formatPkr(p.admission_fee)}</td>
                        <td className="px-4 py-2">
                          {p.voided_at ? <Badge tone="danger">Void: {p.void_reason}</Badge> : <Badge tone="success">Paid</Badge>}
                        </td>
                        <td className="px-4 py-2">
                          {!p.voided_at && p.id === latestPaymentId && (
                            <Button variant="ghost" size="sm" onClick={() => setVoidId(p.id)}>Void</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </QueryState>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section aria-labelledby="freeze-heading" className="rounded-card border border-border bg-surface">
                <h2 id="freeze-heading" className="p-4 text-lg font-bold">Freeze history</h2>
                <QueryState isLoading={freezes.isLoading} error={freezes.error} isEmpty={freezes.data?.length === 0}>
                  <ul className="divide-y divide-border">
                    {freezes.data?.map((f) => (
                      <li key={f.id} className="px-4 py-2 text-sm">
                        {formatDate(f.frozen_on)} → {f.resumed_on ? formatDate(f.resumed_on) : 'still frozen'}
                      </li>
                    ))}
                  </ul>
                </QueryState>
              </section>
              <section aria-labelledby="trainer-heading" className="rounded-card border border-border bg-surface">
                <h2 id="trainer-heading" className="p-4 text-lg font-bold">Trainer history</h2>
                <QueryState isLoading={assignments.isLoading} error={assignments.error} isEmpty={assignments.data?.length === 0}>
                  <ul className="divide-y divide-border">
                    {assignments.data?.map((a) => (
                      <li key={a.id} className="px-4 py-2 text-sm">
                        {a.trainer?.full_name ?? strings.common.none}: {formatDate(a.start_date)} → {a.end_date ? formatDate(a.end_date) : 'current'}
                        {' · '}{formatPkr(a.commission_amount)}/month
                      </li>
                    ))}
                  </ul>
                </QueryState>
              </section>
            </div>

            {canEdit && <EditMemberDialog member={detail.member} open={editOpen} onClose={() => setEditOpen(false)} />}
            <PaymentDialog open={payOpen} onClose={() => setPayOpen(false)} memberId={memberId} membership={membership} canChangePlan={planFinished}
          monthlyDiscount={detail.member.monthly_discount} />
            <VoidPaymentDialog paymentId={voidId} onClose={() => setVoidId(null)} />
            <ChangeTrainerDialog open={trainerOpen} memberId={memberId} onClose={() => setTrainerOpen(false)} />
            <ConfirmDialog
              open={confirmFreeze}
              title="Freeze member"
              message="Fingerprint will show FROZEN until you resume. On resume a fresh cycle starts from the resume date."
              loading={freeze.isPending}
              onCancel={() => setConfirmFreeze(false)}
              onConfirm={handleConfirmFreeze}
            />
            <ConfirmDialog
              open={confirmDelete}
              title="Delete member"
              message="This member will be removed from all lists and their fingerprint freed. Payment history is kept."
              loading={deleteMember.isPending}
              onCancel={() => setConfirmDelete(false)}
              onConfirm={handleConfirmDelete}
            />
          </div>
        )}
      </QueryState>
    </PageContainer>
  )
}
