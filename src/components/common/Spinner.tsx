import { strings } from '@/constants/strings'

export function Spinner() {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 p-6 text-muted">
      <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin" />
      {strings.common.loading}
    </div>
  )
}
