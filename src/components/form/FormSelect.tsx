import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { FormField, inputStyles } from './FormField'

export interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}

export function FormSelect<T extends FieldValues>({ control, name, label, options, placeholder, disabled }: FormSelectProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const id = `field-${name}`
  return (
    <FormField id={id} label={label} error={fieldState.error?.message}>
      <select
        {...field}
        id={id}
        value={field.value ?? ''}
        disabled={disabled}
        aria-invalid={!!fieldState.error}
        aria-describedby={fieldState.error ? `${id}-error` : undefined}
        className={inputStyles}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
