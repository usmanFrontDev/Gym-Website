import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { FormInput } from '@/components/form/FormInput'
import { useSetMemberDiscount } from '@/hooks/superAdmin/usePlansAdmin'
import { memberDiscountSchema, type MemberDiscountValues } from '@/schemas/superAdmin/plan.schema'
import type { Plan } from '@/types/common/member.types'
import type { DiscountMemberRow } from '@/types/superAdmin/plan.types'
import { effectivePrice } from '@/utils/billing/billing'
import { formatPkr } from '@/utils/format'

interface MemberDiscountDialogProps {
  member: DiscountMemberRow | null
  plans: Plan[]
  onClose: () => void
}

export function MemberDiscountDialog({ member, plans, onClose }: MemberDiscountDialogProps) {
  const save = useSetMemberDiscount()
  const { control, handleSubmit, reset } = useForm<MemberDiscountValues>({
    resolver: zodResolver(memberDiscountSchema),
    defaultValues: { amount: 0 },
  })
  const amount = useWatch({ control, name: 'amount' }) || 0

  useEffect(() => {
    if (member) reset({ amount: member.monthly_discount })
  }, [member, reset])

  const handleSave = (values: MemberDiscountValues) =>
    member && save.mutate({ memberId: member.id, amount: values.amount }, { onSuccess: onClose })

  const examples = plans.filter((p) => p.active && p.months !== null).slice(0, 4)

  return (
    <Modal
      open={member !== null}
      onOpenChange={(next) => !next && onClose()}
      title={`Discount for ${member?.full_name ?? 'member'}`}
      description="Taken off every month of the member's plan. Enter 0 to remove it."
    >
      <form onSubmit={handleSubmit(handleSave)} noValidate className="flex flex-col gap-4">
        <FormInput control={control} name="amount" label="Monthly discount (PKR)" asNumber />
        {examples.length > 0 && (
          <ul aria-label="Resulting prices" className="rounded-lg border border-border bg-background p-3 text-sm">
            {examples.map((p) => (
              <li key={p.code} className="flex justify-between gap-3 py-1">
                <span className="text-muted">{p.name}</span>
                <span className="font-semibold">
                  {formatPkr(effectivePrice(p, amount))}
                  {amount > 0 && <span className="ml-2 text-muted line-through">{formatPkr(p.price)}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            Save discount
          </Button>
        </div>
      </form>
    </Modal>
  )
}
