'use client';

import React from 'react';
import { TypeColumn, ColumnType } from '@validiant/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Rating } from '@/components/ui/rating';
import { PhotoCapture } from '@/components/ui/photo-capture';
import { GPSLocation } from '@/components/ui/gps-location';
import { Signature } from '@/components/ui/signature';

interface RecordFieldFactoryProps {
  column: TypeColumn;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

/**
 * RecordFieldFactory - Phase 8 Precision Architect
 * Dynamic field renderer for the Validiant Data Universe.
 * Maps schema-defined columns to high-fidelity UI components.
 */
export const RecordFieldFactory: React.FC<RecordFieldFactoryProps> = ({
  column,
  value,
  onChange,
  disabled = false,
}) => {
  const commonProps = {
    id: `field-${column.key}`,
    placeholder: column.settings?.placeholder || `Enter ${column.name}...`,
    disabled: disabled || column.settings?.disabled,
    required: column.settings?.required,
  };

  switch (column.columnType) {
    case ColumnType.TEXT: {
      return (
        <Input
          {...commonProps}
          value={value || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      );
    }

    case ColumnType.LONG_TEXT: {
      return (
        <Textarea
          {...commonProps}
          value={value || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          rows={4}
        />
      );
    }

    case ColumnType.NUMBER: {
      return (
        <Input
          {...commonProps}
          type="number"
          value={value ?? ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value))}
        />
      );
    }

    case ColumnType.SELECT: {
      const options = (column.settings?.options as string[]) || [];
      return (
        <Select
          {...commonProps}
          value={value || ''}
          onValueChange={onChange}
          options={options.map((opt) => ({ label: opt, value: opt }))}
        />
      );
    }

    case ColumnType.MULTI_SELECT: {
      const options = (column.settings?.options as string[]) || [];
      return (
        <MultiSelect
          {...commonProps}
          value={value || []}
          onChange={onChange}
          options={options.map((opt) => ({ label: opt, value: opt }))}
        />
      );
    }

    case ColumnType.PHOTO_CAPTURE: {
      return (
        <PhotoCapture
          {...commonProps}
          value={value}
          onChange={onChange}
          aspectRatio="16/9"
        />
      );
    }

    case ColumnType.GPS_LOCATION: {
      return (
        <GPSLocation
          {...commonProps}
          value={value}
          onChange={onChange}
          enableHighAccuracy
        />
      );
    }

    case ColumnType.SIGNATURE: {
      return (
        <Signature
          {...commonProps}
          value={value}
          onChange={onChange}
        />
      );
    }

    case ColumnType.RATING: {
      return (
        <Rating
          {...commonProps}
          value={value || 0}
          onChange={onChange}
          max={column.settings?.maxRating || 5}
        />
      );
    }

    default: {
      return (
        <div className="p-4 rounded-lg bg-surface-container-low border border-white/5 text-[10px] text-white/20 font-mono italic">
          // Unsupported column type: {column.columnType}
        </div>
      );
    }
  }
};
