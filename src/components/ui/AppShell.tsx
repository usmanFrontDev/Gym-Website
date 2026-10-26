import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { strings } from '@/constants/strings'
import { useLogout } from '@/hooks/common/useAuth'
import { routeRegistry } from '@/routes/registry'
import { useAuthStore } from '@/stores/authStore'

export function AppShell() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  if (!user) return null

  const navItems = routeRegistry.filter(
    (r) => r.nav && (r.roles === 'all' || r.roles.includes(user.role)),
  )

  const handleLogout = () => logout.mutate()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex w-full flex-col border-b border-border bg-surface md:w-64 md:border-b-0 md:border-r">
        <div className="p-5 text-xl font-extrabold text-primary">{strings.appName}</div>
        <nav aria-label="Main" className="flex flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-surface-raised'
                }`
              }
            >
              {item.nav?.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden p-4 md:block">
          <p className="truncate text-sm font-semibold">{user.full_name}</p>
          <p className="mb-3 text-xs text-muted">{strings.roles[user.role]}</p>
          <Button variant="outline" size="sm" onClick={handleLogout} loading={logout.isPending}>
            {strings.auth.logout}
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
