import * as React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, onValueChange, onChange, ...props }, ref) => {
    return (
      <div className="relative group">
        <select
          className="flex h-12 w-full appearance-none rounded-[1.5rem] bg-surface-lowest/50 border border-white/[0.03] px-6 py-2 text-sm text-[var(--color-text-base)] placeholder:text-[var(--color-text-base)]/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-obsidian inset-shadow-sm cursor-pointer pr-12"
          onChange={(e) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-950 text-[var(--color-text-base)]"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-base)]/20 group-hover:text-primary transition-colors pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
