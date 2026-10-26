import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-surface-raised text-foreground hover:bg-border',
        outline: 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground',
        danger: 'bg-danger text-foreground hover:opacity-90',
        ghost: 'text-foreground hover:bg-surface-raised',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 rounded-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>, VariantProps<typeof buttonStyles> {
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
}

export function Button({ variant, size, type = 'button', loading, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...rest}
    >
      {children}
    </button>
  )
}
