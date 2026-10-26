import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { FormTextarea } from '@/components/form/FormTextarea'
import { useVoidPayment } from '@/hooks/common/useMembers'
import { voidPaymentSchema, type VoidPaymentValues } from '@/schemas/common/member.schema'

interface VoidPaymentDialogProps {
  paymentId: string | null
  onClose: () => void
}

export function VoidPaymentDialog({ paymentId, onClose }: VoidPaymentDialogProps) {
  const voidPayment = useVoidPayment()
  const { control, handleSubmit, reset } = useForm<VoidPaymentValues>({
    resolver: zodResolver(voidPaymentSchema),
    defaultValues: { reason: '' },
  })

  const handleVoid = (values: VoidPaymentValues) => {
    if (!paymentId) return
    voidPayment.mutate(
      { paymentId, reason: values.reason },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  return (
    <Modal open={paymentId !== null} onOpenChange={(next) => !next && onClose()} title="Void payment" description="Payments are never deleted. Enter a reason, then re-enter the correct payment.">
      <form onSubmit={handleSubmit(handleVoid)} noValidate className="flex flex-col gap-4">
        <FormTextarea control={control} name="reason" label="Reason" />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={voidPayment.isPending}>
            Void payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
