import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
}

export function KpiCard({ label, value, hint, icon: Icon }: KpiCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon aria-hidden="true" size={18} />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-4xl font-bold leading-none tracking-wide text-foreground">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  )
}
