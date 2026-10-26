import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { FormField, inputStyles } from './FormField'

interface FormInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  type?: 'text' | 'email' | 'tel' | 'number' | 'date'
  placeholder?: string
  disabled?: boolean
  /** Parse the field as a number (empty string becomes undefined). */
  asNumber?: boolean
}

export function FormInput<T extends FieldValues>({
  control, name, label, type = 'text', placeholder, disabled, asNumber,
}: FormInputProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const id = `field-${name}`
  return (
    <FormField id={id} label={label} error={fieldState.error?.message}>
      <input
        {...field}
        id={id}
        type={asNumber ? 'number' : type}
        value={field.value ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          field.onChange(asNumber ? (raw === '' ? undefined : Number(raw)) : raw)
        }}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!fieldState.error}
        aria-describedby={fieldState.error ? `${id}-error` : undefined}
        className={inputStyles}
      />
    </FormField>
  )
}
