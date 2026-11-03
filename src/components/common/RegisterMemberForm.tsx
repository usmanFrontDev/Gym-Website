import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { FormDatePicker } from '@/components/form/FormDatePicker'
import { FormFingerprintEnroll } from '@/components/form/FormFingerprintEnroll'
import { FormInput } from '@/components/form/FormInput'
import { FormPhoneInput } from '@/components/form/FormPhoneInput'
import { FormSelect } from '@/components/form/FormSelect'
import { FormTextarea } from '@/components/form/FormTextarea'
import { Role } from '@/constants/roles'
import { useRegisterMember, usePlans } from '@/hooks/common/useMembers'
import { useGymSettings } from '@/hooks/common/useSettings'
import { useTrainerOptions } from '@/hooks/common/useStaff'
import { registerMemberSchema, type RegisterMemberValues } from '@/schemas/common/member.schema'
import { useAuthStore } from '@/stores/authStore'
import { DEFAULT_ADMISSION_FEE } from '@/utils/billing/plans'
import { effectivePrice } from '@/utils/billing/billing'
import { formatPkr, todayKarachi } from '@/utils/format'
import { PlanPreview } from './PlanPreview'

interface RegisterMemberFormProps {
  onRegistered: () => void
}

export function RegisterMemberForm({ onRegistered }: RegisterMemberFormProps) {
  const plans = usePlans()
  const trainers = useTrainerOptions()
  const gym = useGymSettings()
  const isOwner = useAuthStore((s) => s.user?.role === Role.SUPER_ADMIN)
  const register = useRegisterMember()
  const today = todayKarachi()

  const { control, handleSubmit, setValue } = useForm<RegisterMemberValues>({
    resolver: zodResolver(registerMemberSchema),
    defaultValues: {
      full_name: '', father_name: '', phone: '', emergency_contact: '', email: '', cnic: '', address: '', fingerprint_id: '',
      plan_code: 'MONTHLY', amount: 2500, admission_fee: DEFAULT_ADMISSION_FEE, discount: 0, monthly_discount: 0, start_date: today,
      trainer_id: '', commission: undefined,
    },
  })
  const [planCode, amount, admissionFee, discount, monthlyDiscount, startDate] = useWatch({
    control,
    name: ['plan_code', 'amount', 'admission_fee', 'discount', 'monthly_discount', 'start_date'],
  })
  const plan = plans.data?.find((p) => p.code === planCode)
  const isTrainerPlan = plan?.is_trainer_plan ?? false
  const price = plan ? effectivePrice(plan, monthlyDiscount || 0) : 0
  const defaultAdmissionFee = gym.data?.default_admission_fee

  useEffect(() => {
    if (plan) setValue('amount', price)
  }, [plan, price, setValue])

  useEffect(() => {
    if (defaultAdmissionFee !== undefined) setValue('admission_fee', defaultAdmissionFee)
  }, [defaultAdmissionFee, setValue])

  const handleRegister = (values: RegisterMemberValues) => {
    register.mutate(
      { ...values, commission: values.commission ?? 0, monthly_discount: values.monthly_discount ?? 0, start_date: values.start_date ?? '' },
      { onSuccess: onRegistered },
    )
  }

  return (
    <form onSubmit={handleSubmit(handleRegister)} noValidate className="flex flex-col gap-6">
      <fieldset className="grid gap-4 rounded-card border border-border bg-surface p-5 md:grid-cols-2">
        <legend className="px-2 text-lg font-bold text-primary">Personal info</legend>
        <FormInput control={control} name="full_name" label="Full name" />
        <FormInput control={control} name="father_name" label="Father name" />
        <FormPhoneInput control={control} name="phone" label="Phone" />
        <FormPhoneInput control={control} name="emergency_contact" label="Emergency contact" />
        <FormInput control={control} name="email" label="Email (optional)" type="email" />
        <FormInput control={control} name="cnic" label="CNIC (optional)" />
        <FormFingerprintEnroll control={control} name="fingerprint_id" label="Fingerprint ID (device user ID)" />
        <FormTextarea control={control} name="address" label="Address" />
      </fieldset>

      <fieldset className="grid gap-4 rounded-card border border-border bg-surface p-5 md:grid-cols-2">
        <legend className="px-2 text-lg font-bold text-primary">Plan and payment</legend>
        <FormSelect
          control={control}
          name="plan_code"
          label="Plan"
          options={(plans.data ?? []).filter((p) => p.active).map((p) => ({ value: p.code, label: `${p.name} (${formatPkr(effectivePrice(p, monthlyDiscount || 0))})` }))}
        />
        <FormInput control={control} name="amount" label="Amount paid (PKR)" asNumber />
        <FormInput control={control} name="admission_fee" label="Admission fee (0 allowed)" asNumber />
        <FormInput control={control} name="discount" label="Admission discount" asNumber />
        {isOwner && <FormInput control={control} name="monthly_discount" label="Monthly discount (PKR off every month)" asNumber />}
        <FormDatePicker control={control} name="start_date" label="Start date" />
        {isTrainerPlan && (
          <>
            <FormSelect
              control={control}
              name="trainer_id"
              label="Trainer"
              placeholder="Select a trainer"
              options={(trainers.data ?? []).map((t) => ({ value: t.id, label: t.full_name }))}
            />
            <FormInput control={control} name="commission" label="Trainer commission per month (PKR)" asNumber />
          </>
        )}
        {!isTrainerPlan && (
          <FormSelect
            control={control}
            name="trainer_id"
            label="Trainer (optional)"
            placeholder="No trainer"
            options={(trainers.data ?? []).map((t) => ({ value: t.id, label: t.full_name }))}
          />
        )}
        <div className="md:col-span-2">
          <PlanPreview
            price={price}
            monthsPerPeriod={plan ? plan.months : 1}
            payment={amount || 0}
            credit={0}
            anchorDate={startDate || today}
            monthsAlreadyCovered={0}
            admissionCharged={Math.max(0, (admissionFee || 0) - (discount || 0))}
          />
        </div>
      </fieldset>

      <div>
        <Button type="submit" size="lg" loading={register.isPending}>
          Register member
        </Button>
      </div>
    </form>
  )
}
