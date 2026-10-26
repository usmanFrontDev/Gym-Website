import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { Suspense } from 'react'
import { Path } from '@/constants/paths'
import { Spinner } from '@/components/common/Spinner'
import { AppShell } from '@/components/ui/AppShell'
import LoginPage from '@/pages/common/LoginPage'
import ForbiddenPage from '@/pages/common/ForbiddenPage'
import NotFoundPage from '@/pages/common/NotFoundPage'
import { HomeRedirect } from './HomeRedirect'
import { RoleGuard } from './RoleGuard'
import { routeRegistry } from './registry'

function buildRoutes(): RouteObject[] {
  const protectedChildren: RouteObject[] = routeRegistry.map((entry) => {
    const Element = entry.element
    return {
      element: <RoleGuard roles={entry.roles} />,
      children: [
        {
          path: entry.path,
          element: (
            <Suspense fallback={<Spinner />}>
              <Element />
            </Suspense>
          ),
        },
      ],
    }
  })

  return [
    { path: Path.Login, element: <LoginPage /> },
    { path: Path.Forbidden, element: <ForbiddenPage /> },
    { path: Path.Root, element: <HomeRedirect /> },
    { element: <AppShell />, children: protectedChildren },
    { path: '*', element: <NotFoundPage /> },
  ]
}

export const router = createBrowserRouter(buildRoutes())
