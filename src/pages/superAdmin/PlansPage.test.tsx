import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { adminProfile } from '@/mocks/fixtures'
import { server } from '@/mocks/server'
import { useAuthStore } from '@/stores/authStore'
import { renderWithProviders } from '@/test/renderWithProviders'
import PlansPage from './PlansPage'

const base = 'http://localhost:54321'

describe('PlansPage', () => {
  beforeEach(() => useAuthStore.setState({ user: adminProfile, ready: true }))

  it('lists the plans with price, duration and type', async () => {
    renderWithProviders(<PlansPage />)
    const table = await screen.findByRole('table', { name: 'Plans' })
    const monthly = within(table).getByRole('row', { name: /Monthly/ })
    expect(monthly).toHaveTextContent('Rs 2,500')
    expect(monthly).toHaveTextContent('1 month')
    expect(within(table).getByRole('row', { name: /Lifetime/ })).toHaveTextContent('Lifetime')
    expect(within(table).getByRole('row', { name: /Trainer 8000/ })).toHaveTextContent('Trainer package')
  })

  it('adds a plan; empty months means lifetime', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${base}/rest/v1/rpc/create_plan`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json('VIP')
      }),
    )
    renderWithProviders(<PlansPage />)
    await screen.findByRole('table', { name: 'Plans' })
    await userEvent.click(screen.getByRole('button', { name: 'Add plan' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Plan name'), 'VIP Lifetime')
    await userEvent.type(within(dialog).getByLabelText('Price (PKR)'), '90000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add plan' }))
    await waitFor(() => expect(body).toMatchObject({ p_name: 'VIP Lifetime', p_price: 90000, p_months: null, p_is_trainer: false }))
  })

  it('validates a new plan before sending it', async () => {
    renderWithProviders(<PlansPage />)
    await screen.findByRole('table', { name: 'Plans' })
    await userEvent.click(screen.getByRole('button', { name: 'Add plan' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add plan' }))
    expect(await within(dialog).findByText('Plan name is required')).toBeInTheDocument()
  })

  it('sets a monthly discount and shows the resulting prices', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${base}/rest/v1/rpc/set_member_discount`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderWithProviders(<PlansPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Set discount for Sara Khan' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.clear(within(dialog).getByLabelText('Monthly discount (PKR)'))
    await userEvent.type(within(dialog).getByLabelText('Monthly discount (PKR)'), '500')
    const prices = within(dialog).getByRole('list', { name: 'Resulting prices' })
    expect(within(prices).getByText(/Monthly/).closest('li')).toHaveTextContent('Rs 2,000')
    expect(within(prices).getByText(/6-Month/).closest('li')).toHaveTextContent('Rs 9,500')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save discount' }))
    await waitFor(() => expect(body).toEqual({ p_member_id: 'member-2', p_amount: 500 }))
  })

  it('deletes a plan only after it is confirmed', async () => {
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(`${base}/rest/v1/rpc/delete_plan`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderWithProviders(<PlansPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Trainer 8000' }))
    const dialog = await screen.findByRole('dialog', { name: /delete plan/i })
    expect(body).toBeNull()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(body).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Delete Trainer 8000' }))
    await userEvent.click(within(await screen.findByRole('dialog', { name: /delete plan/i })).getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(body).toEqual({ p_code: 'TRAINER_8000' }))
  })
})
