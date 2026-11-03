import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Path } from '@/constants/paths'
import { renderWithProviders } from '@/test/renderWithProviders'
import { AttendanceDetailView } from './AttendanceDetailView'
import { AttendanceListView } from './AttendanceListView'

describe('AttendanceDetailView', () => {
  it('lists every month from joining to the current month with days attended', async () => {
    renderWithProviders(<AttendanceDetailView memberId="member-1" listPath={Path.AdminAttendance} />)
    expect(await screen.findByRole('heading', { name: 'Ali Raza' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /April 2026/ })).toHaveTextContent('0 of 10 days')
    expect(screen.getByRole('button', { name: /March 2026/ })).toHaveTextContent('2 of 31 days')
    expect(screen.getByRole('button', { name: /February 2026/ })).toHaveTextContent('1 of 12 days')
    expect(screen.getByText('Total days attended').closest('div.rounded-card')).toHaveTextContent('3')
  })

  it('opens a month to show the days the member came', async () => {
    renderWithProviders(<AttendanceDetailView memberId="member-1" listPath={Path.AdminAttendance} />)
    const march = await screen.findByRole('button', { name: /March 2026/ })
    expect(march).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(march)
    expect(march).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById('month-2026-03') as HTMLElement
    expect(within(panel).getByLabelText('2026-03-02: Came, 2 scans')).toBeInTheDocument()
    expect(within(panel).getByLabelText('2026-03-03: Came')).toBeInTheDocument()
    expect(within(panel).getByLabelText('2026-03-04: Did not come')).toBeInTheDocument()
    expect(within(panel).getByText(/2 scans/)).toBeInTheDocument()
  })
})

describe('AttendanceListView', () => {
  it('links each member to their attendance page', async () => {
    renderWithProviders(<AttendanceListView detailPath={Path.ManagerAttendanceDetail} />)
    expect(await screen.findByRole('link', { name: 'Ali Raza' })).toHaveAttribute('href', '/manager/attendance/member-1')
  })
})
