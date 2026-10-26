import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Path } from '@/constants/paths'
import { renderWithProviders } from '@/test/renderWithProviders'
import { MembersView } from './MembersView'

describe('MembersView', () => {
  it('loads members from the server and shows KPI cards', async () => {
    renderWithProviders(<MembersView detailPath={Path.AdminMemberDetail} />)
    expect(await screen.findByRole('link', { name: 'Ali Raza' })).toHaveAttribute('href', '/admin/members/member-1')
    expect(screen.getByText('Sara Khan')).toBeInTheDocument()
    expect(screen.getByText('Tariq Trainer')).toBeInTheDocument()
  })

  it('searches server-side after a debounce and keeps the term in the URL', async () => {
    renderWithProviders(<MembersView detailPath={Path.AdminMemberDetail} />)
    await screen.findByText('Ali Raza')
    await userEvent.type(screen.getByRole('searchbox', { name: /search by name/i }), 'sara')
    await waitFor(() => expect(screen.queryByText('Ali Raza')).not.toBeInTheDocument(), { timeout: 2000 })
    expect(screen.getByText('Sara Khan')).toBeInTheDocument()
  })

  it('does not link names when the role has no detail page (trainer)', async () => {
    renderWithProviders(<MembersView />)
    await screen.findByText('Ali Raza')
    expect(screen.queryByRole('link', { name: 'Ali Raza' })).not.toBeInTheDocument()
  })
})
