import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'

const badgeStyles = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', {
  variants: {
    tone: {
      neutral: 'bg-surface-raised text-foreground',
      primary: 'bg-primary text-primary-foreground',
      success: 'bg-success/15 text-success',
      danger: 'bg-danger/15 text-danger',
      warning: 'bg-warning/15 text-warning',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

interface BadgeProps extends VariantProps<typeof badgeStyles> {
  children: ReactNode
}

export function Badge({ tone, children }: BadgeProps) {
  return <span className={badgeStyles({ tone })}>{children}</span>
}
