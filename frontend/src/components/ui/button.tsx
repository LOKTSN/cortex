import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded font-medium transition-all disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1 cursor-pointer shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-accent)] text-white hover:opacity-90 active:translate-y-px',
        ghost:
          'text-[var(--color-text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--color-text)]',
        outline:
          'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
        destructive:
          'border border-[var(--color-red)] text-[var(--color-red)] hover:bg-[rgba(224,90,75,0.1)]',
        accent:
          'bg-[var(--color-accent-dim)] border border-[var(--color-border-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white',
        ingrained:
          'bg-[var(--bg-ingrained)] text-[var(--color-text-muted)] hover:bg-[var(--bg-ingrained-hover)] hover:text-[var(--color-text)] active:bg-[var(--bg-ingrained-active)]',
      },
      size: {
        default: 'h-8 px-4 text-sm',
        sm: 'h-7 px-3 text-xs',
        lg: 'h-10 px-6 text-sm',
        icon: 'size-8',
        'icon-sm': 'size-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
