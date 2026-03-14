/**
 * Organization Settings Hub
 *
 * Centralized schema for all organizational configurations.
 */

import { organizationSettingsSchema } from './schemas/organization.schemas';
import { z } from 'zod';

export const OrgSettingsSchema = organizationSettingsSchema;

export type OrgSettings = z.infer<typeof OrgSettingsSchema>;
