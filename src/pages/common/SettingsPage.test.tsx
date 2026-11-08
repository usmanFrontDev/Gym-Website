import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { adminProfile, managerProfile } from '@/mocks/fixtures'
import { server } from '@/mocks/server'
import { changePasswordSchema } from '@/schemas/common/settings.schema'
import { useAuthStore } from '@/stores/authStore'
import { renderWithProviders } from '@/test/renderWithProviders'
import SettingsPage from './SettingsPage'

const base = 'http://localhost:54321'

describe('SettingsPage', () => {
  beforeEach(() => useAuthStore.setState({ user: adminProfile, ready: true }))

  it('shows account, security and alert settings to every role', async () => {
    useAuthStore.setState({ user: managerProfile, ready: true })
    renderWithProviders(<SettingsPage />)
    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Security' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Alerts on this device' })).toBeInTheDocument()
  })

  it('shows the gym section to the owner only', async () => {
    const { unmount } = renderWithProviders(<SettingsPage />)
    expect(await screen.findByRole('heading', { name: 'Gym' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Gym name')).toHaveValue('Try Workout Gym')
    unmount()

    useAuthStore.setState({ user: managerProfile, ready: true })
    renderWithProviders(<SettingsPage />)
    expect(screen.queryByRole('heading', { name: 'Gym' })).not.toBeInTheDocument()
  })

  it('saves the profile through the update_my_profile RPC', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${base}/rest/v1/rpc/update_my_profile`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderWithProviders(<SettingsPage />)
    const name = screen.getByLabelText('Full name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Gym Owner Updated')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(body).toMatchObject({ p_full_name: 'Gym Owner Updated' }))
  })

  it('asks for a confirmation before signing out other devices', async () => {
    renderWithProviders(<SettingsPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign out other devices' }))
    expect(await screen.findByRole('dialog')).toHaveTextContent('Every other browser or laptop')
  })
})

describe('changePasswordSchema', () => {
  const ok = { current_password: 'oldpassword', new_password: 'newpassword1', confirm_password: 'newpassword1' }

  it('accepts a matching new password', () => {
    expect(changePasswordSchema.safeParse(ok).success).toBe(true)
  })

  it('rejects a mismatch, a short password and re-using the old one', () => {
    expect(changePasswordSchema.safeParse({ ...ok, confirm_password: 'different1' }).success).toBe(false)
    expect(changePasswordSchema.safeParse({ ...ok, new_password: 'short', confirm_password: 'short' }).success).toBe(false)
    expect(changePasswordSchema.safeParse({ ...ok, new_password: 'oldpassword', confirm_password: 'oldpassword' }).success).toBe(false)
  })
})
