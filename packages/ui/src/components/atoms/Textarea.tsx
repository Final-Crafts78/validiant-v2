import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * Obsidian Command Textarea Component
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--color-text-base)]">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-base)] px-3 py-2 text-sm text-[var(--color-text-base)] ring-offset-white placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-base)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error &&
              'border-[var(--color-danger-base)] focus-visible:ring-[var(--color-danger-base)]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-[var(--color-danger-base)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
