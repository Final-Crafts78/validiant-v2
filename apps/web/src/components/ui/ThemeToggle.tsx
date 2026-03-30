'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@validiant/ui';
import { useTheme } from '../providers/ThemeProvider';

/**
 * Premium Theme Toggle Component
 *
 * Manages theme state via unified ThemeProvider.
 * Supports Light and Dark modes with smooth transitions.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-8 w-14 rounded-full bg-[var(--color-surface-soft)] opacity-50',
          className
        )}
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'group relative flex h-8 w-14 shrink-0 items-center rounded-full bg-[var(--color-surface-soft)] p-1 transition-all duration-300 hover:bg-[var(--color-surface-subtle)] border border-[var(--color-border-base)]',
        className
      )}
      aria-label="Toggle Theme"
    >
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface-base)] shadow-md transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          theme === 'dark' ? 'translate-x-[1.5rem]' : 'translate-x-0'
        )}
      >
        {theme === 'dark' ? (
          <Moon className="h-3.5 w-3.5 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-orange-400 transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>

      {/* Decorative elements for premium feel */}
      <span
        className={cn(
          'absolute right-2.5 h-1 w-1 rounded-full bg-[var(--color-text-muted)] transition-opacity duration-300',
          theme === 'dark' ? 'opacity-100' : 'opacity-0'
        )}
      />
      <span
        className={cn(
          'absolute left-2.5 h-1 w-1 rounded-full bg-[var(--color-text-muted)] transition-opacity duration-300',
          theme === 'light' ? 'opacity-100' : 'opacity-0'
        )}
      />
    </button>
  );
}
