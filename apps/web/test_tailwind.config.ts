import type { Config } from 'tailwindcss';

const config: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        primary: 'color-mix(in srgb, var(--color-accent-base) calc(<alpha-value> * 100%), transparent)'
      }
    }
  }
};
export default config;
