import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { FormCheckbox } from '@/components/form/FormCheckbox'
import { FormInput } from '@/components/form/FormInput'
import { planStrings } from '@/constants/strings'
import { useCreatePlan } from '@/hooks/superAdmin/usePlansAdmin'
import { planSchema, type PlanValues } from '@/schemas/superAdmin/plan.schema'

interface PlanFormDialogProps {
  open: boolean
  onClose: () => void
}

export function PlanFormDialog({ open, onClose }: PlanFormDialogProps) {
  const create = useCreatePlan()
  const { control, handleSubmit, reset } = useForm<PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: '', price: undefined, months: undefined, is_trainer_plan: false },
  })

  const handleCreate = (values: PlanValues) =>
    create.mutate(
      { name: values.name, price: values.price, months: values.months ?? null, is_trainer_plan: values.is_trainer_plan },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )

  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()} title={planStrings.add} description="Create a new package members can be registered on.">
      <form onSubmit={handleSubmit(handleCreate)} noValidate className="flex flex-col gap-4">
        <FormInput control={control} name="name" label="Plan name" placeholder="e.g. Quarterly" />
        <FormInput control={control} name="price" label="Price (PKR)" asNumber />
        <div className="flex flex-col gap-1">
          <FormInput control={control} name="months" label="Months covered (empty = lifetime)" asNumber />
          <p className="text-xs text-muted">{planStrings.lifetimeHint}</p>
        </div>
        <div className="flex flex-col gap-1">
          <FormCheckbox control={control} name="is_trainer_plan" label="Trainer package" />
          <p className="text-xs text-muted">{planStrings.trainerHint}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            {planStrings.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
