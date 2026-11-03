import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

const buttonStyles = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-card hover:bg-primary-hover',
        secondary: 'border border-border bg-surface-raised text-foreground hover:border-border-strong hover:bg-border',
        outline: 'border border-primary/70 text-primary hover:bg-primary hover:text-primary-foreground',
        danger: 'bg-danger-strong text-foreground hover:bg-danger-strong/85',
        ghost: 'text-foreground hover:bg-surface-raised',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11 rounded-full',
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
