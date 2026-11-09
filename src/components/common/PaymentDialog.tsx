import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { FormDatePicker } from '@/components/form/FormDatePicker'
import { FormInput } from '@/components/form/FormInput'
import { FormSelect } from '@/components/form/FormSelect'
import { paymentMethodStrings } from '@/constants/strings'
import { usePlans, useRecordPayment } from '@/hooks/common/useMembers'
import { recordPaymentSchema, type RecordPaymentValues } from '@/schemas/common/member.schema'
import type { Membership } from '@/types/common/member.types'
import { effectivePrice } from '@/utils/billing/billing'
import { formatPkr } from '@/utils/format'
import { PlanPreview } from './PlanPreview'

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  memberId: string
  membership: Membership | null
  /** True when the current plan has finished, so a different plan may be chosen. */
  canChangePlan: boolean
  /** Fixed PKR off every month for this member (0 = none). */
  monthlyDiscount: number
}

export function PaymentDialog({ open, onClose, memberId, membership, canChangePlan, monthlyDiscount }: PaymentDialogProps) {
  const plans = usePlans()
  const record = useRecordPayment()
  const currentPlan = membership?.plan_code ?? 'MONTHLY'
  const { control, handleSubmit, reset } = useForm<RecordPaymentValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: { plan_code: currentPlan, amount: 0, discount: 0, start_date: '', payment_method: 'CASH' },
  })
  const [planCode, amount, startDate] = useWatch({ control, name: ['plan_code', 'amount', 'start_date'] })
  const samePlan = planCode === membership?.plan_code
  const selected = plans.data?.find((p) => p.code === planCode)
  const price = selected ? effectivePrice(selected, monthlyDiscount) : 0
  const options = (plans.data ?? [])
    .filter((p) => (canChangePlan ? p.active || p.code === membership?.plan_code : p.code === membership?.plan_code))
    .map((p) => ({ value: p.code, label: `${p.name} (${formatPkr(effectivePrice(p, monthlyDiscount))})` }))

  const handlePay = (values: RecordPaymentValues) => {
    record.mutate(
      { member_id: memberId, amount: values.amount, plan_code: values.plan_code, start_date: values.start_date ?? '', discount: values.discount, payment_method: values.payment_method },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()} title="Take payment" description="Record a payment or renewal for this member.">
      <form onSubmit={handleSubmit(handlePay)} noValidate className="flex flex-col gap-4">
        <FormSelect control={control} name="plan_code" label="Plan" options={options} />
        <FormInput control={control} name="amount" label="Amount received (PKR)" asNumber />
        <FormSelect control={control} name="payment_method" label={paymentMethodStrings.label} options={[...paymentMethodStrings.options]} />
        <FormInput control={control} name="discount" label="Admission discount (only if admission applies)" asNumber />
        <FormDatePicker control={control} name="start_date" label="Start date (optional, default continues the cycle)" />
        {selected && monthlyDiscount > 0 && selected.months !== null && (
          <p className="text-sm text-muted">
            Monthly discount of {formatPkr(monthlyDiscount)} applied: {formatPkr(price)} per period.
          </p>
        )}
        {selected && (
          <PlanPreview
            price={price}
            monthsPerPeriod={selected.months}
            payment={amount || 0}
            credit={samePlan ? (membership?.credit ?? 0) : 0}
            anchorDate={startDate || (samePlan && membership ? membership.anchor_date : (startDate || membership?.anchor_date || ''))}
            monthsAlreadyCovered={samePlan && !startDate ? (membership?.months_covered ?? 0) : 0}
            admissionCharged={0}
          />
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={record.isPending}>
            Record payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
