import type { Config } from 'tailwindcss';

function asColor(variable: string): any {
  return ({ opacityValue }: { opacityValue?: string | number }) => {
    if (opacityValue !== undefined) {
      return `color-mix(in srgb, var(${variable}) ${Number(opacityValue) * 100}%, transparent)`;
    }
    return `var(${variable})`;
  };
}

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
        background: asColor('--color-surface-base'),
        foreground: asColor('--color-text-base'),
        primary: {
          DEFAULT: asColor('--color-accent-base'),
          foreground: asColor('--color-accent-text'),
          container: asColor('--color-accent-strong'),
          glow: '#adc6ff',
        },
        secondary: {
          DEFAULT: asColor('--color-surface-muted'),
          foreground: asColor('--color-text-base'),
          container: asColor('--color-secondary-container'),
          'on-container': asColor('--color-on-secondary-container'),
        },
        tertiary: {
          DEFAULT: asColor('--color-tertiary-base'),
          foreground: '#0c1324',
        },
        surface: {
          base: asColor('--color-surface-base'),
          soft: asColor('--color-surface-soft'),
          muted: asColor('--color-surface-muted'),
          lowest: asColor('--color-surface-lowest'),
          'container-lowest': asColor('--color-surface-container-lowest'),
          'container-low': asColor('--color-surface-container-low'),
          container: asColor('--color-surface-container'),
          'container-highest': asColor('--color-surface-container-highest'),
          bright: asColor('--color-surface-bright'),
          inverse: asColor('--color-surface-inverse'),
        },
        text: {
          base: asColor('--color-text-base'),
          subtle: asColor('--color-text-subtle'),
          muted: asColor('--color-text-muted'),
          inverse: asColor('--color-text-inverse'),
        },
        border: {
          base: asColor('--color-border-base'),
          subtle: asColor('--color-border-subtle'),
          strong: asColor('--color-border-strong'),
        },
        success: {
          base: asColor('--color-positive-base'),
          subtle: asColor('--color-positive-subtle'),
          strong: asColor('--color-positive-strong'),
          text: asColor('--color-positive-text'),
        },
        warning: {
          base: asColor('--color-warning-base'),
          subtle: asColor('--color-warning-subtle'),
          strong: asColor('--color-warning-strong'),
          text: asColor('--color-warning-text'),
        },
        danger: {
          base: asColor('--color-critical-base'),
          subtle: asColor('--color-critical-subtle'),
          strong: asColor('--color-critical-strong'),
          text: asColor('--color-critical-text'),
        },
        error: {
          container: asColor('--color-error-container'),
          'on-container': asColor('--color-on-error-container'),
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'Manrope', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'glow-gradient': 'linear-gradient(135deg, #adc6ff 0%, #4d8eff 100%)',
        'obsidian-glass':
          'linear-gradient(180deg, rgba(46, 52, 71, 0.6) 0%, rgba(21, 27, 45, 0.6) 100%)',
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
