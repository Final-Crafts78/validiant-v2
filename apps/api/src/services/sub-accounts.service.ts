/**
 * Sub-Accounts Service
 *
 * Handles management of specialized organization roles:
 * - Field Agents: Limited access via specific portal
 * - Client Viewers: Token-gated read-only access
 * - Partners: Technical integration accounts
 *
 * This service manages both the `org_sub_accounts` metadata and the
 * linked `users` record in a transaction.
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { orgSubAccounts, users, organizationMembers } from '../db/schema';
import { logger } from '../utils/logger';
import { assertExists, ConflictError } from '../utils/errors';
import { OrgSubAccount } from '@validiant/shared';

/**
 * Invite/Create a new Sub-Account
 */
export const createSubAccount = async (
  orgId: string,
  data: {
    accountType: 'field_agent' | 'client_viewer' | 'partner';
    name: string;
    email?: string;
    phone?: string;
    industry?: string;
    projectAccess: { projectId: string; role: string }[];
    metadata?: Record<string, unknown>;
    createdById: string;
  }
) => {
  return await db.transaction(async (tx: any) => {
    let userId: string | null = null;

    // 1. If email is provided, create/link a User record
    if (data.email) {
      // Check if user already exists
      const [existingUser] = await tx
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser) {
        const uId: string = existingUser.id;
        userId = uId;

        // Ensure they aren't already a sub-account of this type in this org
        const [existingSub] = await tx
          .select()
          .from(orgSubAccounts)
          .where(
            and(
              eq(orgSubAccounts.orgId, orgId),
              eq(orgSubAccounts.userId, uId),
              eq(orgSubAccounts.accountType, data.accountType)
            )
          )
          .limit(1);

        if (existingSub) {
          throw new ConflictError(
            `User is already a ${data.accountType} in this organization`
          );
        }
      } else {
        // Create new user record
        const [newUser] = await tx
          .insert(users)
          .values({
            email: data.email,
            fullName: data.name,
            role: 'user', // Default platform role
            status: 'active',
          })
          .returning();
        userId = newUser.id;
      }

      // 2. Add as organization member if not already
      const [existingMember] = userId
        ? await tx
            .select()
            .from(organizationMembers)
            .where(
              and(
                eq(organizationMembers.organizationId, orgId),
                eq(organizationMembers.userId, userId)
              )
            )
            .limit(1)
        : [null];

      if (!existingMember && userId) {
        const uId: string = userId;
        await tx.insert(organizationMembers).values({
          organizationId: orgId,
          userId: uId,
          role: data.accountType, // Mapping sub-account type to org role
          joinedAt: new Date(),
        });
      }
    }

    // 3. Create the Sub-Account record
    // For client viewers, we generate a portal token
    let portalToken: string | undefined;
    if (data.accountType === 'client_viewer') {
      const rawToken = crypto.randomUUID(); // Edge-native UUID
      const encoder = new TextEncoder();
      const dataHash = await crypto.subtle.digest(
        'SHA-256',
        encoder.encode(rawToken)
      );
      portalToken = btoa(String.fromCharCode(...new Uint8Array(dataHash)));
    }

    const [subAccount] = await tx
      .insert(orgSubAccounts)
      .values({
        orgId,
        userId: userId || undefined,
        accountType: data.accountType,
        name: data.name,
        email: data.email,
        phone: data.phone,
        industry: data.industry,
        projectAccess: data.projectAccess,
        portalToken,
        metadata: data.metadata,
        createdBy: data.createdById,
      })
      .returning();

    logger.info('Sub-account created', {
      orgId,
      subAccountId: subAccount.id,
      accountType: data.accountType,
    });

    return subAccount;
  });
};

/**
 * Get all sub-accounts for an organization
 */
export const getSubAccounts = async (orgId: string, type?: string) => {
  const filters = [eq(orgSubAccounts.orgId, orgId)];
  if (type) {
    filters.push(eq(orgSubAccounts.accountType, type));
  }

  return await db
    .select()
    .from(orgSubAccounts)
    .where(and(...filters))
    .orderBy(orgSubAccounts.createdAt);
};

/**
 * Get a specific sub-account by ID
 */
export const getSubAccountById = async (id: string) => {
  const [subAccount] = await db
    .select()
    .from(orgSubAccounts)
    .where(eq(orgSubAccounts.id, id))
    .limit(1);
  assertExists(subAccount, 'Sub-Account');
  return subAccount;
};

/**
 * Update sub-account
 */
export const updateSubAccount = async (
  id: string,
  data: Partial<OrgSubAccount>
) => {
  const [updated] = await db
    .update(orgSubAccounts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(orgSubAccounts.id, id))
    .returning();

  assertExists(updated, 'Sub-Account');
  logger.info('Sub-account updated', { subAccountId: id });
  return updated;
};

/**
 * Revoke sub-account access
 */
export const deleteSubAccount = async (id: string) => {
  const [deleted] = await db
    .delete(orgSubAccounts)
    .where(eq(orgSubAccounts.id, id))
    .returning();

  assertExists(deleted, 'Sub-Account');
  logger.info('Sub-account deleted', { subAccountId: id });
  return deleted;
};
