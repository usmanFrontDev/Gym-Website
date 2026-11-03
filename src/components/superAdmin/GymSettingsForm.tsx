import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { QueryState } from '@/components/common/QueryState'
import { FormInput } from '@/components/form/FormInput'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import { FormTextarea } from '@/components/form/FormTextarea'
import { settingsStrings } from '@/constants/strings'
import { useGymSettings, useUpdateGymSettings } from '@/hooks/common/useSettings'
import { gymSettingsSchema, type GymSettingsValues } from '@/schemas/common/settings.schema'

export function GymSettingsForm() {
  const gym = useGymSettings()
  const update = useUpdateGymSettings()
  const { control, handleSubmit, reset } = useForm<GymSettingsValues>({
    resolver: zodResolver(gymSettingsSchema),
    defaultValues: { gym_name: '', phone: '', address: '', default_admission_fee: 0 },
  })
  const s = settingsStrings.gym

  useEffect(() => {
    if (gym.data) {
      reset({
        gym_name: gym.data.gym_name, phone: gym.data.phone ?? '', address: gym.data.address ?? '',
        default_admission_fee: gym.data.default_admission_fee,
      })
    }
  }, [gym.data, reset])

  const handleSave = (values: GymSettingsValues) => update.mutate(values)

  return (
    <QueryState isLoading={gym.isLoading} error={gym.error} onRetry={() => gym.refetch()}>
      <form onSubmit={handleSubmit(handleSave)} noValidate className="grid gap-4 md:grid-cols-2">
        <FormInput control={control} name="gym_name" label="Gym name" />
        <FormPhoneInput control={control} name="phone" label="Gym phone" />
        <div className="flex flex-col gap-1">
          <FormInput control={control} name="default_admission_fee" label="Default admission fee (PKR)" asNumber />
          <p className="text-xs text-muted">{s.admissionHint}</p>
        </div>
        <div className="md:col-span-2">
          <FormTextarea control={control} name="address" label="Gym address" />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" loading={update.isPending}>
            {s.save}
          </Button>
        </div>
      </form>
    </QueryState>
  )
}
