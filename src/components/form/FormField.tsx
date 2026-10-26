import type { ReactNode } from 'react'

interface FormFieldProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

/** Label + control + announced error. The control must set aria-describedby to `${id}-error`. */
export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputStyles =
  'h-10 w-full rounded-lg border border-border bg-surface-raised px-3 text-foreground placeholder:text-muted disabled:opacity-60 aria-[invalid=true]:border-danger'
