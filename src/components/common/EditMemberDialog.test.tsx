import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { updatedMembers } from '@/mocks/handlers'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { MemberRecord } from '@/types/common/member.types'
import { EditMemberDialog } from './EditMemberDialog'

const member: MemberRecord = {
  id: 'member-1', full_name: 'Ali Raza', father_name: 'Raza', phone: '0301-5555555', emergency_contact: null, email: null,
  cnic: null, address: 'Lahore', fingerprint_id: '501', blocked: false, registered_by: 'manager-1', registration_date: '2025-06-02', monthly_discount: 0,
}

describe('EditMemberDialog', () => {
  it('starts with the current details and saves the corrected ones', async () => {
    updatedMembers.length = 0
    const onClose = vi.fn()
    renderWithProviders(<EditMemberDialog member={member} open onClose={onClose} />)
    const dialog = await screen.findByRole('dialog', { name: /edit member/i })
    const name = within(dialog).getByLabelText(/full name/i)
    expect(name).toHaveValue('Ali Raza')
    await userEvent.clear(name)
    await userEvent.type(name, 'Ali Raza Khan')
    await userEvent.clear(within(dialog).getByLabelText(/address/i))
    await userEvent.type(within(dialog).getByLabelText(/address/i), 'Karachi')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(updatedMembers).toEqual([
        {
          p_member_id: 'member-1', p_full_name: 'Ali Raza Khan', p_father_name: 'Raza', p_phone: '0301-5555555',
          p_emergency_contact: null, p_email: null, p_cnic: null, p_address: 'Karachi',
        },
      ]),
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('does not save without a name', async () => {
    updatedMembers.length = 0
    renderWithProviders(<EditMemberDialog member={member} open onClose={vi.fn()} />)
    const dialog = await screen.findByRole('dialog', { name: /edit member/i })
    await userEvent.clear(within(dialog).getByLabelText(/full name/i))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(await within(dialog).findByText(/name is required/i)).toBeInTheDocument()
    expect(updatedMembers).toEqual([])
  })
})
