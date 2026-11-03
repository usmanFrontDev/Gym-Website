import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { settingsStrings } from '@/constants/strings'
import { useChangePassword, useSignOutOtherDevices } from '@/hooks/common/useSettings'
import { changePasswordSchema, type ChangePasswordValues } from '@/schemas/common/settings.schema'

export function PasswordSettingsForm() {
  const change = useChangePassword()
  const signOutOthers = useSignOutOtherDevices()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { control, handleSubmit, reset } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })
  const s = settingsStrings.security

  const handleChange = (values: ChangePasswordValues) =>
    change.mutate({ current: values.current_password, next: values.new_password }, { onSuccess: () => reset() })
  const handleOtherDevicesClick = () => setConfirmOpen(true)
  const handleConfirmOtherDevices = () => signOutOthers.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(handleChange)} noValidate className="grid gap-4 md:max-w-md">
        <FormPasswordInput control={control} name="current_password" label="Current password" />
        <FormPasswordInput control={control} name="new_password" label="New password" />
        <FormPasswordInput control={control} name="confirm_password" label="Confirm new password" />
        <div>
          <Button type="submit" loading={change.isPending}>
            {s.save}
          </Button>
        </div>
      </form>
      <div className="border-t border-border pt-6">
        <Button variant="secondary" onClick={handleOtherDevicesClick}>
          {s.otherDevices}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title={s.otherDevicesTitle}
        message={s.otherDevicesMessage}
        loading={signOutOthers.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmOtherDevices}
      />
    </div>
  )
}
