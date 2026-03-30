import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        surface: {
          base: 'var(--color-surface-base)',
          soft: 'var(--color-surface-soft)',
          subtle: 'var(--color-surface-subtle)',
          muted: 'var(--color-surface-muted)',
          inverse: 'var(--color-surface-inverse)',
        },
        text: {
          base: 'var(--color-text-base)',
          subtle: 'var(--color-text-subtle)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          base: 'var(--color-border-base)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        },
        accent: {
          base: 'var(--color-accent-base)',
          subtle: 'var(--color-accent-subtle)',
          strong: 'var(--color-accent-strong)',
          text: 'var(--color-accent-text)',
        },
        success: {
          base: 'var(--color-positive-base)',
          subtle: 'var(--color-positive-subtle)',
          strong: 'var(--color-positive-strong)',
          text: 'var(--color-positive-text)',
        },
        warning: {
          base: 'var(--color-warning-base)',
          subtle: 'var(--color-warning-subtle)',
          strong: 'var(--color-warning-strong)',
          text: 'var(--color-warning-text)',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
          base: 'var(--color-critical-base)',
          subtle: 'var(--color-critical-subtle)',
          strong: 'var(--color-critical-strong)',
          text: 'var(--color-critical-text)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      transitionDuration: {
        fast: 'var(--motion-duration-fast)',
        base: 'var(--motion-duration-base)',
        slow: 'var(--motion-duration-slow)',
      },
      transitionTimingFunction: {
        base: 'var(--motion-easing-base)',
        in: 'var(--motion-easing-in)',
        out: 'var(--motion-easing-out)',
      },
      animation: {
        'fade-in':
          'fadeIn var(--motion-duration-base) var(--motion-easing-base)',
        'slide-up':
          'slideUp var(--motion-duration-base) var(--motion-easing-out)',
        'slide-down':
          'slideDown var(--motion-duration-base) var(--motion-easing-out)',
        grow: 'grow 2s linear forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        grow: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
