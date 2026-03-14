import { cn } from '../../lib/utils';

/**
 * Obsidian Command Skeleton Component
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--color-surface-soft)]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
