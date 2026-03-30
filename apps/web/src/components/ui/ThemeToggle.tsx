'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@validiant/ui';

/**
 * Premium Theme Toggle Component
 * 
 * Manages 'data-theme' on document element and persists via 'userPrefs' cookie.
 * Supports Light and Dark modes with smooth transitions.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize from the current DOM state (to respect SSR/Layout Script)
  useEffect(() => {
    setMounted(true);
    const savedTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // 1. Update DOM
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // 2. Update Cookie (Matching the logic in layout.tsx)
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('userPrefs='));
      
      let prefs = {};
      if (cookieValue) {
        prefs = JSON.parse(decodeURIComponent(cookieValue.split('=')[1]));
      }
      
      const newPrefs = { ...prefs, theme: newTheme };
      document.cookie = `userPrefs=${encodeURIComponent(JSON.stringify(newPrefs))}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      console.error('[ThemeToggle] Failed to update cookie', e);
    }
  };

  if (!mounted) return <div className={cn("h-8 w-8 rounded-md bg-[var(--color-surface-soft)]", className)} />;

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "group relative flex h-8 w-14 items-center rounded-full bg-[var(--color-surface-soft)] p-1 transition-all duration-300 hover:bg-[var(--color-surface-subtle)]",
        className
      )}
      aria-label="Toggle Theme"
    >
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface-base)] shadow-md transition-all duration-500 ease-spring",
          theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
        )}
      >
        {theme === 'dark' ? (
          <Moon className="h-3.5 w-3.5 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-orange-400 transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>
      
      {/* Decorative dots for 'Premium' feel */}
      <span className={cn(
        "absolute right-2.5 h-1 w-1 rounded-full bg-[var(--color-text-muted)] opacity-20 transition-opacity",
        theme === 'dark' ? 'opacity-100' : 'opacity-20'
      )} />
      <span className={cn(
        "absolute left-2.5 h-1 w-1 rounded-full bg-[var(--color-text-muted)] opacity-20 transition-opacity",
        theme === 'light' ? 'opacity-100' : 'opacity-20'
      )} />
    </button>
  );
}
