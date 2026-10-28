import { zodResolver } from '@hookform/resolvers/zod'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { FormFingerprintEnroll } from './FormFingerprintEnroll'

const url = 'http://localhost:54321/rest/v1/device_enrollments'
const schema = z.object({ fingerprint_id: z.string().min(1, 'Scan the fingerprint first') })

function Harness({ onSubmit = () => undefined }: { onSubmit?: (v: { fingerprint_id: string }) => void }) {
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues: { fingerprint_id: '' } })
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormFingerprintEnroll control={control} name="fingerprint_id" label="Fingerprint" />
      <button type="submit">Save</button>
    </form>
  )
}

/** POST queues the scan; each GET returns the next state the bridge reports. */
function mockScan(states: Array<{ status: string; fingerprint_id?: string; error?: string }>) {
  let i = 0
  server.use(
    http.post(url, () => HttpResponse.json({ id: 'enr-1', status: 'PENDING', fingerprint_id: null, error: null })),
    http.get(url, () => {
      const s = states[Math.min(i++, states.length - 1)]
      return HttpResponse.json({ id: 'enr-1', fingerprint_id: null, error: null, ...s })
    }),
  )
}

describe('FormFingerprintEnroll', () => {
  it('blocks submit until a fingerprint is scanned', async () => {
    renderWithProviders(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Scan the fingerprint first')
  })

  it('fills the device user ID once the scanner reports success', async () => {
    mockScan([{ status: 'ENROLLING' }, { status: 'SUCCESS', fingerprint_id: '1125' }])
    let saved = ''
    renderWithProviders(<Harness onSubmit={(v) => (saved = v.fingerprint_id)} />)
    await userEvent.click(screen.getByRole('button', { name: /scan fingerprint/i }))
    expect(await screen.findByText(/place the same finger/i)).toBeInTheDocument()
    expect(await screen.findByText(/saved as id 1125/i, {}, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getByLabelText('Fingerprint')).toHaveValue('1125')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await vi.waitFor(() => expect(saved).toBe('1125'))
  })

  it('shows why a scan failed and lets the user retry', async () => {
    mockScan([{ status: 'FAILED', error: 'No finger was scanned within 90 seconds' }])
    renderWithProviders(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: /scan fingerprint/i }))
    expect(await screen.findByText(/no finger was scanned/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scan fingerprint/i })).toBeEnabled()
    expect(screen.getByLabelText('Fingerprint')).toHaveValue('')
  })
})
