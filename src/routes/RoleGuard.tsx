import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Path } from '@/constants/paths'
import type { Role } from '@/constants/roles'
import { Spinner } from '@/components/common/Spinner'
import { useAuthStore } from '@/stores/authStore'

interface RoleGuardProps {
  roles: Role[] | 'all'
}

/** Not signed in -> login. Wrong role -> Forbidden. */
export function RoleGuard({ roles }: RoleGuardProps) {
  const { user, ready } = useAuthStore()
  const location = useLocation()

  if (!ready) return <Spinner />
  if (!user) return <Navigate to={Path.Login} replace state={{ from: location.pathname }} />
  if (roles !== 'all' && !roles.includes(user.role)) return <Navigate to={Path.Forbidden} replace />
  return <Outlet />
}
