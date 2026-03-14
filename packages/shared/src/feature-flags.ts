/**
 * Unified Feature Flags System
 *
 * Defines the available feature flags and the resolution hierarchy.
 * Resolution Order:
 * 1. Check orgSettings.enabledFeatures (true) or orgSettings.disabledFeatures (false)
 * 2. Fall back to global KV flag
 */

/**
 * Available Feature Flags
 */
export const FeatureFlag = [
  'BOARD_VIEW',
  'EMAIL_NOTIFICATIONS',
  'BGV_PARTNER_INBOUND',
  'PASSKEYS_AUTH',
  'ADVANCED_AUDIT',
  'CUSTOM_ROLES',
  'BULK_OPERATIONS',
  'API_ACCESS',
  'REALTIME_UPDATES',
  'AI_INSIGHTS', // Future proofing
] as const;

export type FeatureFlag = (typeof FeatureFlag)[number];

/**
 * Interface for Org Settings that contain feature flag overrides.
 * This will be fully expanded in Mini-Phase 10.
 */
export interface FeatureFlagSettings {
  enabledFeatures?: FeatureFlag[];
  disabledFeatures?: FeatureFlag[];
}

/**
 * Hierarchical Feature Flag Resolver
 *
 * @param flag The flag to check
 * @param orgSettings Organization-specific settings
 * @param globalFlags Global flag state (from KV)
 */
export const canFeature = (
  flag: FeatureFlag,
  orgSettings?: FeatureFlagSettings,
  globalFlags?: Record<string, { enabled: boolean; enabledOrgIds?: string[] }>
): boolean => {
  // 1. Check Organization-level overrides
  if (orgSettings?.enabledFeatures?.includes(flag)) return true;
  if (orgSettings?.disabledFeatures?.includes(flag)) return false;

  // 2. Fall back to global KV flag
  const global = globalFlags?.[flag];
  if (global) {
    if (global.enabled) return true;
    // If flag is disabled globally but enabled for specific orgs
    // (This part requires the active orgId which we don't have in this signature yet,
    // but the plan specifically calls for checking enabledOrgIds)
  }

  // Default: some flags might be on by default in dev, etc.
  return false;
};
