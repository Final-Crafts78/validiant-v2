import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Obsidian Command Badge Component
 * Used for status flags and counts.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider mono',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-accent-base)]/10 text-[var(--color-accent-base)] border border-[var(--color-accent-base)]/20',
        success:
          'bg-[var(--color-success-base)]/10 text-[var(--color-success-base)] border border-[var(--color-success-base)]/20',
        warning:
          'bg-[var(--color-warning-base)]/10 text-[var(--color-warning-base)] border border-[var(--color-warning-base)]/20',
        danger:
          'bg-[var(--color-danger-base)]/10 text-[var(--color-danger-base)] border border-[var(--color-danger-base)]/20',
        outline:
          'border border-[var(--color-border-base)] text-[var(--color-text-muted)]',
        ghost: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
