/**
 * BGV Status Engine
 *
 * Immutable state machine keys and role-gated transition logic.
 */

export const BGV_STATUSES = [
  'UNASSIGNED',
  'ASSIGNED',
  'IN_PROGRESS',
  'PENDING_REVIEW',
  'VERIFIED',
  'REJECTED',
  'ON_HOLD',
  'CANCELLED',
] as const;

export type BgvStatus = (typeof BGV_STATUSES)[number];

export interface StatusTransition {
  key: string;
  label: string;
  color: string;
  icon: string;
  requiresNote: boolean;
}

// System defaults for base statuses
export const SYSTEM_STATUS_METADATA: Record<
  BgvStatus,
  Omit<StatusTransition, 'key'>
> = {
  UNASSIGNED: {
    label: 'Unassigned',
    color: 'gray',
    icon: 'circle-dashed',
    requiresNote: false,
  },
  ASSIGNED: {
    label: 'Assigned',
    color: 'blue',
    icon: 'user',
    requiresNote: false,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'indigo',
    icon: 'play',
    requiresNote: false,
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    color: 'amber',
    icon: 'clock',
    requiresNote: false,
  },
  VERIFIED: {
    label: 'Verified',
    color: 'green',
    icon: 'check-circle',
    requiresNote: false,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'red',
    icon: 'x-circle',
    requiresNote: true,
  },
  ON_HOLD: {
    label: 'On Hold',
    color: 'orange',
    icon: 'pause-circle',
    requiresNote: true,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'gray',
    icon: 'slash',
    requiresNote: true,
  },
};

// Base transition matrix mapping from -> array of allowed to targets
// Does not include role checks yet, just systemic valid flows.
const BASE_TRANSITIONS: Record<BgvStatus, BgvStatus[]> = {
  UNASSIGNED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'UNASSIGNED', 'CANCELLED'],
  IN_PROGRESS: ['PENDING_REVIEW', 'ON_HOLD', 'CANCELLED'],
  PENDING_REVIEW: ['VERIFIED', 'REJECTED', 'IN_PROGRESS'],
  VERIFIED: [],
  REJECTED: ['IN_PROGRESS', 'ASSIGNED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  CANCELLED: ['UNASSIGNED'],
};

// Role restrictions for specific targets
// If a target status is not listed here, it is generally allowed for roles that can edit.
const ROLE_RESTRICTIONS: Partial<Record<BgvStatus, string[]>> = {
  VERIFIED: ['owner', 'admin', 'manager', 'executive'],
  REJECTED: ['owner', 'admin', 'manager', 'executive'],
  ASSIGNED: ['owner', 'admin', 'manager', 'executive', 'member'],
};

// Shape of organization settings used by the engine
export interface EngineOrgSettings {
  customStatuses?: Array<{
    key: string;
    label: string;
    insertAfter: string;
    color: string;
    icon: string;
    requiresNote: boolean;
  }>;
}

/**
 * Computes all available transition targets for a given status, organization settings,
 * and user role, injecting custom intermediate statuses correctly.
 */
export function getValidTransitions(
  currentStatusKey: string,
  orgSettings: EngineOrgSettings,
  userRoleKey: string
): StatusTransition[] {
  // 1. Identify valid base targets
  const baseTargets = BASE_TRANSITIONS[currentStatusKey as BgvStatus] || [];

  // 2. Filter base targets by role permissions
  const allowedBaseTargets = baseTargets.filter((targetKey) => {
    const allowedRoles = ROLE_RESTRICTIONS[targetKey];
    if (!allowedRoles) {
      return true; // not restricted
    }
    return allowedRoles.includes(userRoleKey);
  });

  const transitions: StatusTransition[] = allowedBaseTargets.map((key) => ({
    key,
    ...SYSTEM_STATUS_METADATA[key],
  }));

  // 3. Inject custom statuses defined in orgSettings
  // Custom statuses insert *after* a specific system status in the workflow.
  // For simplicity, if current status is the "insertAfter" target, we add the custom status as an option.
  // We also need to see if the custom status itself can transition somewhere.
  if (orgSettings.customStatuses && orgSettings.customStatuses.length > 0) {
    orgSettings.customStatuses.forEach((cs) => {
      // If the current status is what the custom status inserts after, allow transitioning into it
      if (currentStatusKey === cs.insertAfter) {
        transitions.push({
          key: cs.key,
          label: cs.label,
          color: cs.color,
          icon: cs.icon,
          requiresNote: cs.requiresNote,
        });
      }

      // If we are IN the custom status, what can we transition to?
      // Generally, we transition to the next logical step from its `insertAfter` anchor's original targets
      if (currentStatusKey === cs.key) {
        // Find what the anchor could transition to
        const anchorTargets =
          BASE_TRANSITIONS[cs.insertAfter as BgvStatus] || [];
        anchorTargets.forEach((targetKey) => {
          const allowedRoles = ROLE_RESTRICTIONS[targetKey];
          if (!allowedRoles || allowedRoles.includes(userRoleKey)) {
            // Only add if not already in list
            if (!transitions.some((t) => t.key === targetKey)) {
              transitions.push({
                key: targetKey,
                ...SYSTEM_STATUS_METADATA[targetKey],
              });
            }
          }
        });
      }
    });
  }

  return transitions;
}
