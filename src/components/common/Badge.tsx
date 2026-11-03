import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'

const badgeStyles = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-raised text-foreground ring-border-strong',
        primary: 'bg-primary text-primary-foreground ring-primary',
        success: 'bg-success/12 text-success ring-success/30',
        danger: 'bg-danger/12 text-danger ring-danger/30',
        warning: 'bg-warning/12 text-warning ring-warning/30',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

interface BadgeProps extends VariantProps<typeof badgeStyles> {
  children: ReactNode
}

export function Badge({ tone, children }: BadgeProps) {
  return <span className={badgeStyles({ tone })}>{children}</span>
}
