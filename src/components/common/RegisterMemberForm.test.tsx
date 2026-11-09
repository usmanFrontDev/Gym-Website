import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { plans } from '@/mocks/fixtures'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { RegisterMemberForm } from './RegisterMemberForm'

const base = 'http://localhost:54321'

describe('RegisterMemberForm plan choice', () => {
  // the trainer picker reads the profiles table, which the shared mock answers with one profile
  beforeEach(() => server.use(http.get(`${base}/rest/v1/profiles`, () => HttpResponse.json([]))))

  it('starts on Monthly when it is available', async () => {
    renderWithProviders(<RegisterMemberForm onRegistered={vi.fn()} />)
    await screen.findByRole('option', { name: /Monthly/ })
    expect(screen.getByLabelText('Plan')).toHaveValue('MONTHLY')
  })

  it('falls back to the first available plan when Monthly was deleted or turned off', async () => {
    server.use(http.get(`${base}/rest/v1/plans`, () => HttpResponse.json(plans.filter((p) => p.code !== 'MONTHLY'))))
    renderWithProviders(<RegisterMemberForm onRegistered={vi.fn()} />)
    await screen.findByRole('option', { name: /6-Month/ })
    // the form value itself (not just what the dropdown shows) moves to the first plan, so its price is charged
    await waitFor(() => expect(screen.getByLabelText(/amount paid/i)).toHaveValue(12500))
  })
})
