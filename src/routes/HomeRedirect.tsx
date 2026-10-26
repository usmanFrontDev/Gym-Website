import { Navigate } from 'react-router-dom'
import { Path } from '@/constants/paths'
import { Spinner } from '@/components/common/Spinner'
import { useAuthStore } from '@/stores/authStore'
import { ROLE_HOME } from './homePaths'

/** `/` goes to the signed-in role's home page. */
export function HomeRedirect() {
  const { user, ready } = useAuthStore()
  if (!ready) return <Spinner />
  return <Navigate to={user ? ROLE_HOME[user.role] : Path.Login} replace />
}
