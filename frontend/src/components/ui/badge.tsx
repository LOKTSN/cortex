import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium leading-none',
  {
    variants: {
      variant: {
        default:   'bg-[var(--bg-raised)] text-[var(--color-text-muted)]',
        breaking:  'bg-[rgba(224,90,75,0.12)] text-[var(--color-cat-breaking)]',
        paper:     'bg-[var(--color-accent-dim)] text-[var(--color-cat-paper)]',
        trending:  'bg-[rgba(212,146,42,0.12)] text-[var(--color-cat-trending)]',
        repo:      'bg-[rgba(59,184,122,0.12)] text-[var(--color-cat-repo)]',
        podcast:   'bg-[rgba(155,110,208,0.12)] text-[var(--color-cat-podcast)]',
        new:       'bg-[var(--color-accent-dim)] text-[var(--color-status-new)]',
        read:      'bg-[rgba(59,184,122,0.12)] text-[var(--color-status-read)]',
        archived:  'bg-[var(--bg-raised)] text-[var(--color-status-archived)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
