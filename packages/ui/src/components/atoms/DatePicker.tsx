import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

/**
 * Obsidian Command DatePicker Component
 * Integrated with the premium theme system.
 */
export interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  className,
}: DatePickerProps) {
  // We use a hidden input[type="date"] to trigger the native picker
  // while maintaining the premium look with a custom button.
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.showPicker();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate);
    }
  };

  const formattedDate = date ? date.toLocaleDateString() : '';

  return (
    <div className={cn('relative w-full', className)}>
      <input
        ref={inputRef}
        type="date"
        className="absolute inset-0 opacity-0 pointer-events-none"
        onChange={handleDateChange}
        value={date ? date.toISOString().split('T')[0] : ''}
      />
      <Button
        variant="outline"
        onClick={handleButtonClick}
        className={cn(
          'w-full justify-start text-left font-normal h-10',
          !date && 'text-[var(--color-text-muted)]'
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
        {formattedDate || <span>{placeholder}</span>}
      </Button>
    </div>
  );
}
