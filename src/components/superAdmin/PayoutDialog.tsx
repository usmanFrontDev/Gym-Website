import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { QueryState } from '@/components/common/QueryState'
import { FormInput } from '@/components/form/FormInput'
import { strings } from '@/constants/strings'
import { useAddPayout, usePayouts } from '@/hooks/superAdmin/useAdmin'
import { payoutSchema, type PayoutValues } from '@/schemas/superAdmin/staff.schema'
import { formatDate, formatPkr } from '@/utils/format'

interface PayoutDialogProps {
  trainerId: string | null
  trainerName: string
  onClose: () => void
}

export function PayoutDialog({ trainerId, trainerName, onClose }: PayoutDialogProps) {
  const payouts = usePayouts(trainerId)
  const add = useAddPayout()
  const { control, handleSubmit, reset } = useForm<PayoutValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { amount: undefined, note: '' },
  })

  const handlePayout = (values: PayoutValues) => {
    if (!trainerId) return
    add.mutate({ trainerId, ...values }, { onSuccess: () => reset() })
  }

  return (
    <Modal open={trainerId !== null} onOpenChange={(next) => !next && onClose()} title={`Payouts: ${trainerName}`} description="Record money paid to the trainer.">
      <form onSubmit={handleSubmit(handlePayout)} noValidate className="flex flex-col gap-4">
        <FormInput control={control} name="amount" label="Amount paid (PKR)" asNumber />
        <FormInput control={control} name="note" label="Note (optional)" />
        <Button type="submit" loading={add.isPending}>Record payout</Button>
      </form>
      <h3 className="mb-2 mt-6 font-bold">History</h3>
      <QueryState isLoading={payouts.isLoading} error={payouts.error} isEmpty={payouts.data?.length === 0}>
        <ul className="divide-y divide-border text-sm">
          {payouts.data?.map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <span>{formatDate(p.paid_on)} {p.note && `· ${p.note}`}</span>
              <strong>{formatPkr(p.amount)}</strong>
            </li>
          ))}
        </ul>
      </QueryState>
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>{strings.common.close}</Button>
      </div>
    </Modal>
  )
}
