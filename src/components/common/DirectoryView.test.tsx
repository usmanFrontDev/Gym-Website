import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { collectedFees } from '@/mocks/handlers'
import { renderWithProviders } from '@/test/renderWithProviders'
import { DirectoryView } from './DirectoryView'

describe('DirectoryView', () => {
  it('shows only name, father name, registration date and last payment date', async () => {
    renderWithProviders(<DirectoryView />)
    const table = await screen.findByRole('table', { name: /find member/i })
    expect(await screen.findByText('Ali Raza')).toBeInTheDocument()
    const headers = Array.from(table.querySelectorAll('th')).map((th) => th.textContent)
    expect(headers).toEqual(['Name', 'Father name', 'Registered', 'Last payment', 'Action'])
    expect(screen.getAllByText('02 Jun 2025')).toHaveLength(2)
  })

  it('collects a fee: the amount typed is sent for that member when Received is pressed', async () => {
    collectedFees.length = 0
    renderWithProviders(<DirectoryView />)
    await userEvent.click(await screen.findByRole('button', { name: 'Collect fees: Zain Malik' }))
    const dialog = await screen.findByRole('dialog', { name: /collect fees/i })
    await userEvent.clear(within(dialog).getByLabelText(/amount received/i))
    await userEvent.type(within(dialog).getByLabelText(/amount received/i), '2500')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Received' }))
    await waitFor(() => expect(collectedFees).toEqual([{ p_member_id: 'member-9', p_amount: 2500, p_payment_method: 'CASH' }]))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('records an online payment when the payment type is switched to online', async () => {
    collectedFees.length = 0
    renderWithProviders(<DirectoryView />)
    await userEvent.click(await screen.findByRole('button', { name: 'Collect fees: Zain Malik' }))
    const dialog = await screen.findByRole('dialog', { name: /collect fees/i })
    await userEvent.clear(within(dialog).getByLabelText(/amount received/i))
    await userEvent.type(within(dialog).getByLabelText(/amount received/i), '3000')
    await userEvent.selectOptions(within(dialog).getByLabelText(/payment type/i), 'ONLINE')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Received' }))
    await waitFor(() => expect(collectedFees).toEqual([{ p_member_id: 'member-9', p_amount: 3000, p_payment_method: 'ONLINE' }]))
  })

  it('does not send a fee without an amount', async () => {
    collectedFees.length = 0
    renderWithProviders(<DirectoryView />)
    await userEvent.click(await screen.findByRole('button', { name: 'Collect fees: Ali Raza' }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Received' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/enter the amount/i)
    expect(collectedFees).toEqual([])
  })

  it('searches every member server-side', async () => {
    renderWithProviders(<DirectoryView />)
    await screen.findByText('Ali Raza')
    await userEvent.type(screen.getByRole('searchbox', { name: /search by member/i }), 'zain')
    await waitFor(() => expect(screen.queryByText('Ali Raza')).not.toBeInTheDocument(), { timeout: 2000 })
    expect(screen.getByText('Zain Malik')).toBeInTheDocument()
  })
})
