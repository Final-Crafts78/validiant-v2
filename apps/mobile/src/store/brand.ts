import { create } from 'zustand';
import { theme } from '../lib/theme';

interface BrandConfig {
  accentPrimary?: string;
  logoUrl?: string;
  displayName?: string;
}

interface BrandState {
  config: BrandConfig;
  setBrandConfig: (config: BrandConfig) => void;
  getAccentColor: () => string;
}

/**
 * Brand Store
 * Manages the organization's white-labeling theme overrides.
 */
export const useBrandStore = create<BrandState>((set, get) => ({
  config: {},

  setBrandConfig: (config) => {
    set({ config });
  },

  getAccentColor: () => {
    return get().config.accentPrimary || theme.colors.primary;
  },
}));
