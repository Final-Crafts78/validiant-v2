/**
 * Drizzle ORM Schema for Validiant v2
 * Converted from Prisma schema with full type safety and edge compatibility
 * 
 * Models: User, Organization, OrganizationMember, Project, ProjectMember, Task, TaskAssignee, PasswordResetToken, PasskeyCredential
 * Database: PostgreSQL (Neon Serverless)
 * 
 * Phase 6.1 Enhancement: OAuth 2.0 support (Google, GitHub)
 * Phase 6.2 Enhancement: WebAuthn Passkeys (FIDO2)
 */

import { relations, sql } from 'drizzle-orm';
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
  varchar,
  real,
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
    
    // Profile fields
    avatarUrl: text('avatar_url'), // Profile picture URL (renamed from avatar for consistency)
    displayName: text('display_name'),
    bio: text('bio'),
    phoneNumber: varchar('phone_number', { length: 20 }),
    
    // User preferences and settings
    preferences: jsonb('preferences').default({}),
    notificationPreferences: jsonb('notification_preferences').default({}),
    
    // Security
    twoFactorEnabled: boolean('two_factor_enabled').default(false),
    
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
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
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
  projectMemberships: many(projectMembers),
  assignedTasks: many(tasks, { relationName: 'TaskAssignee' }),
  taskAssignments: many(taskAssignees),
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
    slug: text('slug').unique(),
    website: text('website'),
    industry: text('industry'),
    size: text('size'),
    logoUrl: text('logo_url'),
    settings: jsonb('settings').default({}),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
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
    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
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

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
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
    priority: text('priority'),
    progress: integer('progress').notNull().default(0),
    color: text('color'),
    icon: text('icon'),
    
    // Financial tracking
    budget: integer('budget'),
    
    // Project settings and configuration
    settings: jsonb('settings').default({}),
    
    // Time tracking
    estimatedHours: integer('estimated_hours'),
    actualHours: integer('actual_hours').default(0),
    
    // References
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    
    // Dates
    dueDate: timestamp('due_date', { mode: 'date', withTimezone: true }),
    startDate: timestamp('start_date', { mode: 'date', withTimezone: true }),
    endDate: timestamp('end_date', { mode: 'date', withTimezone: true }),
    
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
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
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: 'ProjectCreator',
  }),
  members: many(projectMembers),
  tasks: many(tasks),
}));

// ============================================================================
// PROJECT MEMBER TABLE (Join table with role)
// ============================================================================

export const projectMembers = pgTable(
  'project_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'owner' | 'admin' | 'member' | 'viewer'
    addedAt: timestamp('added_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    addedBy: uuid('added_by').references(() => users.id),
  },
  (table) => ({
    // Unique constraint: one user can only be a member once per project
    uniqueProjectUser: unique('project_members_project_user_unique').on(
      table.projectId,
      table.userId
    ),
    projectIdx: index('project_members_project_id_idx').on(table.projectId),
    userIdx: index('project_members_user_id_idx').on(table.userId),
  })
);

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
  addedByUser: one(users, {
    fields: [projectMembers.addedBy],
    references: [users.id],
    relationName: 'ProjectMemberAddedBy',
  }),
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
    position: real('position').default(0),
    
    // Task metadata
    tags: jsonb('tags').$type<string[]>().default([]),
    customFields: jsonb('custom_fields').default({}),
    
    // Task hierarchy (subtasks)
    parentTaskId: uuid('parent_task_id').references(() => tasks.id, { onDelete: 'cascade' }),
    
    // References
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    
    // Time tracking
    estimatedHours: integer('estimated_hours'),
    actualHours: integer('actual_hours'),
    
    // Dates
    dueDate: timestamp('due_date', { mode: 'date', withTimezone: true }),
    completedAt: timestamp('completed_at', { mode: 'date', withTimezone: true }),
    
    // Timestamps
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
  },
  (table) => ({
    projectIdx: index('tasks_project_id_idx').on(table.projectId),
    assigneeIdx: index('tasks_assignee_id_idx').on(table.assigneeId),
    parentTaskIdx: index('tasks_parent_task_id_idx').on(table.parentTaskId),
    statusIdx: index('tasks_status_idx').on(table.status),
    priorityIdx: index('tasks_priority_idx').on(table.priority),
  })
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
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
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'ParentTask',
  }),
  subtasks: many(tasks, { relationName: 'ParentTask' }),
  assignees: many(taskAssignees),
}));

// ============================================================================
// TASK ASSIGNEE TABLE (Join table for multiple assignees)
// ============================================================================

export const taskAssignees = pgTable(
  'task_assignees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    assignedBy: uuid('assigned_by').references(() => users.id),
  },
  (table) => ({
    // Unique constraint: one user can only be assigned once per task
    uniqueTaskUser: unique('task_assignees_task_user_unique').on(
      table.taskId,
      table.userId
    ),
    taskIdx: index('task_assignees_task_id_idx').on(table.taskId),
    userIdx: index('task_assignees_user_id_idx').on(table.userId),
  })
);

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskAssignees.userId],
    references: [users.id],
  }),
  assignedByUser: one(users, {
    fields: [taskAssignees.assignedBy],
    references: [users.id],
    relationName: 'TaskAssigneeAssignedBy',
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

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type NewTaskAssignee = typeof taskAssignees.$inferInsert;
