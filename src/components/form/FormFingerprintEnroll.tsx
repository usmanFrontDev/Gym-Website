import { useEffect, useState } from 'react'
import { useController, type Control, type FieldValues, type Path, type PathValue } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { enrollStrings } from '@/constants/strings'
import { FINISHED, useCancelEnrollment, useEnrollment, useStartEnrollment } from '@/hooks/common/useEnrollment'
import { FormField, inputStyles } from './FormField'

interface FormFingerprintEnrollProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
}

/** Fingerprint ID field filled by scanning on the K50 (via the reception bridge), never typed. */
export function FormFingerprintEnroll<T extends FieldValues>({ control, name, label }: FormFingerprintEnrollProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const { onChange } = field
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
  const start = useStartEnrollment()
  const cancel = useCancelEnrollment()
  const enrollment = useEnrollment(enrollmentId)
  const scan = enrollment.data
  const scanning = start.isPending || (enrollmentId !== null && !(scan && FINISHED.includes(scan.status)))
  const id = `field-${name}`

  useEffect(() => {
    if (scan?.status === 'SUCCESS' && scan.fingerprint_id) onChange(scan.fingerprint_id as PathValue<T, Path<T>>)
  }, [scan?.status, scan?.fingerprint_id, onChange])

  const handleStartScan = () => {
    onChange('' as PathValue<T, Path<T>>)
    start.mutate(undefined, { onSuccess: (row) => setEnrollmentId(row.id) })
  }

  const handleCancelScan = () => {
    if (enrollmentId) cancel.mutate(enrollmentId, { onSuccess: () => void enrollment.refetch() })
  }

  let message: string | null = null
  if (start.isPending) message = enrollStrings.PENDING
  else if (scan?.status === 'SUCCESS' && scan.fingerprint_id) message = enrollStrings.saved(scan.fingerprint_id)
  else if (scan?.status === 'FAILED') message = scan.error ?? enrollStrings.failed
  else if (scan) message = enrollStrings[scan.status as 'PENDING' | 'ENROLLING' | 'CANCELLED']
  else if (enrollmentId) message = enrollStrings.PENDING

  return (
    <FormField id={id} label={label} error={fieldState.error?.message}>
      <div className="flex gap-2">
        <input
          {...field}
          id={id}
          value={field.value ?? ''}
          readOnly
          placeholder={enrollStrings.placeholder}
          aria-invalid={!!fieldState.error}
          aria-describedby={fieldState.error ? `${id}-error` : undefined}
          className={inputStyles}
        />
        {scanning ? (
          <Button variant="secondary" onClick={handleCancelScan} disabled={!enrollmentId} loading={cancel.isPending}>
            {enrollStrings.cancel}
          </Button>
        ) : (
          <Button variant="outline" onClick={handleStartScan}>
            {field.value ? enrollStrings.rescan : enrollStrings.scan}
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      )}
    </FormField>
  )
}
