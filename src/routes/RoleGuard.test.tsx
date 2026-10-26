import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Role } from '@/constants/roles'
import { adminProfile, managerProfile } from '@/mocks/fixtures'
import { useAuthStore } from '@/stores/authStore'
import { RoleGuard } from './RoleGuard'

function renderGuard(roles: Role[] | 'all') {
  return render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/forbidden" element={<p>forbidden page</p>} />
        <Route element={<RoleGuard roles={roles} />}>
          <Route path="/secret" element={<p>secret content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleGuard', () => {
  beforeEach(() => useAuthStore.setState({ user: null, ready: true }))

  it('redirects a signed-out visitor to login', () => {
    renderGuard([Role.SUPER_ADMIN])
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('shows Forbidden to a signed-in user with the wrong role', () => {
    useAuthStore.setState({ user: managerProfile, ready: true })
    renderGuard([Role.SUPER_ADMIN])
    expect(screen.getByText('forbidden page')).toBeInTheDocument()
  })

  it('renders the page for an allowed role', () => {
    useAuthStore.setState({ user: adminProfile, ready: true })
    renderGuard([Role.SUPER_ADMIN])
    expect(screen.getByText('secret content')).toBeInTheDocument()
  })

  it('lets any signed-in role through when roles is "all"', () => {
    useAuthStore.setState({ user: managerProfile, ready: true })
    renderGuard('all')
    expect(screen.getByText('secret content')).toBeInTheDocument()
  })
})
