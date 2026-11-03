import { zodResolver } from '@hookform/resolvers/zod'
import { Dumbbell } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { FormInput } from '@/components/form/FormInput'
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { strings } from '@/constants/strings'
import { useLogin } from '@/hooks/common/useAuth'
import { loginSchema, type LoginValues } from '@/schemas/common/auth.schema'
import { ROLE_HOME } from '@/routes/homePaths'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const login = useLogin()
  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleLogin = (values: LoginValues) => {
    login.mutate(values, { onSuccess: (profile) => navigate(ROLE_HOME[profile.role], { replace: true }) })
  }

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />

  return (
    <main className="bg-glow flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(handleLogin)}
        noValidate
        className="flex w-full max-w-sm flex-col gap-5 rounded-card border border-border-strong bg-surface p-8 shadow-card"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell aria-hidden="true" size={26} strokeWidth={2.5} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold uppercase leading-none tracking-wider">{strings.auth.title}</h1>
            <p className="mt-1 text-sm text-muted">{strings.auth.subtitle}</p>
          </div>
        </div>
        <FormInput control={control} name="email" label={strings.auth.email} type="email" />
        <FormPasswordInput control={control} name="password" label={strings.auth.password} />
        <Button type="submit" size="lg" loading={login.isPending}>
          {strings.auth.submit}
        </Button>
      </form>
    </main>
  )
}
