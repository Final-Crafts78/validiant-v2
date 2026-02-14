/**
 * Drizzle ORM Schema for Validiant v2
 * Converted from Prisma schema with full type safety and edge compatibility
 * 
 * Models: User, Organization, OrganizationMember, Project, Task, PasswordResetToken, PasskeyCredential
 * Database: PostgreSQL (Neon Serverless)
 * 
 * Phase 6.1 Enhancement: OAuth 2.0 support (Google, GitHub)
 * Phase 6.2 Enhancement: WebAuthn Passkeys (FIDO2)
 */

import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  bigint,
  boolean,
  jsonb,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// ============================================================================
// USER TABLE (OAuth & Passkey Enhanced)
// ============================================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'), // Nullable for OAuth/Passkey users
    fullName: text('full_name').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatar: text('avatar'), // Profile picture URL
    
    // OAuth Provider IDs
    googleId: text('google_id'), // Google OAuth ID
    githubId: text('github_id'), // GitHub OAuth ID
    
    // Account Status
    role: text('role').notNull().default('user'), // 'user' | 'admin' | 'superadmin'
    status: text('status').notNull().default('active'), // 'active' | 'suspended' | 'deleted'
    emailVerified: boolean('email_verified').notNull().default(false),
    
    // Timestamps
    lastLoginAt: timestamp('last_login_at', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    googleIdIdx: index('users_google_id_idx').on(table.googleId),
    githubIdIdx: index('users_github_id_idx').on(table.githubId),
    statusIdx: index('users_status_idx').on(table.status),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  ownedOrganizations: many(organizations, { relationName: 'OrganizationOwner' }),
  organizationMemberships: many(organizationMembers),
  createdProjects: many(projects, { relationName: 'ProjectOwner' }),
  assignedTasks: many(tasks, { relationName: 'TaskAssignee' }),
  createdTasks: many(tasks, { relationName: 'TaskCreator' }),
  passwordResetTokens: many(passwordResetTokens),
  passkeyCredentials: many(passkeyCredentials),
}));

// ============================================================================
// PASSKEY CREDENTIAL TABLE (Phase 6.2 - WebAuthn/FIDO2)
// ============================================================================

export const passkeyCredentials = pgTable(
  'passkey_credentials',
  {
    // WebAuthn Credential ID (base64url encoded)
    credentialID: text('credential_id').primaryKey(),
    
    // User Reference
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    
    // WebAuthn User ID (unique user handle for this credential)
    webauthnUserID: text('webauthn_user_id').notNull(),
    
    // Public Key (base64url encoded)
    // This is the COSE-encoded public key returned by the authenticator
    publicKey: text('public_key').notNull(),
    
    // Signature Counter (prevents replay attacks)
    // Incremented by authenticator on each use
    counter: bigint('counter', { mode: 'number' }).notNull().default(0),
    
    // Authenticator Transports
    // Array of strings: ['usb', 'nfc', 'ble', 'internal', 'hybrid']
    transports: jsonb('transports').$type<string[]>(),
    
    // Device Metadata
    deviceName: text('device_name'), // User-friendly name (e.g., "iPhone 15 Pro")
    
    // Backup Eligibility (can credential be backed up to cloud?)
    backedUp: boolean('backed_up').notNull().default(false),
    
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp('last_used_at', { mode: 'date', withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('passkey_credentials_user_id_idx').on(table.userId),
    webauthnUserIdIdx: index('passkey_credentials_webauthn_user_id_idx').on(table.webauthnUserID),
  })
);

export const passkeyCredentialsRelations = relations(passkeyCredentials, ({ one }) => ({
  user: one(users, {
    fields: [passkeyCredentials.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// PASSWORD RESET TOKEN TABLE
// ============================================================================

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date', withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index('password_reset_tokens_user_id_idx').on(table.userId),
    expiresAtIdx: index('password_reset_tokens_expires_at_idx').on(table.expiresAt),
  })
);

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// ORGANIZATION TABLE
// ============================================================================

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    ownerIdx: index('organizations_owner_id_idx').on(table.ownerId),
  })
);

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
    relationName: 'OrganizationOwner',
  }),
  members: many(organizationMembers),
  projects: many(projects),
}));

// ============================================================================
// ORGANIZATION MEMBER TABLE (Join table with role)
// ============================================================================

export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'owner' | 'admin' | 'member'
    joinedAt: timestamp('joined_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Unique constraint: one user can only be a member once per organization
    uniqueOrgUser: unique('organization_members_org_user_unique').on(
      table.organizationId,
      table.userId
    ),
    organizationIdx: index('organization_members_org_id_idx').on(table.organizationId),
    userIdx: index('organization_members_user_id_idx').on(table.userId),
  })
);

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ((
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// PROJECT TABLE
// ============================================================================

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').notNull().default('planning'), // 'active' | 'completed' | 'on-hold' | 'planning'
    progress: integer('progress').notNull().default(0),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dueDate: timestamp('due_date', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    organizationIdx: index('projects_organization_id_idx').on(table.organizationId),
    ownerIdx: index('projects_owner_id_idx').on(table.ownerId),
    statusIdx: index('projects_status_idx').on(table.status),
  })
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
    relationName: 'ProjectOwner',
  }),
  tasks: many(tasks),
}));

// ============================================================================
// TASK TABLE
// ============================================================================

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('todo'), // 'todo' | 'in-progress' | 'completed'
    priority: text('priority').notNull().default('medium'), // 'low' | 'medium' | 'high' | 'urgent'
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dueDate: timestamp('due_date', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    projectIdx: index('tasks_project_id_idx').on(table.projectId),
    assigneeIdx: index('tasks_assignee_id_idx').on(table.assigneeId),
    statusIdx: index('tasks_status_idx').on(table.status),
    priorityIdx: index('tasks_priority_idx').on(table.priority),
  })
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: 'TaskAssignee',
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: 'TaskCreator',
  }),
}));

// ============================================================================
// TYPE EXPORTS (for TypeScript inference)
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type PasskeyCredential = typeof passkeyCredentials.$inferSelect;
export type NewPasskeyCredential = typeof passkeyCredentials.$inferInsert;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
