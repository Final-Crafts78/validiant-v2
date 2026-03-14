import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Obsidian Command Button Component
 * Strictly enforces WCAG contrast ratios and brand tokens.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-accent-base)] text-white hover:bg-[var(--color-accent-hover)] focus-visible:ring-[var(--color-accent-base)]',
        secondary:
          'bg-[var(--color-surface-soft)] text-[var(--color-text-base)] hover:bg-[var(--color-surface-muted)] focus-visible:ring-[var(--color-border-base)]',
        outline:
          'border border-[var(--color-border-base)] bg-transparent text-[var(--color-text-base)] hover:bg-[var(--color-surface-soft)] focus-visible:ring-[var(--color-border-base)]',
        ghost:
          'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-base)] focus-visible:ring-[var(--color-border-base)]',
        danger:
          'bg-[var(--color-danger-base)] text-white hover:bg-[var(--color-danger-hover)] focus-visible:ring-[var(--color-danger-base)]',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
      isLoading: {
        true: 'cursor-wait',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, isLoading, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" />}
        {!isLoading && leftIcon && (
          <span className="inline-flex">{leftIcon}</span>
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
