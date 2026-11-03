import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activityService } from '@/services/common/activityService'
import { renderWithProviders } from '@/test/renderWithProviders'
import { RecentActivityTable } from './RecentActivityTable'

describe('RecentActivityTable', () => {
  beforeEach(() => {
    vi.spyOn(activityService, 'subscribe').mockReturnValue(() => {})
    vi.spyOn(activityService, 'subscribeBridge').mockReturnValue(() => {})
  })

  it('lists onboarded, granted and denied events with their decision', async () => {
    renderWithProviders(<RecentActivityTable />)
    const table = await screen.findByRole('table', { name: /recent activity/i })
    expect(within(table).getByText('Newcomer Noor')).toBeInTheDocument()
    expect(within(table).getByText('Fees not paid')).toBeInTheDocument()
    expect(within(table).getByText('New member registered')).toBeInTheDocument()
  })

  it('filters by decision and shows the count on each filter', async () => {
    renderWithProviders(<RecentActivityTable />)
    await screen.findByText('Newcomer Noor')
    expect(screen.getByRole('button', { name: /access denied/i })).toHaveTextContent('1')

    await userEvent.click(screen.getByRole('button', { name: /access denied/i }))
    const table = await screen.findByRole('table', { name: /recent activity/i })
    await within(table).findByText('Sara Khan')
    expect(within(table).queryByText('Ali Raza')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /access denied/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the scanner bridge as offline only when asked to', async () => {
    const { unmount } = renderWithProviders(<RecentActivityTable showBridge />)
    expect(await screen.findByText('Offline')).toBeInTheDocument()
    expect(await screen.findByText('42')).toBeInTheDocument()
    unmount()

    renderWithProviders(<RecentActivityTable />)
    await screen.findByText('Newcomer Noor')
    expect(screen.queryByText('Offline')).not.toBeInTheDocument()
  })
})
