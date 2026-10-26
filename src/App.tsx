import { RouterProvider } from 'react-router-dom'
import { useAuthBootstrap } from '@/hooks/common/useAuth'
import { router } from '@/routes/router'

export function App() {
  useAuthBootstrap()
  return <RouterProvider router={router} />
}
