import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './DataTable'

interface Row { id: string; name: string }
const columns: Column<Row>[] = [{ key: 'name', header: 'Name', render: (r) => r.name }]

const base = { columns, caption: 'People', page: 1, onPageChange: vi.fn(), getRowKey: (r: Row) => r.id, error: null, isLoading: false }

describe('DataTable', () => {
  it('shows a loading state', () => {
    render(<DataTable {...base} rows={[]} total={0} isLoading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
  })

  it('shows an empty state', () => {
    render(<DataTable {...base} rows={[]} total={0} />)
    expect(screen.getByText('Nothing to show yet.')).toBeInTheDocument()
  })

  it('shows an error with a retry button', async () => {
    const onRetry = vi.fn()
    render(<DataTable {...base} rows={[]} total={0} error={new Error('boom')} onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('boom')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders rows with 10 per page pagination controls', async () => {
    const onPageChange = vi.fn()
    render(<DataTable {...base} rows={[{ id: '1', name: 'Ali' }]} total={25} onPageChange={onPageChange} />)
    expect(screen.getByRole('table', { name: 'People' })).toBeInTheDocument()
    expect(screen.getByText('Ali')).toBeInTheDocument()
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })
})
