import { Dumbbell, LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { strings } from '@/constants/strings'
import { useLogout } from '@/hooks/common/useAuth'
import { useGymSettings } from '@/hooks/common/useSettings'
import { routeRegistry } from '@/routes/registry'
import { useAuthStore } from '@/stores/authStore'

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export function AppShell() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const gym = useGymSettings()
  if (!user) return null

  const navItems = routeRegistry.filter(
    (r) => r.nav && (r.roles === 'all' || r.roles.includes(user.role)),
  )

  const handleLogout = () => logout.mutate()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex w-full flex-col border-b border-border bg-surface md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
            <Dumbbell aria-hidden="true" size={22} strokeWidth={2.5} />
          </span>
          <span className="font-display text-2xl font-extrabold uppercase leading-none tracking-wider">{gym.data?.gym_name ?? strings.appName}</span>
        </div>

        <nav aria-label="Main" className="flex flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-y-auto md:pb-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `group relative flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary-soft text-primary before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-primary'
                    : 'text-muted hover:bg-surface-raised hover:text-foreground'
                }`
              }
            >
              {item.nav && <item.nav.icon aria-hidden="true" size={18} />}
              {item.nav?.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-border p-4 md:block">
          <div className="mb-3 flex items-center gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised font-display text-lg font-bold text-primary ring-1 ring-border-strong">
              {initials(user.full_name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.full_name}</p>
              <p className="text-xs text-muted">{strings.roles[user.role]}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={handleLogout} loading={logout.isPending}>
            <LogOut aria-hidden="true" size={16} />
            {strings.auth.logout}
          </Button>
        </div>
      </aside>
      <main className="bg-glow min-w-0 flex-1 overflow-x-hidden p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
