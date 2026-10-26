import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { FormInput } from '@/components/form/FormInput'
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import { FormSelect } from '@/components/form/FormSelect'
import { FormTextarea } from '@/components/form/FormTextarea'
import { Role } from '@/constants/roles'
import { strings } from '@/constants/strings'
import { useCreateStaff } from '@/hooks/superAdmin/useAdmin'
import { trainerSchema, type TrainerValues } from '@/schemas/superAdmin/staff.schema'

interface StaffFormDialogProps {
  role: Role.MANAGER | Role.TRAINER | null
  onClose: () => void
  onCreated: (password: string) => void
}

export function StaffFormDialog({ role, onClose, onCreated }: StaffFormDialogProps) {
  const create = useCreateStaff()
  const { control, handleSubmit, reset } = useForm<TrainerValues>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      full_name: '', father_name: '', cnic: '', phone: '', address: '', email: '', password: '', fingerprint_id: '', trainer_type: 'GYM',
    },
  })

  const handleCreate = (values: TrainerValues) => {
    if (!role) return
    create.mutate(
      { ...values, role, trainer_type: role === Role.TRAINER ? values.trainer_type : undefined },
      {
        onSuccess: (result) => {
          reset()
          onClose()
          onCreated(result.password)
        },
      },
    )
  }

  return (
    <Modal
      open={role !== null}
      onOpenChange={(next) => !next && onClose()}
      title={role === Role.TRAINER ? 'Add trainer' : 'Add manager'}
      description="Leave the password empty to generate a secure one."
    >
      <form onSubmit={handleSubmit(handleCreate)} noValidate className="flex flex-col gap-4">
        <FormInput control={control} name="full_name" label="Full name" />
        <FormInput control={control} name="father_name" label="Father name" />
        <FormInput control={control} name="cnic" label="CNIC" />
        <FormPhoneInput control={control} name="phone" label="Phone" />
        <FormInput control={control} name="email" label="Email" type="email" />
        <FormTextarea control={control} name="address" label="Address" />
        <FormInput control={control} name="fingerprint_id" label="Fingerprint ID (optional)" />
        {role === Role.TRAINER && (
          <FormSelect
            control={control}
            name="trainer_type"
            label="Trainer type"
            options={[
              { value: 'GYM', label: strings.trainerTypes.GYM },
              { value: 'MARTIAL_ARTS', label: strings.trainerTypes.MARTIAL_ARTS },
            ]}
          />
        )}
        <FormPasswordInput control={control} name="password" label="Password (optional)" />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>{strings.common.cancel}</Button>
          <Button type="submit" loading={create.isPending}>{strings.common.save}</Button>
        </div>
      </form>
    </Modal>
  )
}
