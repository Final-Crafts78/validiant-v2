'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { ProjectTypeColumn } from '@validiant/shared';

interface RatingFieldProps {
  column: ProjectTypeColumn;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * RATING Field - Phase 2 architect
 * High-fidelity star rating with micro-animations.
 */
export const RatingField: React.FC<RatingFieldProps> = ({
  column,
  value,
  onChange,
  disabled,
}) => {
  const [hover, setHover] = useState(0);
  const maxValue = column.options?.maxValue || 5;

  return (
    <div className="flex flex-col items-center gap-2 p-6 bg-white/[0.02] border border-white/5 rounded-2xl transition-all hover:bg-white/[0.04]">
      <div className="flex items-center gap-1.5">
        {[...Array(maxValue)].map((_, i) => {
          const ratingValue = i + 1;
          const isActive = ratingValue <= (hover || value);
          const isSelected = ratingValue <= value;

          return (
            <button
              key={ratingValue}
              type="button"
              disabled={disabled}
              className={`relative transition-all duration-300 transform active:scale-95 group
                ${isActive ? 'scale-110' : 'scale-100'}
                ${
                  disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer hover:scale-125'
                }
              `}
              onClick={() => onChange(ratingValue)}
              onMouseEnter={() => !disabled && setHover(ratingValue)}
              onMouseLeave={() => !disabled && setHover(0)}
            >
              <Star
                className={`w-8 h-8 transition-colors duration-300
                  ${
                    isActive
                      ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                      : 'text-white/10'
                  }
                  ${isSelected && !hover ? 'text-yellow-500 fill-yellow-500' : ''}
                `}
              />
              {/* Subtle aura for the active star */}
              {isActive && (
                <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full scale-150 animate-pulse -z-10" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-[10px] font-mono tracking-widest uppercase text-white/30 flex items-center gap-2">
        <div
          className={`h-1 w-8 rounded-full ${
            value ? 'bg-yellow-500/50' : 'bg-white/10'
          }`}
        />
        <span>{value ? `${value} / ${maxValue}` : 'Awaiting Rating'}</span>
        <div
          className={`h-1 w-8 rounded-full ${
            value ? 'bg-yellow-500/50' : 'bg-white/10'
          }`}
        />
      </div>
    </div>
  );
};
