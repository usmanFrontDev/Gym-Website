import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { FormInput } from '@/components/form/FormInput'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import { FormTextarea } from '@/components/form/FormTextarea'
import { settingsStrings, strings } from '@/constants/strings'
import { useUpdateProfile } from '@/hooks/common/useSettings'
import { profileSchema, type ProfileValues } from '@/schemas/common/settings.schema'
import { useAuthStore } from '@/stores/authStore'

export function ProfileSettingsForm() {
  const user = useAuthStore((s) => s.user)
  const update = useUpdateProfile()
  const { control, handleSubmit } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '', father_name: user?.father_name ?? '', phone: user?.phone ?? '', address: user?.address ?? '',
    },
  })
  if (!user) return null

  const handleSave = (values: ProfileValues) => update.mutate(values)
  const s = settingsStrings.account

  return (
    <form onSubmit={handleSubmit(handleSave)} noValidate className="grid gap-4 md:grid-cols-2">
      <FormInput control={control} name="full_name" label="Full name" />
      <FormInput control={control} name="father_name" label="Father name" />
      <FormPhoneInput control={control} name="phone" label="Phone" />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{s.email}</span>
        <p className="flex h-11 items-center rounded-lg border border-border bg-background px-3 text-muted">{user.email}</p>
      </div>
      <div className="md:col-span-2">
        <FormTextarea control={control} name="address" label="Address" />
      </div>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <Button type="submit" loading={update.isPending}>
          {s.save}
        </Button>
        <span className="text-sm text-muted">
          {s.role}: {strings.roles[user.role]}
        </span>
      </div>
    </form>
  )
}
