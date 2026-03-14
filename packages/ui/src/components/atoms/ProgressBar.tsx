import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * Obsidian Command ProgressBar Component
 */
interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, variant = 'primary', ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    const variantColors = {
      primary: 'bg-[var(--color-accent-base)]',
      success: 'bg-[var(--color-positive-base)]',
      warning: 'bg-[var(--color-warning-base)]',
      danger: 'bg-[var(--color-critical-base)]',
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-soft)]',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 transition-all duration-500 ease-in-out',
            variantColors[variant]
          )}
          style={{ transform: `translateX(-${100 - clampedValue}%)` }}
        />
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
