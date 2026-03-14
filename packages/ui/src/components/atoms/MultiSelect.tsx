import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from './Badge';
import { Button } from './Button';

/**
 * Obsidian Command MultiSelect Component
 */
export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      handleUnselect(value);
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between h-auto min-h-10 py-2',
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              selected.map((value) => {
                const option = options.find((o) => o.value === value);
                return (
                  <Badge
                    key={value}
                    variant="primary"
                    className="flex items-center gap-1 normal-case font-medium"
                  >
                    {option?.label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(value);
                      }}
                    />
                  </Badge>
                );
              })
            ) : (
              <span className="text-[var(--color-text-muted)] font-normal">
                {placeholder}
              </span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        className="w-[var(--radix-popover-trigger-width)] p-0 z-50 rounded-lg border border-[var(--color-border-base)] bg-[var(--color-surface-base)] shadow-md"
        align="start"
      >
        <div className="max-h-64 overflow-auto p-1">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-[var(--color-surface-soft)] transition-colors',
                selected.includes(option.value) &&
                  'bg-[var(--color-surface-soft)]'
              )}
              onClick={() => handleSelect(option.value)}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {selected.includes(option.value) && (
                  <Check className="h-4 w-4" />
                )}
              </span>
              {option.label}
            </div>
          ))}
          {options.length === 0 && (
            <div className="py-6 text-center text-sm text-[var(--color-text-muted)]">
              No options found.
            </div>
          )}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}
