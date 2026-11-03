import type { ReactNode } from 'react'

interface SettingsSectionProps {
  id: string
  title: string
  description: string
  children: ReactNode
}

export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className="grid gap-6 rounded-card border border-border bg-surface p-6 shadow-card lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div>
        <h2 id={`${id}-heading`} className="font-display text-2xl font-bold uppercase tracking-wide">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
