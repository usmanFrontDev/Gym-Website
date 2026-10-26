import { useState } from 'react'
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { FormField, inputStyles } from './FormField'

interface FormPasswordInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
}

export function FormPasswordInput<T extends FieldValues>({ control, name, label }: FormPasswordInputProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const [visible, setVisible] = useState(false)
  const id = `field-${name}`
  return (
    <FormField id={id} label={label} error={fieldState.error?.message}>
      <div className="relative">
        <input
          {...field}
          id={id}
          type={visible ? 'text' : 'password'}
          value={field.value ?? ''}
          autoComplete="current-password"
          aria-invalid={!!fieldState.error}
          aria-describedby={fieldState.error ? `${id}-error` : undefined}
          className={`${inputStyles} pr-16`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </FormField>
  )
}
