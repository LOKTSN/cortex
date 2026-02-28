import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-bg-muted text-text-muted",
        breaking: "bg-red-50 text-cat-breaking",
        paper: "bg-gray-50 text-cat-paper",
        trending: "bg-amber-50 text-cat-trending",
        repo: "bg-purple-50 text-purple-600",
        podcast: "bg-blue-50 text-blue-600",
        new: "bg-blue-50 text-blue-600",
        read: "bg-green-50 text-green-600",
        archived: "bg-bg-muted text-text-subtle",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
