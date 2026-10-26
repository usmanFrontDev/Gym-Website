import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormInput } from './FormInput'

interface FormDatePickerProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
}

/** Native date input; values are 'YYYY-MM-DD' strings. */
export function FormDatePicker<T extends FieldValues>(props: FormDatePickerProps<T>) {
  return <FormInput {...props} type="date" />
}
