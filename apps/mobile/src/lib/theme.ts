/**
 * Mobile Theme System
 *
 * Defines design tokens compatible with React Native StyleSheet.
 * Supports dynamic brand overrides.
 */

export const colors = {
  // Base palette
  primary: '#2563eb', // Default blue
  slate: {
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
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    500: '#f43f5e',
    600: '#e11d48',
  },
  amber: {
    50: '#fffbeb',
    400: '#fbbf24',
    500: '#f59e0b',
    900: '#78350f',
  },
  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
};

export type Theme = typeof theme;
