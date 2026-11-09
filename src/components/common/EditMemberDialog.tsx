import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { memberEditStrings } from '@/constants/strings'
import { useUpdateMember } from '@/hooks/common/useMembers'
import { editMemberSchema, type EditMemberValues } from '@/schemas/common/member.schema'
import type { MemberRecord } from '@/types/common/member.types'
import { FormInput } from '../form/FormInput'
import { FormPhoneInput } from '../form/FormPhoneInput'
import { FormTextarea } from '../form/FormTextarea'
import { Button } from './Button'
import { Modal } from './Modal'

interface EditMemberDialogProps {
  member: MemberRecord
  open: boolean
  onClose: () => void
}

const toValues = (m: MemberRecord): EditMemberValues => ({
  full_name: m.full_name, father_name: m.father_name ?? '', phone: m.phone, emergency_contact: m.emergency_contact ?? '',
  email: m.email ?? '', cnic: m.cnic ?? '', address: m.address ?? '',
})

/** Owner-only: correct a member's personal details. Plan, payments and fingerprint are not editable here. */
export function EditMemberDialog({ member, open, onClose }: EditMemberDialogProps) {
  const update = useUpdateMember()
  const { control, handleSubmit, reset } = useForm<EditMemberValues>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: toValues(member),
  })

  useEffect(() => {
    if (open) reset(toValues(member))
  }, [open, member, reset])

  const handleSave = (values: EditMemberValues) => {
    update.mutate({ member_id: member.id, ...values }, { onSuccess: onClose })
  }

  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()} title={memberEditStrings.title} description={memberEditStrings.description}>
      <form onSubmit={handleSubmit(handleSave)} noValidate className="flex flex-col gap-4">
        <FormInput control={control} name="full_name" label="Full name" />
        <FormInput control={control} name="father_name" label="Father name" />
        <FormPhoneInput control={control} name="phone" label="Phone" />
        <FormPhoneInput control={control} name="emergency_contact" label="Emergency contact" />
        <FormInput control={control} name="email" label="Email (optional)" type="email" />
        <FormInput control={control} name="cnic" label="CNIC (optional)" />
        <FormTextarea control={control} name="address" label="Address" />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={update.isPending}>
            {memberEditStrings.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
