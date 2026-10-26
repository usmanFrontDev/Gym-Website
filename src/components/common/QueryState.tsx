import type { ReactNode } from 'react'
import { strings } from '@/constants/strings'
import { Button } from './Button'
import { Spinner } from './Spinner'

interface QueryStateProps {
  isLoading: boolean
  error: Error | null
  isEmpty?: boolean
  onRetry?: () => void
  children: ReactNode
}

/** Shared loading / error / empty handling for every data view. */
export function QueryState({ isLoading, error, isEmpty, onRetry, children }: QueryStateProps) {
  if (isLoading) return <Spinner />
  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 p-6 text-danger">
        <p>{error.message || strings.common.error}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            {strings.common.retry}
          </Button>
        )}
      </div>
    )
  }
  if (isEmpty) return <p className="p-6 text-muted">{strings.common.empty}</p>
  return <>{children}</>
}
