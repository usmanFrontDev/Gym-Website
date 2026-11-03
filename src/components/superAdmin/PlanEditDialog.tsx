import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { FormCheckbox } from '@/components/form/FormCheckbox'
import { FormInput } from '@/components/form/FormInput'
import { planStrings } from '@/constants/strings'
import { useUpdatePlan } from '@/hooks/superAdmin/usePlansAdmin'
import { planEditSchema, type PlanEditValues } from '@/schemas/superAdmin/plan.schema'
import type { Plan } from '@/types/common/member.types'

interface PlanEditDialogProps {
  plan: Plan | null
  onClose: () => void
}

export function PlanEditDialog({ plan, onClose }: PlanEditDialogProps) {
  const update = useUpdatePlan()
  const { control, handleSubmit, reset } = useForm<PlanEditValues>({
    resolver: zodResolver(planEditSchema),
    defaultValues: { name: '', price: 0, active: true },
  })

  useEffect(() => {
    if (plan) reset({ name: plan.name, price: plan.price, active: plan.active })
  }, [plan, reset])

  const handleSave = (values: PlanEditValues) =>
    plan && update.mutate({ code: plan.code, ...values }, { onSuccess: onClose })

  return (
    <Modal open={plan !== null} onOpenChange={(next) => !next && onClose()} title={`Edit ${plan?.name ?? 'plan'}`} description={planStrings.priceNote}>
      <form onSubmit={handleSubmit(handleSave)} noValidate className="flex flex-col gap-4">
        <FormInput control={control} name="name" label="Plan name" />
        <FormInput control={control} name="price" label="Price (PKR)" asNumber />
        <FormCheckbox control={control} name="active" label="Available for new members and renewals" />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={update.isPending}>
            Save plan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
