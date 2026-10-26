import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'

interface FormCheckboxProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
}

export function FormCheckbox<T extends FieldValues>({ control, name, label }: FormCheckboxProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const id = `field-${name}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center gap-2 text-sm">
        <input
          id={id}
          type="checkbox"
          checked={!!field.value}
          onChange={(e) => field.onChange(e.target.checked)}
          onBlur={field.onBlur}
          aria-describedby={fieldState.error ? `${id}-error` : undefined}
          className="h-4 w-4 accent-primary"
        />
        {label}
      </label>
      {fieldState.error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {fieldState.error.message}
        </p>
      )}
    </div>
  )
}
