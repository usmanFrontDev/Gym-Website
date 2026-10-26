import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { FormField, inputStyles } from './FormField'

interface FormTextareaProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
}

export function FormTextarea<T extends FieldValues>({ control, name, label, placeholder }: FormTextareaProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const id = `field-${name}`
  return (
    <FormField id={id} label={label} error={fieldState.error?.message}>
      <textarea
        {...field}
        id={id}
        rows={3}
        value={field.value ?? ''}
        placeholder={placeholder}
        aria-invalid={!!fieldState.error}
        aria-describedby={fieldState.error ? `${id}-error` : undefined}
        className={`${inputStyles} h-auto py-2`}
      />
    </FormField>
  )
}
