import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { FormInput } from './FormInput'

const schema = z.object({ email: z.email('Enter a valid email') })

function Harness() {
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } })
  return (
    <form onSubmit={handleSubmit(() => undefined)}>
      <FormInput control={control} name="email" label="Email" />
      <button type="submit">Send</button>
    </form>
  )
}

describe('FormInput', () => {
  it('is reachable by its label', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('announces the error and links it with aria-describedby', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByLabelText('Email'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Enter a valid email')
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter a valid email')
  })
})
