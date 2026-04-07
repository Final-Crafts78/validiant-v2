import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  disabled?: boolean;
  className?: string;
}

const Rating: React.FC<RatingProps> = ({
  value = 0,
  onChange,
  max = 5,
  disabled = false,
  className,
}) => {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const ratingValue = i + 1;
        const isActive =
          (hoverValue !== null ? hoverValue : value) >= ratingValue;

        return (
          <button
            key={i}
            type="button"
            className={cn(
              'p-1 focus:outline-none transition-all duration-300',
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:scale-125'
            )}
            onMouseEnter={() => !disabled && setHoverValue(ratingValue)}
            onMouseLeave={() => !disabled && setHoverValue(null)}
            onClick={() => !disabled && onChange?.(ratingValue)}
          >
            <Star
              className={cn(
                'w-5 h-5 transition-all duration-300',
                isActive
                  ? 'fill-primary text-primary drop-shadow-[0_0_8px_rgba(100,255,218,0.5)]'
                  : 'fill-transparent text-white/20'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
Rating.displayName = 'Rating';

export { Rating };
