import { PageContainer } from '@/components/ui/PageContainer'
import { strings } from '@/constants/strings'
import { useAuthStore } from '@/stores/authStore'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null
  const rows: [string, string][] = [
    ['Name', user.full_name],
    ['Email', user.email],
    ['Role', strings.roles[user.role]],
    ['Phone', user.phone ?? strings.common.none],
  ]
  return (
    <PageContainer title={strings.nav.profile}>
      <dl className="grid max-w-md grid-cols-2 gap-3 rounded-card border border-border bg-surface p-6">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </PageContainer>
  )
}
