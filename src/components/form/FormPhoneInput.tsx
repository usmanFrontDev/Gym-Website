import type { Control, FieldValues, Path } from 'react-hook-form'
import { FormInput } from './FormInput'

interface FormPhoneInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
}

export function FormPhoneInput<T extends FieldValues>(props: FormPhoneInputProps<T>) {
  return <FormInput {...props} type="tel" placeholder="03XX-XXXXXXX" />
}
