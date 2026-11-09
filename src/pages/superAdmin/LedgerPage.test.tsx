import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ledgerRequests } from '@/mocks/handlers'
import { renderWithProviders } from '@/test/renderWithProviders'
import { formatPkr } from '@/utils/format'
import LedgerPage from './LedgerPage'

describe('LedgerPage', () => {
  it('shows total income, total expense and net profit with the cash and online split', async () => {
    renderWithProviders(<LedgerPage />)
    const income = await screen.findByRole('button', { name: /total income/i })
    expect(income).toHaveTextContent(formatPkr(6000))
    expect(income).toHaveTextContent(`Cash ${formatPkr(2500)}`)
    expect(income).toHaveTextContent(`Online ${formatPkr(3500)}`)
    expect(screen.getByRole('button', { name: /total expense/i })).toHaveTextContent(formatPkr(40000))
    expect(screen.getByRole('button', { name: /net profit/i })).toHaveTextContent(formatPkr(-34000))
  })

  it('lists income and expense together and filters when a card is pressed', async () => {
    renderWithProviders(<LedgerPage />)
    const table = await screen.findByRole('table', { name: /transactions/i })
    expect(await within(table).findByText('Ali Raza')).toBeInTheDocument()
    expect(within(table).getByText('Shop rent')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /total expense/i }))
    expect(within(table).queryByText('Ali Raza')).not.toBeInTheDocument()
    expect(within(table).getByText('Shop rent')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /total income/i }))
    expect(within(table).getByText('Ali Raza')).toBeInTheDocument()
    expect(within(table).queryByText('Shop rent')).not.toBeInTheDocument()
  })

  it('asks for the whole history on the All time tab and one day on the Daily tab', async () => {
    ledgerRequests.length = 0
    renderWithProviders(<LedgerPage />)
    await screen.findByRole('button', { name: /total income/i })
    await userEvent.click(screen.getByRole('tab', { name: 'All time' }))
    await waitFor(() => expect(ledgerRequests.at(-1)).toEqual({ p_from: null, p_to: null }))
    await userEvent.click(screen.getByRole('tab', { name: 'Daily' }))
    await waitFor(() => {
      const last = ledgerRequests.at(-1)
      expect(last?.p_from).toBeTruthy()
      expect(last?.p_from).toBe(last?.p_to)
    })
  })
})
