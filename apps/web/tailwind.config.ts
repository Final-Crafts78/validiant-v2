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
        background: 'rgb(var(--color-surface-base) / <alpha-value>)',
        foreground: 'var(--color-text-base)',
        primary: {
          DEFAULT: 'rgb(var(--color-accent-base) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-text) / <alpha-value>)',
          container: 'rgb(var(--color-accent-strong) / <alpha-value>)',
          glow: '#adc6ff',
        },
        secondary: {
          DEFAULT: 'var(--color-surface-muted)',
          foreground: 'var(--color-text-base)',
          container: 'var(--color-secondary-container)',
          'on-container': 'var(--color-on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--color-tertiary-base) / <alpha-value>)',
          foreground: '#0c1324',
        },
        surface: {
          base: 'var(--color-surface-base)',
          soft: 'var(--color-surface-soft)',
          muted: 'var(--color-surface-muted)',
          lowest: 'var(--color-surface-lowest)',
          'container-lowest': 'var(--color-surface-container-lowest)',
          'container-low': 'var(--color-surface-container-low)',
          container: 'var(--color-surface-container)',
          'container-highest': 'var(--color-surface-container-highest)',
          bright: 'var(--color-surface-bright)',
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
          base: 'var(--color-critical-base)',
          subtle: 'var(--color-critical-subtle)',
          strong: 'var(--color-critical-strong)',
          text: 'var(--color-critical-text)',
        },
        error: {
          container: 'var(--color-error-container)',
          'on-container': 'var(--color-on-error-container)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'glow-gradient': 'linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%)',
        'obsidian-glass': 'linear-gradient(180deg, rgba(46, 52, 71, 0.6) 0%, rgba(21, 27, 45, 0.6) 100%)',
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
        premium: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
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
