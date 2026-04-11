'use client';

import { useEffect } from 'react';

// A robust dynamic theme applier that converts runtime configuration
// into absolute CSS roots to bypass Tailwind static overrides.
export function DynamicThemeInjector({
  orgs,
  urlOrgSlug,
}: {
  orgs: any[];
  urlOrgSlug?: string;
}) {
  useEffect(() => {
    if (!orgs || orgs.length === 0) return;

    let targetOrg = null;
    if (urlOrgSlug) {
      targetOrg = orgs.find((o) => o.slug === urlOrgSlug);
    }
    if (!targetOrg) {
      targetOrg = orgs[0];
    }

    if (!targetOrg) return;

    const brandConfig =
      targetOrg.settings?.brandConfig || targetOrg.brandConfig;
    if (!brandConfig) return;

    const TOKEN_MAP: Record<string, string[]> = {
      accentPrimary: ['--color-accent-base', '--primary'],
      surfaceBase: ['--color-surface-base', '--surface-lowest'],
      surfaceSubtle: ['--color-surface-subtle', '--surface-container-low'],
      surfaceMuted: ['--color-surface-muted', '--surface-container'],
      textBase: ['--color-text-base', '--text-base'],
      textMuted: ['--color-text-muted', '--text-muted'],
      borderBase: ['--color-border-base'],
      criticalBase: ['--color-critical-base', '--error'],
    };

    const root = document.documentElement;

    Object.entries(TOKEN_MAP).forEach(([configKey, cssVars]) => {
      const value = brandConfig[configKey];
      if (value) {
        cssVars.forEach((cssVar) => {
          root.style.setProperty(cssVar, value);
        });
      }
    });
  }, [orgs, urlOrgSlug]);

  return null;
}
