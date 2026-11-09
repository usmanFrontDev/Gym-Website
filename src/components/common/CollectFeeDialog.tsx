import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { directoryStrings, paymentMethodStrings } from '@/constants/strings'
import { useCollectFee } from '@/hooks/common/useDirectory'
import { collectFeeSchema, type CollectFeeValues } from '@/schemas/common/member.schema'
import { FormInput } from '../form/FormInput'
import { FormSelect } from '../form/FormSelect'
import { Button } from './Button'
import { Modal } from './Modal'

interface CollectFeeDialogProps {
  member: { id: string; full_name: string } | null
  onClose: () => void
}

/** Managers enter what the client handed over and press Received; the last payment date updates right away. */
export function CollectFeeDialog({ member, onClose }: CollectFeeDialogProps) {
  const collect = useCollectFee()
  const { control, handleSubmit, reset } = useForm<CollectFeeValues>({
    resolver: zodResolver(collectFeeSchema),
    defaultValues: { amount: 0, payment_method: 'CASH' },
  })
  const c = directoryStrings.collect

  const handleClose = () => {
    reset()
    onClose()
  }
  const handleReceived = (values: CollectFeeValues) => {
    if (!member) return
    collect.mutate({ memberId: member.id, amount: values.amount, method: values.payment_method }, { onSuccess: handleClose })
  }

  return (
    <Modal open={member !== null} onOpenChange={(next) => !next && handleClose()} title={c.title} description={member ? c.description(member.full_name) : undefined}>
      <form onSubmit={handleSubmit(handleReceived)} noValidate className="flex flex-col gap-4">
        <FormInput control={control} name="amount" label={c.amount} asNumber />
        <FormSelect control={control} name="payment_method" label={paymentMethodStrings.label} options={[...paymentMethodStrings.options]} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={collect.isPending}>
            {c.received}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
