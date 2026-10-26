import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { renderWithProviders } from '@/test/renderWithProviders'
import LoginPage from './LoginPage'

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<p>admin home</p>} />
    </Routes>,
    { route: '/login' },
  )
}

describe('LoginPage', () => {
  beforeEach(() => useAuthStore.setState({ user: null, ready: true }))

  it('shows validation errors for empty fields', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
  })

  it('signs in and goes to the role home page', async () => {
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email'), 'admin@gym.test')
    await userEvent.type(screen.getByLabelText('Password'), 'Admin@12345')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('admin home')).toBeInTheDocument()
  })
})
