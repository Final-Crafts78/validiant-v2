'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

/**
 * ThemeToggle - Phase 5 Brand Neutrality
 * Premium animated toggle for switching between Light, Dark, and System themes.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-[#151b2d]/50 p-1 rounded-xl border border-[var(--color-border-base)]/20 shadow-inner">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-all ${
          theme === 'light'
            ? 'bg-[#adc6ff] text-[#0c1324] shadow-[0_0_10px_rgba(173,198,255,0.4)]'
            : 'text-[#8c909f] hover:text-[#adc6ff] hover:bg-[var(--color-surface-muted)]/50'
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-all ${
          theme === 'dark'
            ? 'bg-[#adc6ff] text-[#0c1324] shadow-[0_0_10px_rgba(173,198,255,0.4)]'
            : 'text-[#8c909f] hover:text-[#adc6ff] hover:bg-[var(--color-surface-muted)]/50'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg transition-all ${
          theme === 'system'
            ? 'bg-[#adc6ff] text-[#0c1324] shadow-[0_0_10px_rgba(173,198,255,0.4)]'
            : 'text-[#8c909f] hover:text-[#adc6ff] hover:bg-[var(--color-surface-muted)]/50'
        }`}
        title="System Preference"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
