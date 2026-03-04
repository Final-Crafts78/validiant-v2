**Confirmed:** `apps/web` is already Next.js (has `next.config.js`, `next-env.d.ts`, `tailwind.config.ts`). `apps/app` and `apps/mobile` both exist in validiant-v2. Full 11-phase document below — every line is implementation-ready.

---

# VALIDIANT — MASTER BUILD DOCUMENT v2.0

### 17 Phases - Next.js 15 App Router - PartyKit Real-Time - Expo React Native

---

## ⚠️ MANDATORY READING FOR ANY AI IMPLEMENTING ANY PHASE

**Repository:** `Final-Crafts78/validiant-v2 — ALL code goes here.
**Stack is locked.** Never deviate from these choices. Do not suggest alternatives.

### Confirmed Stack (read from actual package.json files)

| Layer            | Technology                                               | Confirmed From                             |
| ---------------- | -------------------------------------------------------- | ------------------------------------------ |
| API Runtime      | Cloudflare Workers (Wrangler)                            | `validiant-v2/apps/api`                    |
| API Framework    | Hono v4                                                  | `validiant-v2/apps/api`                    |
| ORM              | Drizzle ORM + Neon PostgreSQL                            | `validiant-v2/apps/api`                    |
| Web Frontend     | **Next.js 15 App Router**                                | `validiant-v2/apps/web/next.config.js`     |
| Mobile           | **Expo React Native (apps/app)**                         | `validiant-v2/apps/app`                    |
| State Management | **Zustand + TanStack Query v5**                          | confirmed architecture                     |
| Real-Time        | **PartyKit**                                             | `validiant-v2` package.json                |
| Auth - Tokens    | jose (JWT)                                               | `validiant-v2/apps/api`                    |
| Auth - Password  | Password: Web Crypto API (PBKDF2) + OAuth 2.0 + WebAuthn | Edge-compatible auth                       |
| Session Cache    | Upstash Redis                                            | `validiant-v2/apps/api`                    |
| Email            | **Resend HTTP API** (NOT nodemailer)                     | CF Workers constraint                      |
| Validation       | Zod + @hono/zod-validator                                | `validiant-v2/apps/api`                    |
| CSS              | Tailwind CSS                                             | `validiant-v2/apps/web/tailwind.config.ts` |
| Build            | pnpm workspaces + Turborepo                              | `ValidiantOld-Newpatchwork`                |

### Three Source Repos → Migration Map

| Source Repo                                                          | Feature Category                     | Migrated To Phase |
| -------------------------------------------------------------------- | ------------------------------------ | ----------------- |
| `Validiant/server.js` — Email system (Resend)                        | Email notifications                  | Phase 4           |
| `Validiant/server.js` — Contact form                                 | `POST /api/contact`                  | Phase 6           |
| `Validiant/server.js` — Admin password reset                         | `POST /api/users/:id/reset-password` | Phase 4           |
| `Validiant/server.js` — Full employee edit                           | `PUT /api/users/:id`                 | Phase 4           |
| `Validiant/server.js` — Hard delete with admin password confirmation | `DELETE /api/users/:id`              | Phase 4           |
| `Validiant/server.js` — Dedicated status endpoint                    | `PUT /api/tasks/:taskId/status`      | Phase 5           |
| `Validiant/server.js` — `address` field on tasks                     | DB schema column                     | Phase 2           |
| `Validiant/server.js` — User-Agent detection in login logs           | Auth service                         | Phase 3           |
| `Validiant/server.js` — SLA in CSV export                            | Export route                         | Phase 5           |
| `validiant-tracker/index.js` — All task CRUD                         | Task routes                          | Phase 5           |
| `validiant-tracker/index.js` — Bulk upload + column normalization    | Bulk upload route                    | Phase 5           |
| `validiant-tracker/index.js` — GPS coordinate extraction             | `lib/coordinates.ts`                 | Phase 5           |
| `validiant-tracker/index.js` — Activity logging                      | `services/activityLog.ts`            | Phase 4           |
| `validiant-tracker/index.js` — Analytics parallel queries            | Analytics route                      | Phase 6           |

---

PHASE 1 — Monorepo Foundation & Elite SaaS Architecture🔄 UPDATED: Next.js 15 App Router + Expo + Multi-Tenant SaaS Edge APIObjectiveEstablish the complete monorepo skeleton in Final-Crafts78/ValidiantOld-Newpatchwork. This architecture supports a modern, elite B2B SaaS platform featuring Multi-Tenancy (Organizations/Projects), advanced Authentication (OAuth 2.0 + WebAuthn/Passkeys), and real-time synchronization. Zero application logic in this phase — only infrastructure, tooling, and configuration files.Confirmed Stack (Elite Architecture)LayerTechnologyStatusAPI RuntimeCloudflare Workers (Edge)LockedAPI FrameworkHono v4LockedORMDrizzle ORM + Neon Serverless PostgreSQLLockedWeb FrontendNext.js 15 App RouterLockedMobileExpo React Native (apps/app)LockedState ManagementZustand + TanStack Query v5LockedReal-TimePartyKitLockedAuth - Corejose (JWT) + bcryptjs (Password Hash)LockedAuth - SocialOAuth 2.0 via arctic (Google, GitHub)LockedAuth - PasskeysWebAuthn via @simplewebauthn/serverLockedValidationZod + @hono/zod-validatorLockedCSSTailwind CSSLockedBuild Systempnpm workspaces + TurborepoLockedCloudflare Workers Edge Rules (MANDATORY)Because this API runs on Cloudflare Workers (V8 Isolates), standard Node.js APIs are limited. You must follow these edge-native patterns:Routing & Validation: Always use Hono and @hono/zod-validator. Never use Express or Multer.Database: Always use @neondatabase/serverless over standard pg. The HTTP driver is required for stateless edge connections.JWTs: Always use jose. Standard jsonwebtoken relies on Node crypto and will fail at the edge.Auth Handlers: Blindly trust c.req.valid('json') in controllers after the Zod validator middleware has run.Complete Directory Structure After Phase 1PlaintextValidiantOld-Newpatchwork/

### 🚫 Forbidden Node.js APIs (AI Guardrails)

Do NOT use these standard Node packages. They will crash the Cloudflare Worker.
| Forbidden Package | Use This Edge-Native Alternative Instead |
| :--- | :--- |
| `bcrypt` / `bcryptjs` | Web Crypto API (`crypto.subtle.deriveBits` with PBKDF2) |
| `jsonwebtoken` | `jose` (Edge-compatible JWTs) |
| `multer` | Native `c.req.parseBody()` (Hono) |
| `fs` / `path` | Cloudflare R2 / Drizzle DB |
| `express` | `hono` |

├── apps/
│ ├── api/ ← Hono + Drizzle + CF Workers
│ │ ├── src/
│ │ │ ├── app.ts ← Hono app setup & middleware
│ │ │ ├── index.ts ← CF Worker entry point
│ │ │ ├── routes/ ← Edge-validated routes
│ │ │ │ ├── auth.routes.ts
│ │ │ │ ├── oauth.routes.ts ← Google/GitHub login
│ │ │ │ ├── passkey.routes.ts ← WebAuthn FIDO2
│ │ │ │ ├── organization.routes.ts
│ │ │ │ ├── project.routes.ts
│ │ │ │ ├── user.routes.ts
│ │ │ │ └── task.routes.ts
│ │ │ ├── controllers/ ← Business logic
│ │ │ ├── services/ ← Shared services (Auth, OAuth, Passkey)
│ │ │ ├── middleware/ ← Edge middleware (auth, rate limits)
│ │ │ ├── config/ ← Env, OAuth, Redis, WebAuthn configs
│ │ │ └── db/
│ │ │ ├── schema.ts ← Drizzle SaaS tables (Orgs, Projects, Users)
│ │ │ └── index.ts ← Neon serverless client
│ │ ├── package.json
│ │ ├── wrangler.toml
│ │ └── drizzle.config.ts
│ │
│ ├── party/ ← PartyKit real-time server
│ │ ├── src/server.ts  
│ │ └── partykit.json
│ │
│ ├── web/ ← Next.js 15 App Router
│ │ ├── src/
│ │ │ ├── app/  
│ │ │ │ ├── layout.tsx ← Root layout: html, body, Providers
│ │ │ │ ├── page.tsx ← Root redirect
│ │ │ │ ├── auth/ ← Auth routes (login, register, forgot-password)
│ │ │ │ ├── dashboard/ ← Protected SaaS routes
│ │ │ │ │ ├── layout.tsx ← Dashboard Shell (Sidebar/Topbar)
│ │ │ │ │ ├── page.tsx  
│ │ │ │ │ ├── organizations/
│ │ │ │ │ ├── projects/
│ │ │ │ │ ├── tasks/
│ │ │ │ │ └── profile/
│ │ │ │ └── api/auth/ ← Next.js Route handlers (BFF)
│ │ │ ├── components/  
│ │ │ ├── hooks/ ← TanStack Query & PartyKit hooks
│ │ │ ├── lib/ ← Axios API client
│ │ │ ├── store/ ← Zustand (auth.ts)
│ │ │ └── middleware.ts ← Edge Middleware (Route Protection)
│ │ ├── package.json
│ │ └── next.config.js  
│ │
│ └── app/ ← Expo React Native Mobile App
│ ├── app/ ← Expo Router v4
│ │ ├── (auth)/ ← Login/Register
│ │ ├── (tabs)/ ← Bottom Tabs (Tasks, Projects, Orgs, Profile)
│ │ └── \_layout.tsx  
│ ├── src/
│ │ ├── services/api.ts ← Axios interceptors
│ │ ├── store/auth.ts ← Zustand auth state
│ │ └── utils/storage.ts ← expo-secure-store wrapper
│ └── package.json
│
├── packages/
│ └── shared/ ← Monorepo Shared Types & Schemas
│ ├── src/
│ │ ├── schemas/ ← Zod Schemas (auth, orgs, projects)
│ │ ├── types/ ← TS Interfaces
│ │ └── index.ts  
│ └── package.json
├── package.json  
├── pnpm-workspace.yaml
└── turbo.json
File: Root package.jsonJSON{
"name": "validiant",
"private": true,
"scripts": {
"dev": "turbo dev",
"dev:api": "pnpm --filter @validiant/api dev",
"dev:web": "pnpm --filter @validiant/web dev",
"dev:party": "pnpm --filter @validiant/party dev",
"dev:app": "pnpm --filter @validiant/app dev",
"build": "turbo build",
"type-check": "turbo type-check",
"db:push": "pnpm --filter @validiant/api db:push",
"db:generate": "pnpm --filter @validiant/api db:generate",
"db:studio": "pnpm --filter @validiant/api db:studio",
"deploy:api": "pnpm --filter @validiant/api deploy",
"deploy:web": "pnpm --filter @validiant/web build"
},
"devDependencies": {
"turbo": "latest"
},
"engines": { "node": ">=20.0.0", "pnpm": ">=9.0.0" }
}
File: pnpm-workspace.yamlYAMLpackages:

- 'apps/\*'
- 'packages/_'
  File: apps/api/package.jsonJSON{
  "name": "@validiant/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
  "dev": "wrangler dev",
  "build": "tsc",
  "deploy": "wrangler deploy",
  "type-check": "tsc --noEmit",
  "db:generate": "drizzle-kit generate:pg",
  "db:push": "drizzle-kit push:pg",
  "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
  "@hono/zod-validator": "^0.2.1",
  "@neondatabase/serverless": "^0.9.0",
  "@simplewebauthn/server": "^9.0.3",
  "@upstash/redis": "^1.28.2",
  "@validiant/shared": "workspace:_",
  "arctic": "^1.9.2",
  "drizzle-orm": "^0.29.3",
  "hono": "^4.0.0",
  "jose": "^5.9.6",
  "uuid": "^9.0.1",
  "zod": "^3.22.4"
  },
  "devDependencies": {
  "@cloudflare/workers-types": "^4.20240208.0",
  "@types/bcryptjs": "^2.4.6",
  "@types/uuid": "^9.0.7",
  "drizzle-kit": "^0.20.13",
  "partykit": "^0.0.111",
  "typescript": "^5.3.3",
  "wrangler": "latest"
  }
  }
  File: apps/api/wrangler.tomlIni, TOMLname = "validiant-api"
  main = "src/index.ts"
  compatibility_date = "2024-02-01"
  compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
PARTYKIT_HOST = "validiant-party.YOUR_USERNAME.partykit.dev"
API_BASE_URL = "http://localhost:8787"
FRONTEND_URL = "http://localhost:3000"

# Required Secrets (Set via: wrangler secret put <NAME>)

# DATABASE_URL — Neon PostgreSQL

# JWT_SECRET — For jose token signing

# UPSTASH_REDIS_REST_URL — Session denylists/Rate limits

# UPSTASH_REDIS_REST_TOKEN

# GOOGLE_CLIENT_ID — OAuth 2.0

# GOOGLE_CLIENT_SECRET

# GITHUB_CLIENT_ID

# GITHUB_CLIENT_SECRET

# DIDIT_API_KEY — Phase 17 KYC

# DIDIT_WEBHOOK_SECRET — Phase 17 KYC Webhook Security

Phase 1 Completion Checklist[ ] pnpm install from repo root completes with zero errors.[ ] pnpm run type-check passes across the monorepo.[ ] pnpm --filter @validiant/api dev starts wrangler on localhost:8787.[ ] pnpm --filter @validiant/web dev starts Next.js App Router on localhost:3000.[ ] packages/shared types and schemas export cleanly to all apps.[ ] wrangler.toml environment variables are mapped accurately.

PHASE 2 — Elite SaaS Database Schema & Migrations
🔄 UPDATED: Multi-Tenant Architecture + Field-Worker Tracking Merge

Objective
Establish the Drizzle ORM schema for PostgreSQL (Neon Serverless). This schema merges a modern B2B SaaS structure (Users → Organizations → Projects → Tasks) with elite authentication models (Passkeys, OAuth) and the strict operational tracking features required for field workers (GPS coordinates, pincodes, map URLs, and granular activity logging).

File: apps/api/src/db/index.ts
TypeScript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import \* as schema from './schema'

// Neon HTTP driver — stateless, perfect for Cloudflare Workers Edge
export function getDb(databaseUrl: string) {
const sql = neon(databaseUrl)
return drizzle(sql, { schema })
}

export type Database = ReturnType<typeof getDb>
File: apps/api/src/db/schema.ts
TypeScript
import { relations, sql } from 'drizzle-orm'
import {
pgTable, uuid, text, timestamp, integer, bigint,
boolean, jsonb, unique, index, varchar, real
} from 'drizzle-orm/pg-core'

// ============================================================================
// USERS (OAuth & Passkey Enhanced)
// ============================================================================

export const users = pgTable('users', {
id: uuid('id').primaryKey().defaultRandom(),
email: text('email').notNull().unique(),
passwordHash: text('password_hash'), // Nullable for OAuth/Passkey users
fullName: text('full_name').notNull(),

// Profile fields
avatarUrl: text('avatar_url'),
phoneNumber: varchar('phone_number', { length: 20 }),
preferences: jsonb('preferences').default({}),

// OAuth Provider IDs
googleId: text('google_id'),
githubId: text('github_id'),

// Global System Status
role: text('role').notNull().default('user'), // 'user' | 'superadmin'
status: text('status').notNull().default('active'),

lastLoginAt: timestamp('last_login_at', { mode: 'date', withTimezone: true }),
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
emailIdx: index('users_email_idx').on(table.email),
googleIdIdx: index('users_google_id_idx').on(table.googleId),
}))

// ============================================================================
// AUTHENTICATION: PASSKEYS & RESET TOKENS
// ============================================================================

export const passkeyCredentials = pgTable('passkey_credentials', {
credentialID: text('credential_id').primaryKey(),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
webauthnUserID: text('webauthn_user_id').notNull(),
publicKey: text('public_key').notNull(),
counter: bigint('counter', { mode: 'number' }).notNull().default(0),
transports: jsonb('transports').$type<string[]>(),
deviceName: text('device_name'),
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
lastUsedAt: timestamp('last_used_at', { mode: 'date', withTimezone: true }),
})

export const passwordResetTokens = pgTable('password_reset_tokens', {
id: uuid('id').primaryKey().defaultRandom(),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
tokenHash: text('token_hash').notNull(),
expiresAt: timestamp('expires_at', { mode: 'date', withTimezone: true }).notNull(),
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// MULTI-TENANCY: ORGANIZATIONS & PROJECTS
// ============================================================================

export const organizations = pgTable('organizations', {
id: uuid('id').primaryKey().defaultRandom(),
name: text('name').notNull(),
slug: text('slug').unique(),
industryType: varchar('industry_type', { length: 50 }).notNull().default('bgv'), // e.g., 'bgv', 'logistics', 'it'
settings: jsonb('settings').default({}),
ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
})

export const organizationMembers = pgTable('organization_members', {
id: uuid('id').primaryKey().defaultRandom(),
organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
role: text('role').notNull(), // 'owner' | 'admin' | 'member'
joinedAt: timestamp('joined_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
uniqueOrgUser: unique('org_members_unique').on(table.organizationId, table.userId),
}))

export const projects = pgTable('projects', {
id: uuid('id').primaryKey().defaultRandom(),
name: text('name').notNull(),
status: text('status').notNull().default('active'),
organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
})

export const projectMembers = pgTable('project_members', {
id: uuid('id').primaryKey().defaultRandom(),
projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
role: text('role').notNull(), // 'manager' | 'contributor' | 'viewer'
addedAt: timestamp('added_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
uniqueProjectUser: unique('proj_members_unique').on(table.projectId, table.userId),
}))

// ============================================================================
// TASKS (MERGED: SaaS Structure + Field-Worker Tracking)
// ============================================================================

export const tasks = pgTable('tasks', {
id: uuid('id').primaryKey().defaultRandom(),
projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
createdById: uuid('created_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

title: text('title').notNull(),
description: text('description'),
status: text('status').notNull().default('Unassigned'),
priority: text('priority').notNull().default('medium'),

clientName: varchar('client_name', { length: 200 }),
pincode: varchar('pincode', { length: 6 }),
address: text('address'),
mapUrl: text('map_url'), // Optional by default. UI will auto-extract lat/lng if pasted.
latitude: real('latitude'),
longitude: real('longitude'),

customFields: jsonb('custom_fields').default({}), // Holds Didit KYC, Base64 Sigs, etc.

completedAt: timestamp('completed_at', { mode: 'date', withTimezone: true }),
verifiedAt: timestamp('verified_at', { mode: 'date', withTimezone: true }),
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
projectIdx: index('tasks_project_id_idx').on(table.projectId),
statusIdx: index('tasks_status_idx').on(table.status),
pincodeIdx: index('tasks_pincode_idx').on(table.pincode),
}))

export const taskAssignees = pgTable('task_assignees', {
id: uuid('id').primaryKey().defaultRandom(),
taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
assignedAt: timestamp('assigned_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
uniqueTaskUser: unique('task_assignees_unique').on(table.taskId, table.userId),
}))

// ============================================================================
// COMMUNICATION & NOTIFICATIONS (Phases 14 & 15)
// ============================================================================

export const taskComments = pgTable('task_comments', {
id: uuid('id').primaryKey().defaultRandom(),
taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
content: text('content').notNull(),
attachmentUrl: text('attachment_url'), // For Cloudflare R2 uploads
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
taskIdx: index('comments_task_id_idx').on(table.taskId),
}))

export const pushTokens = pgTable('push_tokens', {
id: uuid('id').primaryKey().defaultRandom(),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
token: text('token').notNull().unique(), // Expo Push Token
deviceType: text('device_type'), // 'ios' | 'android'
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
})

// ============================================================================
// ACTIVITY LOGS (Auditing for SLA & Security)
// ============================================================================

export const activityLogs = pgTable('activity_logs', {
id: uuid('id').primaryKey().defaultRandom(),
organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

action: varchar('action', { length: 100 }).notNull(),
// e.g., 'TASK_STATUS_CHANGED', 'TASK_ASSIGNED', 'LOGIN_SUCCESS', 'OAUTH_LINKED'

entityId: uuid('entity_id'), // ID of the task, user, or project affected
entityType: varchar('entity_type', { length: 50 }), // 'task', 'user', 'project'

oldValue: jsonb('old_value'),
newValue: jsonb('new_value'),
details: text('details'),

deviceType: varchar('device_type', { length: 50 }),
ipAddress: varchar('ip_address', { length: 50 }),
createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
orgIdx: index('logs_org_idx').on(table.organizationId),
entityIdx: index('logs_entity_idx').on(table.entityId),
}))

// ============================================================================
// RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ many }) => ({
organizationMemberships: many(organizationMembers),
projectMemberships: many(projectMembers),
taskAssignments: many(taskAssignees),
passkeyCredentials: many(passkeyCredentials),
}))

export const organizationsRelations = relations(organizations, ({ many }) => ({
members: many(organizationMembers),
projects: many(projects),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
organization: one(organizations, { fields: [projects.organizationId], references: [organizations.id] }),
members: many(projectMembers),
tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
creator: one(users, { fields: [tasks.createdById], references: [users.id] }),
assignees: many(taskAssignees),
}))
File: apps/api/drizzle.config.ts
TypeScript
import type { Config } from 'drizzle-kit'

export default {
schema: './src/db/schema.ts',
out: './migrations',
driver: 'pg',
dbCredentials: { connectionString: process.env.DATABASE_URL! },
verbose: true,
strict: true,
} satisfies Config
Migration Execution Commands
Because the schema shape changed significantly to merge the old columns into the new architecture, you need to generate a new migration file and apply it.

Bash
cd apps/api

# Ensure DATABASE_URL is in your local .env

pnpm db:generate # Generates the SQL migration tracking the new columns
pnpm db:push # Pushes changes safely to Neon
pnpm db:studio # Open browser to verify Tasks and Activity Logs exist

Phase 2 Completion Checklist
[ ] Schema successfully merges SaaS structures with pincode, latitude, longitude, etc.

[ ] activityLogs table created for enterprise auditing.

[ ] pnpm db:generate produces a successful migration file.

[ ] pnpm db:push applies to Neon database with zero errors.

[ ] pnpm type-check passes across the API.

PHASE 3 — Elite Authentication System (OAuth 2.0 + Passkeys + JWT)
🔄 UPDATED: Multi-Layer Authentication (Google OAuth + FIDO2 + Edge JWT + WebCrypto)

Objective
Implement a highly secure, enterprise-grade authentication system optimized for Cloudflare Workers. This phase completely replaces basic password-only auth with a modern multi-faceted approach:

OAuth 2.0: Social login (Google/GitHub) via the arctic library.

WebAuthn (Passkeys): Passwordless FIDO2 authentication via @simplewebauthn/server.

Core JWT Sessions: Stateless session management using jose (Edge-compatible) with short-lived Access Tokens and long-lived Refresh Tokens (stored in HttpOnly cookies).

Redis Denylist: Immediate session revocation using Upstash Redis.

Edge-Native Hashing: Standard password login using the native Web Crypto API (PBKDF2) to prevent V8 CPU timeouts on Cloudflare.

File: apps/api/src/utils/password.ts (Edge-Native Hashing)
TypeScript
// Never use bcryptjs on Cloudflare Workers (causes CPU time limit crashes).
// Use native Web Crypto API PBKDF2 instead.

export async function hashPassword(password: string, saltString?: string) {
const salt = saltString
? Uint8Array.from(atob(saltString), c => c.charCodeAt(0))
: crypto.getRandomValues(new Uint8Array(16));

const keyMaterial = await crypto.subtle.importKey(
'raw',
new TextEncoder().encode(password),
{ name: 'PBKDF2' },
false,
['deriveBits']
);

const hash = await crypto.subtle.deriveBits(
{
name: 'PBKDF2',
salt: salt,
iterations: 100000,
hash: 'SHA-256'
},
keyMaterial,
256
);

return {
hash: btoa(String.fromCharCode(...new Uint8Array(hash))),
salt: btoa(String.fromCharCode(...salt))
};
}

export async function verifyPassword(password: string, storedHash: string, storedSalt: string) {
const { hash } = await hashPassword(password, storedSalt);
return hash === storedHash;
}
File: apps/api/src/utils/jwt.ts
TypeScript
// Edge-compatible JWT implementation using 'jose' (jsonwebtoken is NOT supported on CF Workers)
import { SignJWT, jwtVerify } from 'jose'

export async function signToken(
payload: Record<string, unknown>,
secret: string,
expiresIn: string | number
): Promise<string> {
const encodedSecret = new TextEncoder().encode(secret)
return new SignJWT(payload)
.setProtectedHeader({ alg: 'HS256' })
.setIssuedAt()
.setExpirationTime(expiresIn)
.sign(encodedSecret)
}

export async function verifyToken(token: string, secret: string) {
const encodedSecret = new TextEncoder().encode(secret)
const { payload } = await jwtVerify(token, encodedSecret)
return payload
}

export async function generateAuthTokens(userId: string, role: string, env: Env) {
const accessToken = await signToken(
{ sub: userId, role },
env.JWT_SECRET,
'15m' // 15 minutes
)

const refreshToken = await signToken(
{ sub: userId, type: 'refresh' },
env.JWT_SECRET,
'7d' // 7 days
)

return { accessToken, refreshToken }
}
File: apps/api/src/services/oauth.service.ts
TypeScript
// OAuth 2.0 implementation using 'arctic'
import { Google, GitHub, generateState, generateCodeVerifier } from 'arctic'

export function getOAuthProviders(env: Env) {
// Google OAuth configuration (Confirmed Working)
// Requires cross-subdomain cookie handling if API and Web are on different subdomains
const google = new Google(
env.GOOGLE_CLIENT_ID,
env.GOOGLE_CLIENT_SECRET,
`${env.API_BASE_URL}/api/v1/oauth/google/callback`
)

const github = new GitHub(
env.GITHUB_CLIENT_ID,
env.GITHUB_CLIENT_SECRET
)

return { google, github }
}

// File: apps/api/src/routes/auth.routes.ts
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { verifyToken, generateAuthTokens } from '../utils/jwt'

const authRoutes = new Hono<{ Bindings: Env }>()

// Silent Token Refresh (Called by Axios Interceptor)
authRoutes.post('/refresh', async (c) => {
const refreshToken = getCookie(c, 'refreshToken')
if (!refreshToken) return c.json({ error: 'No refresh token' }, 401)

try {
const payload = await verifyToken(refreshToken, c.env.JWT_SECRET)
if (payload.type !== 'refresh') throw new Error('Invalid token type')

    const userId = payload.sub as string
    // In production, verify user still exists and is active here

    const tokens = await generateAuthTokens(userId, 'user', c.env)

    setCookie(c, 'refreshToken', tokens.refreshToken, {
      domain: '.validiant.com', // Adjust for local vs prod
      path: '/',
      secure: c.env.ENVIRONMENT === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })

    // Return the new access token to the client
    return c.json({ accessToken: tokens.accessToken })

} catch (error) {
deleteCookie(c, 'refreshToken')
return c.json({ error: 'Invalid or expired refresh token' }, 401)
}
})

export default authRoutes

File: apps/api/src/routes/oauth.routes.ts
TypeScript
import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { generateState, generateCodeVerifier } from 'arctic'
import { getOAuthProviders } from '../services/oauth.service'

const oauthRoutes = new Hono<{ Bindings: Env }>()

// Google Auth Initiation
oauthRoutes.get('/google', async (c) => {
const { google } = getOAuthProviders(c.env)
const state = generateState()
const codeVerifier = generateCodeVerifier()

const url = await google.createAuthorizationURL(state, codeVerifier, {
scopes: ['profile', 'email']
})

// Store state and verifier in secure, httpOnly cookies for the callback
setCookie(c, 'oauth*state', state, { path: '/', secure: true, httpOnly: true, maxAge: 60 * 10 })
setCookie(c, 'oauth*code_verifier', codeVerifier, { path: '/', secure: true, httpOnly: true, maxAge: 60 * 10 })

return c.redirect(url.toString())
})

// Google Auth Callback
oauthRoutes.get('/google/callback', async (c) => {
const url = new URL(c.req.url)
const code = url.searchParams.get('code')
const state = url.searchParams.get('state')

const storedState = getCookie(c, 'oauth_state')
const storedCodeVerifier = getCookie(c, 'oauth_code_verifier')

if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
return c.json({ error: 'Invalid OAuth state' }, 400)
}

const { google } = getOAuthProviders(c.env)

try {
const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier)

    // Fetch user profile from Google
    const googleUserRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    })
    const googleUser = await googleUserRes.json()

    // TODO: Upsert user into DB by email/googleId, generate JWTs via generateAuthTokens(),
    // set HttpOnly refresh token cookie, and redirect to frontend dashboard.

    return c.redirect(`${c.env.FRONTEND_URL}/dashboard?login=success`)

} catch (error) {
return c.json({ error: 'Failed to authenticate with Google' }, 500)
}
})

export default oauthRoutes
File: apps/api/src/routes/passkey.routes.ts
TypeScript
import { Hono } from 'hono'
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server'
// Detailed implementation maps to simplewebauthn docs
// 1. /generate-registration-options
// 2. /verify-registration
// 3. /generate-authentication-options
// 4. /verify-authentication
Cookie Strategy (Cross-Subdomain Safety)
If your API (api.validiant.com) and Web (app.validiant.com) are on different subdomains, cookies must be configured with the correct Domain attribute to be shared successfully:

TypeScript
setCookie(c, 'refreshToken', tokens.refreshToken, {
domain: '.validiant.com', // Crucial for cross-subdomain sharing
path: '/',
secure: process.env.NODE*ENV === 'production',
httpOnly: true,
sameSite: 'lax', // 'lax' is required for OAuth redirects; 'strict' will break the callback
maxAge: 7 * 24 \_ 60 \* 60,
})
Phase 3 Completion Checklist
[ ] Google OAuth 2.0 flow initiates, redirects, and successfully handles the callback.

[ ] JWTs are generated using jose natively on the Edge (no Node crypto polyfill errors).

[ ] Refresh token is stored in an HttpOnly cookie with the correct Domain and SameSite=Lax policy.

[ ] WebAuthn endpoints properly return challenges and verify signatures.

[ ] Logout endpoint successfully writes the invalidated refresh token to Upstash Redis.

[ ] Standard Email/Password login correctly hashes passwords using the native Web Crypto API (crypto.subtle) — NOT bcryptjs.

PHASE 4 — Elite SaaS Management APIs (Organizations & Projects)
🔄 UPDATED: Multi-Tenant RBAC (Role-Based Access Control)

Objective
Implement the management layer for the SaaS architecture. Users do not exist in a flat hierarchy; they belong to Organizations and are assigned to Projects. Access to tasks is strictly governed by a user's role within these entities.

File: apps/api/src/middleware/rbac.ts
TypeScript
import { createMiddleware } from 'hono/factory'
import { and, eq } from 'drizzle-orm'
import { organizationMembers, projectMembers } from '../db/schema'
import { getDb } from '../db'
import type { Env } from '../index'

// Edge-native middleware to verify Organization Roles ('owner', 'admin', 'member')
export const requireOrgRole = (allowedRoles: string[]) => {
return createMiddleware<{ Bindings: Env }>(async (c, next) => {
const user = c.var.user // Injected by authenticate middleware
const orgId = c.req.param('orgId') || c.req.query('organizationId')

    if (!orgId) return c.json({ error: 'Organization ID required' }, 400)

    const db = getDb(c.env.DATABASE_URL)
    const [membership] = await db.select().from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.userId, user.id)
      )).limit(1)

    if (!membership || !allowedRoles.includes(membership.role)) {
      return c.json({ error: 'Insufficient organization permissions' }, 403)
    }

    c.set('orgRole', membership.role)
    await next()

})
}

// Edge-native middleware to verify Project Roles ('manager', 'contributor', 'viewer')
export const requireProjectRole = (allowedRoles: string[]) => {
return createMiddleware<{ Bindings: Env }>(async (c, next) => {
const user = c.var.user
const projectId = c.req.param('projectId') || (await c.req.json().catch(()=>({}))).projectId

    if (!projectId) return c.json({ error: 'Project ID required' }, 400)

    const db = getDb(c.env.DATABASE_URL)
    const [membership] = await db.select().from(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, user.id)
      )).limit(1)

    if (!membership || !allowedRoles.includes(membership.role)) {
      return c.json({ error: 'Insufficient project permissions' }, 403)
    }

    c.set('projectRole', membership.role)
    await next()

})
}
File: apps/api/src/routes/organization.routes.ts
TypeScript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requireOrgRole } from '../middleware/rbac'
import \* as orgController from '../controllers/organization.controller'

const orgRoutes = new Hono()

orgRoutes.use('\*', authenticate)

// Create a new Organization (User automatically becomes 'owner')
orgRoutes.post('/', zValidator('json', z.object({
name: z.string().min(2),
slug: z.string().min(2).optional()
})), orgController.createOrganization)

// Get all organizations the user belongs to
orgRoutes.get('/', orgController.getUserOrganizations)

// Add a user to the organization (Requires 'owner' or 'admin' role)
orgRoutes.post('/:orgId/members',
requireOrgRole(['owner', 'admin']),
zValidator('json', z.object({
email: z.string().email(),
role: z.enum(['admin', 'member'])
})),
orgController.inviteMember
)

export default orgRoutes
// File: apps/api/src/routes/project.routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requireOrgRole, requireProjectRole } from '../middleware/rbac'
import \* as projectController from '../controllers/project.controller'

const projectRoutes = new Hono()

projectRoutes.use('\*', authenticate)

// RESTful Route: POST /organizations/:orgId/projects
projectRoutes.post('/organizations/:orgId/projects',
requireOrgRole(['owner', 'admin']),
zValidator('json', z.object({
name: z.string().min(1),
})),
projectController.createProject
)

// Add members to a project (Requires Project Manager)
projectRoutes.post('/:projectId/members',
requireProjectRole(['manager']),
zValidator('json', z.object({
userId: z.string().uuid(),
role: z.enum(['manager', 'contributor', 'viewer'])
})),
projectController.addProjectMember
)

export default projectRoutes

Phase 4 Completion Checklist
[ ] RBAC middleware successfully blocks users from accessing Orgs/Projects they don't belong to.

[ ] POST /api/v1/organizations creates an org and automatically inserts an owner record in organizationMembers.

[ ] POST /api/v1/projects creates a project and automatically inserts a manager record in projectMembers.

[ ] All routes are strictly validated using @hono/zod-validator at the edge.

PHASE 5 — Elite Task Management API & PartyKit Real-Time
🔄 UPDATED: Join-Table Assignments + Granular Activity Logging

Objective
Implement the core workflow engine. Tasks now belong to Projects, can have multiple assignees via the task_assignees join table, and strictly log all actions to the new activity_logs table. PartyKit WebSockets broadcast updates instantly to all clients.

File: apps/api/src/utils/activity.ts
TypeScript
// Edge-compatible Activity Logger
import { activityLogs } from '../db/schema'
import type { Database } from '../db'

export async function logActivity(
db: Database,
params: {
organizationId?: string,
userId: string,
action: string,
entityId: string,
entityType: 'task' | 'project' | 'user' | 'organization',
oldValue?: any,
newValue?: any,
details?: string,
ipAddress?: string,
deviceType?: string
}
) {
try {
await db.insert(activityLogs).values({
organizationId: params.organizationId,
userId: params.userId,
action: params.action,
entityId: params.entityId,
entityType: params.entityType,
oldValue: params.oldValue,
newValue: params.newValue,
details: params.details,
ipAddress: params.ipAddress,
deviceType: params.deviceType
})
} catch (error) {
// Never fail the main request if logging fails
console.error('Activity Log Failed:', error)
}
}

// File: apps/api/src/utils/partykit.ts
export async function broadcastTaskEvent(
partykitHost: string,
event: {
type: string,
projectId: string,
taskId: string,
assigneeId?: string,
[key: string]: any
}
): Promise<void> {
try {
const urls = [`https://${partykitHost}/parties/tasks/${event.projectId}`]

    // Broadcast to the user's personal room for mobile updates
    if (event.assigneeId) {
      urls.push(`https://${partykitHost}/parties/tasks/user_${event.assigneeId}`)
    }

    await Promise.all(urls.map(url =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(e => console.error('PartyKit isolated fail:', e))
    ))

} catch (err) {
console.error('PartyKit broadcast failed:', err)
}
}

File: apps/api/src/controllers/task.controller.ts
TypeScript
import { eq, and } from 'drizzle-orm'
import { tasks, taskAssignees } from '../db/schema'
import { getDb } from '../db'
import { logActivity } from '../utils/activity'
import { broadcastTaskEvent } from '../utils/partykit'
import { VALID_TRANSITIONS } from '@validiant/shared' // Make sure this is in your shared package

// PUT /api/v1/tasks/:taskId/status
export const updateTaskStatus = async (c: any) => {
const db = getDb(c.env.DATABASE_URL)
const user = c.var.user
const taskId = c.req.param('taskId')
const { status: newStatus } = c.req.valid('json')

const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
if (!task) return c.json({ error: 'Task not found' }, 404)

const validNextStatuses = VALID_TRANSITIONS[task.status] || []
if (!validNextStatuses.includes(newStatus)) {
return c.json({ error: `Invalid transition from ${task.status} to ${newStatus}` }, 400)
}

const updateData: any = { status: newStatus, updatedAt: new Date() }
if (newStatus === 'Completed') updateData.completedAt = new Date()
if (newStatus === 'Verified') updateData.verifiedAt = new Date()

await db.update(tasks).set(updateData).where(eq(tasks.id, taskId))

await logActivity(db, {
userId: user.id, action: 'TASK_STATUS_CHANGED', entityId: taskId, entityType: 'task',
oldValue: { status: task.status }, newValue: { status: newStatus }
})

await broadcastTaskEvent(c.env.PARTYKIT_HOST, {
type: 'TASK_STATUS_CHANGED', projectId: task.projectId, taskId: taskId, status: newStatus
})

return c.json({ success: true, task: { ...task, ...updateData } })
}

// POST /api/v1/tasks/:taskId/assign
export const assignTask = async (c: any) => {
const db = getDb(c.env.DATABASE_URL)
const taskId = c.req.param('taskId')
const { userId: assigneeId } = c.req.valid('json')

const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)

// Insert into join table (supports multiple assignees if needed)
await db.insert(taskAssignees).values({
taskId,
userId: assigneeId
}).onConflictDoNothing() // Prevent duplicate assignment errors

// Update main task status if it was Unassigned
if (task && task.status === 'Unassigned') {
await db.update(tasks).set({ status: 'Pending' }).where(eq(tasks.id, taskId))
}

await broadcastTaskEvent(c.env.PARTYKIT_HOST, {
type: 'TASK_ASSIGNED',
projectId: task.projectId,
taskId,
assigneeId
})

return c.json({ success: true })
}
File: apps/api/src/routes/task.routes.ts
TypeScript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { requireProjectRole } from '../middleware/rbac'
import \* as taskController from '../controllers/task.controller'
import { TASK_STATUSES } from '@validiant/shared'

const taskRoutes = new Hono()

taskRoutes.use('\*', authenticate)

// Note: requireProjectRole reads `projectId` from the JSON body for POST
taskRoutes.post('/',
requireProjectRole(['manager', 'contributor']),
zValidator('json', z.object({
projectId: z.string().uuid(),
title: z.string().min(1),
pincode: z.string().length(6).optional(),
clientName: z.string().optional(),
address: z.string().optional(),
mapUrl: z.string().url().optional(),
latitude: z.number().optional(),
longitude: z.number().optional(),
})),
taskController.createTask // Implementation similar to updateTaskStatus
)

taskRoutes.put('/:taskId/status',
zValidator('json', z.object({
status: z.enum(TASK_STATUSES),
})),
taskController.updateTaskStatus
)

taskRoutes.post('/:taskId/assign',
zValidator('json', z.object({
userId: z.string().uuid()
})),
taskController.assignTask
)

// Bulk Upload (Accepts normalized JSON array parsed by frontend SheetJS)
taskRoutes.post('/bulk',
requireProjectRole(['manager']),
zValidator('json', z.object({
projectId: z.string().uuid(),
tasks: z.array(z.any()).min(1).max(500) // Defined tightly in shared Zod schemas
})),
taskController.bulkUploadTasks
)

export default taskRoutes
Phase 5 Completion Checklist
[ ] Assigning a task inserts a record into the task_assignees table securely.

[ ] Task status updates strictly obey the VALID_TRANSITIONS state machine.

[ ] All task mutations write detailed audit records to activityLogs.

[ ] PartyKit broadcasts are successfully fired and isolated to the projectId room (so tenants don't see each other's live updates).

[ ] Bulk upload correctly processes JSON arrays via the Edge environment.

PHASE 6 — Elite SaaS Analytics, Audit Logs & Edge Cron
🔄 UPDATED: Tenant-Scoped Analytics + Enterprise Audit Trails

Objective
Implement read-heavy endpoints for dashboard data. In a multi-tenant SaaS, all queries must be strictly scoped by organizationId or projectId to prevent data leaks between clients. This phase also implements the public Contact route using the Resend HTTP API and configures Cloudflare Workers Cron Triggers for background jobs (e.g., SLA calculation).

File: apps/api/src/controllers/analytics.controller.ts
TypeScript
import { eq, and, sql } from 'drizzle-orm'
import { tasks, projects } from '../db/schema'
import { getDb } from '../db'

export const getProjectAnalytics = async (c: any) => {
const db = getDb(c.env.DATABASE_URL)
const projectId = c.req.param('projectId')

// Run all aggregations in parallel to minimize Edge execution time
const [statusCounts, priorityCounts, recentTasks] = await Promise.all([
// 1. Tasks Grouped by Status
db.select({
status: tasks.status,
count: sql<number>`count(${tasks.id})`.mapWith(Number),
})
.from(tasks)
.where(eq(tasks.projectId, projectId))
.groupBy(tasks.status),

    // 2. Tasks Grouped by Priority
    db.select({
      priority: tasks.priority,
      count: sql<number>`count(${tasks.id})`.mapWith(Number),
    })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .groupBy(tasks.priority),

    // 3. Recently completed or verified tasks (Limit 5)
    db.select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      completedAt: tasks.completedAt
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.projectId, projectId),
        sql`${tasks.status} IN ('Completed', 'Verified')`
      )
    )
    .orderBy(sql`${tasks.completedAt} DESC`)
    .limit(5)

])

return c.json({
success: true,
data: {
statusCounts,
priorityCounts,
recentTasks,
// Calculate total dynamically from status array
totalTasks: statusCounts.reduce((acc, curr) => acc + curr.count, 0)
}
})
}
File: apps/api/src/routes/analytics.routes.ts
TypeScript
import { Hono } from 'hono'
import { authenticate } from '../middleware/auth'
import { requireProjectRole } from '../middleware/rbac'
import \* as analyticsController from '../controllers/analytics.controller'

const analyticsRoutes = new Hono()

analyticsRoutes.use('\*', authenticate)

// Get dashboard stats for a specific project
analyticsRoutes.get('/project/:projectId',
requireProjectRole(['manager', 'contributor', 'viewer']),
analyticsController.getProjectAnalytics
)

export default analyticsRoutes
File: apps/api/src/controllers/activity.controller.ts
TypeScript
import { eq, desc } from 'drizzle-orm'
import { activityLogs } from '../db/schema'
import { getDb } from '../db'

export const getOrganizationAuditLogs = async (c: any) => {
const db = getDb(c.env.DATABASE_URL)
const orgId = c.req.param('orgId')

// Basic offset pagination
const page = parseInt(c.req.query('page') || '1')
const limit = parseInt(c.req.query('limit') || '20')
const offset = (page - 1) \* limit

const logs = await db.select()
.from(activityLogs)
.where(eq(activityLogs.organizationId, orgId))
.orderBy(desc(activityLogs.createdAt))
.limit(limit)
.offset(offset)

return c.json({
success: true,
data: logs,
meta: { page, limit }
})
}

// Export Tasks to CSV with SLA Logic
analyticsRoutes.get('/project/:projectId/export',
requireProjectRole(['manager', 'admin']),
async (c) => {
const db = getDb(c.env.DATABASE_URL)
const projectId = c.req.param('projectId')
const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId))

    let csv = "CaseID,ClientName,Pincode,Status,AssignedDate,CompletedDate,SLAStatus\n";

    projectTasks.forEach(t => {
      let slaStatus = "N/A";
      if (t.assignedAt) {
        const endTime = (t.completedAt || new Date()).getTime();
        const hours = (endTime - t.assignedAt.getTime()) / (1000 * 60 * 60);
        slaStatus = hours <= 72 ? "On Time" : "Overdue";
      }
      csv += `"${t.title}","${t.clientName || ''}","${t.pincode}","${t.status}","${t.assignedAt || ''}","${t.completedAt || ''}","${slaStatus}"\n`;
    })

    return c.text(csv, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="validiant-export-${Date.now()}.csv"`
    })

}
)

File: apps/api/src/routes/activity.routes.ts
TypeScript
import { Hono } from 'hono'
import { authenticate } from '../middleware/auth'
import { requireOrgRole } from '../middleware/rbac'
import \* as activityController from '../controllers/activity.controller'

const activityRoutes = new Hono()

activityRoutes.use('\*', authenticate)

// Enterprise Audit Trail: Only Org Owners and Admins can view complete logs
activityRoutes.get('/organization/:orgId',
requireOrgRole(['owner', 'admin']),
activityController.getOrganizationAuditLogs
)

export default activityRoutes
File: apps/api/src/services/email.service.ts
TypeScript
// Edge-native email implementation using Resend HTTP API
// NO nodemailer (incompatible with Cloudflare Workers)

export async function sendEmail(env: Env, to: string, subject: string, html: string) {
try {
const response = await fetch('https://api.resend.com/emails', {
method: 'POST',
headers: {
'Authorization': `Bearer ${env.RESEND_API_KEY}`,
'Content-Type': 'application/json',
},
body: JSON.stringify({
from: env.RESEND_FROM_EMAIL, // e.g., 'Validiant <noreply@validiant.com>'
to,
subject,
html,
}),
})

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend Error:', error)
      return false
    }
    return true

} catch (err) {
console.error('Email send failed:', err)
return false
}
}
File: apps/api/src/routes/contact.routes.ts
TypeScript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { sendEmail } from '../services/email.service'

const contactRoutes = new Hono<{ Bindings: Env }>()

// Public route - No auth required
contactRoutes.post('/',
zValidator('json', z.object({
name: z.string().min(2),
email: z.string().email(),
message: z.string().min(10)
})),
async (c) => {
const { name, email, message } = c.req.valid('json')

    // Send notification to Admin/Support team
    const success = await sendEmail(
      c.env,
      'support@validiant.com', // Your internal support address
      `New Contact from ${name}`,
      `<p><strong>Name:</strong> ${name}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Message:</strong></p>
       <p>${message}</p>`
    )

    if (!success) return c.json({ error: 'Failed to send message' }, 500)

    return c.json({ success: true, message: 'Message sent successfully' })

}
)

export default contactRoutes
File: apps/api/src/index.ts — Adding Cron Triggers
To handle background tasks (like calculating overdue SLAs), use Cloudflare's scheduled export in your main Worker entry point. Ensure wrangler.toml includes: [triggers] crons = ["0 * * * *"] (e.g., hourly).

TypeScript
import app from './app'
import { getDb } from './db'

export default {
// 1. Standard HTTP requests handled by Hono
fetch: app.fetch,

// 2. Scheduled Cron Jobs handled natively by Cloudflare
scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
console.log(`Cron triggered at ${new Date(event.scheduledTime).toISOString()}`)

    // Example: Daily SLA Digest or Auto-Archiving
    // ctx.waitUntil() ensures the worker doesn't die before the promise resolves
    ctx.waitUntil((async () => {
      const db = getDb(env.DATABASE_URL)
      // Logic: SELECT tasks WHERE status = 'Pending' AND createdAt < NOW() - 72 hours
      // Call sendEmail() to notify Project Managers
    })())

}
}
Phase 6 Completion Checklist
[ ] GET /api/v1/analytics/project/:projectId successfully executes parallel Drizzle aggregations.

[ ] Analytics route correctly rejects users without a role in the target Project.

[ ] GET /api/v1/activity/organization/:orgId?page=1&limit=20 returns paginated audit logs.

[ ] Activity logs route rejects users who are not Org Owners or Admins.

[ ] POST /api/v1/contact successfully triggers the Resend API using standard fetch.

[ ] Cloudflare scheduled export is defined in index.ts alongside app.fetch.

---

PHASE 7 — Elite Frontend Foundation & Routing (Next.js 15 App Router)
🔄 FULL REWRITE: Next.js 15 App Router + Edge Middleware + TanStack Query + Zustand

Architecture Decisions (SaaS Routing & State Flow)
Token Storage Strategy:

accessToken → Stored as an httpOnly cookie (or accessible to the client depending on BFF strategy). Set with SameSite=Lax to allow OAuth redirects to function securely.

refreshToken → Strictly httpOnly cookie. The client application never sees this token directly.

Routing Structure:

Auth Routes (/auth/\*): Public routes for Login, Register, Forgot Password. Authenticated users are automatically redirected to the dashboard.

Protected Routes (/dashboard/\*): The core SaaS application (Organizations, Projects, Tasks, Profile). Unauthenticated users are redirected to login.

Data Flow Rules:

Mutations & Queries → TanStack Query (useQuery, useMutation) via Axios instance.

Real-time updates → PartyKit usePartySocket hook → calls queryClient.invalidateQueries().

Global Auth State → Zustand (useAuthStore) hydrated on app load from the BFF or API.

File: apps/web/src/middleware.ts — Edge Middleware
This file runs on the Next.js Edge Runtime before any page renders. It protects your SaaS routes with zero layout flash.

TypeScript
/\*\*

- Next.js Edge Middleware
-
- Server-side authentication check that runs before page rendering.
- Protects routes by verifying HttpOnly cookies at the Edge.
  \*/

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
'/dashboard',
'/projects',
'/tasks',
'/organizations',
'/profile',
'/settings',
];

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

function matchesRoute(pathname: string, routes: string[]): boolean {
return routes.some((route) => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
const { pathname } = request.nextUrl;

// Get authentication cookie
const accessToken = request.cookies.get('accessToken');
const isAuthenticated = !!accessToken;

const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

// Redirect unauthenticated users from protected routes to login
if (isProtectedRoute && !isAuthenticated) {
const loginUrl = new URL('/auth/login', request.url);
loginUrl.searchParams.set('from', pathname);
return NextResponse.redirect(loginUrl);
}

// Redirect authenticated users from auth pages to dashboard
if (isAuthRoute && isAuthenticated) {
const fromParam = request.nextUrl.searchParams.get('from');
const dashboardUrl = new URL(
fromParam && fromParam.startsWith('/') ? fromParam : '/dashboard',
request.url
);
return NextResponse.redirect(dashboardUrl);
}

return NextResponse.next();
}

export const config = {
matcher: [
'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
],
};
File: apps/web/src/store/auth.ts — Zustand Store
TypeScript
'use client'
import { create } from 'zustand'

export type AuthUser = {
id: string
email: string
fullName: string
avatarUrl?: string
role: string // System role (e.g., 'user', 'superadmin')
}

type AuthStore = {
user: AuthUser | null
isAuthenticated: boolean
isLoading: boolean
setAuth: (user: AuthUser) => void
clearAuth: () => void
setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
user: null,
isAuthenticated: false,
isLoading: true,
setAuth: (user) => set({ user, isAuthenticated: true, isLoading: false }),
clearAuth: () => set({ user: null, isAuthenticated: false, isLoading: false }),
setLoading: (loading) => set({ isLoading: loading }),
}))
File: apps/web/src/lib/api.ts — Axios Interceptor Client
TypeScript
import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787/api/v1'

export const apiClient = axios.create({
baseURL: API_BASE,
headers: { 'Content-Type': 'application/json' },
withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
})

apiClient.interceptors.response.use(
(res) => res,
async (error) => {
// Silent token refresh flow on 401 Unauthorized
if (error.response?.status === 401 && !error.config.\_retry) {
error.config.\_retry = true
try {
// Assume backend relies on HttpOnly refresh token cookie
await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
// If successful, retry the original failed request
return apiClient(error.config)
} catch {
// Refresh failed, user must log in again
window.location.href = '/auth/login'
}
}
return Promise.reject(error)
}
)
File: apps/web/src/components/providers/Providers.tsx
TypeScript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { AuthStoreInitializer } from './AuthStoreInitializer'

export function Providers({ children }: { children: ReactNode }) {
const [queryClient] = useState(() => new QueryClient({
defaultOptions: {
queries: {
staleTime: 30 \* 1000,
retry: 1,
refetchOnWindowFocus: true,
},
},
}))

return (
<QueryClientProvider client={queryClient}>
<AuthStoreInitializer /> {/_ Hydrates user state on mount _/}
{children}
{process.env.NODE_ENV === 'development' && (
<ReactQueryDevtools initialIsOpen={false} />
)}
</QueryClientProvider>
)
}
File: apps/web/src/app/layout.tsx — Root Layout
TypeScript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers/Providers'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
title: 'Validiant - Enterprise Project Management',
description: 'Manage organizations, projects, and field tasks seamlessly.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (

<html lang="en" className="dark">
<body className={`${inter.className} bg-[#0f1117] text-white min-h-screen`}>
<Providers>
{children}
</Providers>
</body>
</html>
)
}
File: apps/web/src/app/page.tsx — Root Redirect
TypeScript
import { redirect } from 'next/navigation'

export default function RootPage() {
// Edge middleware handles cookie validation.
// Base domain simply redirects to the main app interface.
redirect('/dashboard')
}
Phase 7 Completion Checklist
[ ] middleware.ts successfully blocks unauthenticated access to all /dashboard/\* routes.

[ ] Authenticated users visiting /auth/login are automatically bounced to /dashboard.

[ ] API calls via apiClient automatically attach cookies (withCredentials: true).

[ ] On a 401 error, Axios interceptor silently calls /auth/refresh and retries the request without dropping the UI state.

[ ] TanStack Query Devtools run properly in the development environment.

[ ] Zero TypeScript errors across all routing and state files.\*\*\*

PHASE 8 & 9 — Elite SaaS Web Dashboards (Unified RBAC UI)
🔄 FULL REWRITE: Unified /dashboard with Dynamic RBAC

Objective
Replace the fragmented, hardcoded role pages (/admin, /employee) with a unified SaaS dashboard. Every user accesses the same core routes (/dashboard/organizations, /dashboard/projects, /dashboard/tasks). The UI components (buttons, dropdowns, forms) render conditionally based on the user's exact permissions within that specific Organization or Project.

File: apps/web/src/hooks/useRBAC.ts
TypeScript
'use client'
import { useAuthStore } from '@/store/auth'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// Hook to check permissions dynamically in the UI
export function useRBAC(organizationId?: string, projectId?: string) {
const { user } = useAuthStore()

const { data: orgRole } = useQuery({
queryKey: ['orgRole', organizationId, user?.id],
queryFn: () => apiClient.get(`/organizations/${organizationId}/role`).then(r => r.data.role),
enabled: !!organizationId && !!user,
})

const { data: projectRole } = useQuery({
queryKey: ['projectRole', projectId, user?.id],
queryFn: () => apiClient.get(`/projects/${projectId}/role`).then(r => r.data.role),
enabled: !!projectId && !!user,
})

return {
isSuperAdmin: user?.role === 'superadmin',
isOrgOwner: orgRole === 'owner',
isOrgAdmin: orgRole === 'admin' || orgRole === 'owner',
isProjectManager: projectRole === 'manager',
canEditTask: projectRole === 'manager' || projectRole === 'contributor',
}
}
Dashboard Pages Structure
/dashboard/organizations (Organizations List):

Data: Fetches all organizations the user belongs to.

UI: Grid of Organization Cards.

RBAC: "Create New Organization" button is visible to all users (creates an org where they become the 'owner').

/dashboard/projects (Projects List):

Data: Fetches projects across the user's active organization context.

RBAC: "New Project" button is wrapped in if (isOrgAdmin). Standard members only see the projects they have been invited to.

/dashboard/tasks (Unified Task Board/List):

Data: Fetches tasks assigned to the user OR all tasks in a project if the user is a manager.

UI: Features a Kanban board or a Sortable Table. Includes a "Sort by GPS Proximity" button (using navigator.geolocation and Haversine distance from @validiant/shared) for field workers.

RBAC: - "Assign Task" / "Bulk Upload" buttons visible only if isProjectManager.

Task Status dropdown strictly filters to VALID_TRANSITIONS and is disabled if the user is merely a viewer.

/dashboard/profile (User Settings & Passkeys):

UI: User avatar upload, name, and notification preferences.

Security: "Register Passkey" button that triggers the WebAuthn flow via @simplewebauthn/browser, allowing the user to add FaceID/TouchID to their account.

File: apps/web/src/app/dashboard/tasks/page.tsx (Client Pattern)
TypeScript
'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useRBAC } from '@/hooks/useRBAC'
import { usePartySocket } from '@/hooks/useProjectRealtime'

export default function TasksPage({ searchParams }: { searchParams: { projectId: string } }) {
const projectId = searchParams.projectId
const { isProjectManager, canEditTask } = useRBAC(undefined, projectId)

// Real-time listener: invalidates the 'tasks' query when PartyKit broadcasts an update
usePartySocket(projectId)

const { data: tasks, isLoading } = useQuery({
queryKey: ['tasks', projectId],
queryFn: () => apiClient.get(`/tasks?projectId=${projectId}`).then(r => r.data),
enabled: !!projectId
})

if (isLoading) return <LoadingSpinner />

return (

<div className="p-6">
<div className="flex justify-between items-center mb-6">
<h1 className="text-2xl font-bold">Tasks</h1>
{isProjectManager && (
<div className="flex gap-2">
<button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Bulk Upload</button>
<button className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">New Task</button>
</div>
)}
</div>
{/_ Task List / Board Components go here, passing 'canEditTask' as a prop _/}
<TaskBoard tasks={tasks} readOnly={!canEditTask} />
</div>
)
}
PHASE 10 — Production Hardening & Rate Limiting
🔄 UPDATED: Edge-Native Rate Limiting for SaaS Routes

Objective
Protect the API from abuse using Upstash Redis sliding window rate limits, appropriately scoped for different authentication flows (OAuth vs standard).

File: apps/api/src/middleware/rateLimit.ts
TypeScript
import { createMiddleware } from 'hono/factory'
import { getRedis } from '../config/redis.config'
import type { Env } from '../index'

export function rateLimit(options: { requests: number, windowSeconds: number, prefix: string }) {
return createMiddleware<{ Bindings: Env }>(async (c, next) => {
const redis = getRedis(c.env)
const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
const key = `${options.prefix}:${ip}`

    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, options.windowSeconds)

    if (count > options.requests) {
      const ttl = await redis.ttl(key)
      c.header('Retry-After', String(ttl))
      return c.json({ error: `Rate limit exceeded. Try again in ${ttl}s` }, 429)
    }

    c.header('X-RateLimit-Limit', String(options.requests))
    c.header('X-RateLimit-Remaining', String(Math.max(0, options.requests - count)))

    await next()

})
}
Apply in apps/api/src/app.ts:

TypeScript
import { rateLimit } from './middleware/rateLimit'

// Stricter limit on standard email/password logins to prevent brute force
app.use('/api/v1/auth/login', rateLimit({ requests: 5, windowSeconds: 900, prefix: 'rl:auth' }))

// Passkeys and OAuth have standard API limits (less susceptible to simple brute force)
app.use('/api/v1/passkey/\*', rateLimit({ requests: 20, windowSeconds: 60, prefix: 'rl:passkey' }))

// General SaaS API routes
app.use('/api/v1/\*', rateLimit({ requests: 200, windowSeconds: 60, prefix: 'rl:api' }))
PHASE 11 — Mobile Application (Expo React Native)
🔄 UPDATED: Expo Router v4 + SaaS Tabs Architecture

Objective
Build the Expo app in apps/app to consume the new SaaS API. The app uses expo-secure-store for JWTs and mirrors the web's multi-tenant architecture using bottom tabs: Organizations, Projects, Tasks, and Profile.

Mobile Dependency Overview
Storage: expo-secure-store (Device keychain encryption)

- **Offline Resilience:** `@tanstack/query-async-storage-persister` combined with NetInfo. If a field worker updates a task status without cellular service, the mutation is queued in the device keychain and automatically syncs when the connection is restored.

Routing: expo-router

Data Fetching: Axios + TanStack Query

Real-time: partysocket

Location: expo-location (For GPS sorting of field tasks)

File: apps/app/app/(tabs)/\_layout.tsx — SaaS Tab Layout
TypeScript
import { Tabs } from 'expo-router'
import { Home, Folder, CheckSquare, User } from 'lucide-react-native'

export default function TabLayout() {
return (
<Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#12141f', borderTopColor: '#2a2d3e' },
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#8b8fa8',
    }}>
<Tabs.Screen
name="organizations"
options={{ title: 'Orgs', tabBarIcon: ({ color }) => <Home color={color} size={24} /> }}
/>
<Tabs.Screen
name="projects"
options={{ title: 'Projects', tabBarIcon: ({ color }) => <Folder color={color} size={24} /> }}
/>
<Tabs.Screen
name="tasks"
options={{ title: 'My Tasks', tabBarIcon: ({ color }) => <CheckSquare color={color} size={24} /> }}
/>
<Tabs.Screen
name="profile"
options={{ title: 'Profile', tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
/>
{/_ Hidden index route redirects to tasks or orgs based on state _/}
<Tabs.Screen name="index" options={{ href: null }} />
</Tabs>
)
}
File: apps/app/app/(tabs)/tasks.tsx — Field Worker GPS Screen
TypeScript
import { useState, useMemo, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import \* as Location from 'expo-location'
import { apiClient } from '../../src/services/api'
import { useAuthStore } from '../../src/store/auth'
import PartySocket from 'partysocket'
import { haversineDistance } from '@validiant/shared'

export default function TasksScreen() {
const { user } = useAuthStore()
const queryClient = useQueryClient()
const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
const [sortMode, setSortMode] = useState<'default' | 'gps'>('default')

// Real-time PartyKit connection for Mobile
useEffect(() => {
if (!user?.id) return;

    const socket = new PartySocket({
      host: process.env.EXPO_PUBLIC_PARTYKIT_HOST!,
      room: `user_${user.id}`, // Connect to user-specific room instead of global_tasks
      party: 'tasks',
    })
    socket.addEventListener('message', () => {
      queryClient.invalidateQueries({ queryKey: ['mobile_tasks', user.id] })
    })
    return () => socket.close()

}, [user?.id])

const { data: tasks = [] } = useQuery({
queryKey: ['mobile_tasks', user?.id],
queryFn: () => apiClient.get(`/tasks/my-tasks`).then(r => r.data)
})

async function handleGPSSort() {
const { status } = await Location.requestForegroundPermissionsAsync()
if (status !== 'granted') return alert('Location permission denied')
const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
setSortMode('gps')
}

const displayTasks = useMemo(() => {
if (sortMode === 'gps' && userLocation) {
return [...tasks].sort((a, b) => {
if (!a.latitude) return 1
if (!b.latitude) return -1
return haversineDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude) - haversineDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
})
}
return tasks
}, [tasks, sortMode, userLocation])

return (
<View style={{ flex: 1, backgroundColor: '#0f1117' }}>
<View style={{ padding: 16, paddingTop: 50, backgroundColor: '#12141f' }}>
<Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Assigned Tasks</Text>
<TouchableOpacity onPress={handleGPSSort} style={{ marginTop: 12, backgroundColor: '#3b82f6', padding: 8, borderRadius: 8 }}>
<Text style={{ color: 'white', textAlign: 'center' }}>📍 Sort by Proximity</Text>
</TouchableOpacity>
</View>
<FlatList
data={displayTasks}
keyExtractor={item => item.id}
renderItem={({ item }) => (
<View style={{ padding: 16, margin: 16, backgroundColor: '#1a1d2e', borderRadius: 8 }}>
<Text style={{ color: 'white', fontWeight: 'bold' }}>{item.title}</Text>
<Text style={{ color: '#8b8fa8' }}>{item.clientName} • Pincode: {item.pincode}</Text>
<Text style={{ color: '#3b82f6', marginTop: 8 }}>Status: {item.status}</Text>
</View>
)}
/>
</View>
)
}
Phase 8-11 Completion Checklist
[ ] Web Dashboards successfully share UI components but restrict actions via useRBAC checking API roles.

[ ] Redis sliding-window rate limiting successfully restricts /auth/login to 5 attempts per 15 minutes.

[ ] Expo React Native app compiles without errors (pnpm --filter @validiant/app start).

[ ] Mobile app tab navigation accurately points to organizations.tsx, projects.tsx, tasks.tsx, and profile.tsx.

[ ] Mobile GPS sorting relies on expo-location and reorders the list natively without making a backend request.

PHASE 12 — Dynamic Tenant Dashboards & White-Labeling
Objective: Allow different organizations to have completely different dashboard layouts, feature toggles, and branding for their employees without altering the core backend logic.

Implementation Strategy (Zero-Disruption)
Database Storage: Utilize the existing settings JSONB column in the organizations table to store UI schemas.

API Delivery: When a user logs in and selects an organization context, the API delivers the settings object.

Frontend Rendering: Next.js uses a DashboardRenderer component to map the JSON configuration to actual React components.

File: packages/shared/src/schemas/organization.schemas.ts (Update)
TypeScript
import { z } from 'zod'

// Define the shape of the dynamic dashboard configuration
export const orgSettingsSchema = z.object({
theme: z.object({
primaryColor: z.string().default('#3b82f6'),
logoUrl: z.string().optional(),
isDarkMode: z.boolean().default(true),
}),
features: z.object({
enableTimeTracking: z.boolean().default(false),
enableClientSignatures: z.boolean().default(false),
enableMapRouting: z.boolean().default(true),
}),
employeeDashboardLayout: z.enum(['field-ops', 'minimal', 'kanban', 'data-heavy']).default('field-ops'),
})
File: apps/web/src/app/dashboard/page.tsx (Dynamic Renderer)
TypeScript
'use client'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { FieldOpsDashboard } from '@/components/dashboards/FieldOpsDashboard'
import { MinimalDashboard } from '@/components/dashboards/MinimalDashboard'

export default function DynamicEmployeeDashboard() {
const { user } = useAuthStore()

const { data: org, isLoading } = useQuery({
queryKey: ['currentOrgSettings'],
queryFn: () => apiClient.get(`/organizations/current`).then(r => r.data),
})

if (isLoading) return <LoadingSpinner />

// Decide UI based on Industry Type (Defaults to BGV layout)
const industry = org?.industryType || 'bgv'

return (

<div className="bg-slate-50 min-h-screen">
{industry === 'bgv' && <BGVDashboard settings={org.settings} />}
{industry === 'logistics' && <LogisticsDashboard settings={org.settings} />}
{/_ Fallback to standard SaaS minimal layout _/}
{!['bgv', 'logistics'].includes(industry) && <MinimalDashboard settings={org.settings} />}
</div>
)
}

### Elite UX/UI Specification (Tailwind "Slate" Theme)

When organizations are created, they select an `industryType`. For now, all default to `bgv`. The frontend uses this to dynamically render the dashboard layout while maintaining an "Above Elite Level" butter-smooth user experience.

**Global BGV Layout (Legacy-Inspired):**

- **Sidebar:** Dark slate (`bg-slate-900 text-white`). Active links use `bg-slate-800 border-l-4 border-sky-400`.
- **Admin Dashboard:** 3 top metric cards (Total, Completed, Pending) using `bg-white p-6 shadow` with thick left borders (`border-blue-500`, `border-green-500`, `border-yellow-500`).
- **Map URL Input:** A simple optional input. When a user pastes a Google Maps link, the Next.js frontend silently parses the Regex to extract `latitude` and `longitude` in the background.

**Web Dashboard UX (Slide-Overs & Optimistic UI):**

- **No Blocking Modals:** When clicking a task in the feed (`max-w-2xl mx-auto`), a sleek **Right-Side Drawer (Slide-over)** opens. This allows users to view task details, add comments (Phase 14), and change status without losing context of the list.
- **Optimistic Updates:** Using TanStack Query's `onMutate`, when an employee updates a status, the UI changes instantly while the API request processes in the background.

**Mobile App UX (Expo Bottom Sheets & Gestures):**

- **Bottom Sheets:** Replacing standard modals, clicking a task card on mobile opens a native `@gorhom/bottom-sheet`. It feels incredibly smooth and can be swiped away to close.
- **Swipe Actions:** Implemented via `react-native-gesture-handler`. Field workers can swipe right on a task card in the list to instantly trigger the "Complete" mutation.

PHASE 13 — Advanced Field Operations (Geofencing & E-Signatures)
Objective: Capitalize on device-native features in the Expo app to provide high-value tracking for field workers without adding backend complexity.

- **Vehicle Routing Problem (VRP) Engine (OpenRouteService):**
  - **Logic:** Upgrade the simple Haversine proximity sort by integrating the `OpenRouteService` API. Create an Edge route `POST /api/v1/tasks/optimize` that accepts the worker's current GPS and an array of task coordinates. It queries the ORS API using the `driving-car` profile to return the most mathematically efficient delivery sequence.

Geofence Smart Prompts (expo-location): \* Logic: The mobile app tracks location in the background. When the distance between userLocation and task.latitude/longitude drops below 100 meters, a local notification fires: "You've arrived at the job site. Check in?"

Proof of Work E-Signatures:

Logic: Add a react-native-signature-canvas component to the Task Completion modal. When the client signs, convert the signature to a Base64 string and save it to a new customFields JSON property on the task before hitting the PUT /api/v1/tasks/:id/status endpoint.

PHASE 14 — Enterprise Storage & Communication
Objective: Keep communication and files inside the Validiant ecosystem to prevent clients from needing third-party tools.

Task Comments & @Mentions:

Logic: Create a new Drizzle table task_comments (id, taskId, userId, content, createdAt). Add a simple GET/POST route. The UI parses @username to highlight mentions.

Zero-Cost File Attachments (Cloudflare R2):

Logic: Cloudflare R2 is an S3-compatible storage solution with zero egress fees. Implement an Edge route that uses the AWS SDK getSignedUrl function. The frontend requests a presigned URL and uploads photos/documents directly to the R2 bucket, saving the final URL in the task's database record.

PHASE 15 — Automations, Alerts & Webhooks
Objective: Make Validiant the central nervous system for organizational workflows.

Mobile Push Notifications:

Logic: Store an expoPushToken on the user record. When POST /api/v1/tasks/:taskId/assign is triggered, the Hono API makes a direct fetch to https://exp.host/--/api/v2/push/send to alert the employee instantly.

Outgoing Webhooks:

Logic: Add a webhookUrl to the organizations.settings JSONB. When a task hits Completed in the state machine, fire a fetch(org.settings.webhookUrl, { method: 'POST', body: taskData }) in a non-blocking ctx.waitUntil() wrapper. This lets clients integrate with Zapier or Make.com easily.

SLA Alerts (Cloudflare Cron):

Logic: Expand the Cron Trigger from Phase 6. Every hour, query tasks where status = Pending and createdAt is older than the Org's defined SLA timeframe. Fire an email via Resend to the Project Manager.

PHASE 16 — Edge AI & Ecosystem API
Objective: Introduce powerful AI features for free and open the platform to enterprise developers.

Task Auto-Summarization (Cloudflare Workers AI):

Logic: Utilize Cloudflare's free built-in @cloudflare/ai binding. Add a "Summarize" button to tasks with long comment threads. The Edge worker passes the comments to the llama-3 model and returns a 3-bullet-point summary.

Public API Documentation (Swagger):

Logic: Wrap your existing Hono routes with @hono/zod-openapi. This automatically reads your Zod schemas and generates a public, interactive Swagger UI documentation page at api.validiant.com/docs.

- **Smart Data Importer (SheetJS & Column Mapper):**
  - **Logic:** Build a unified import system using `SheetJS`. Users can upload Excel/CSV files or paste raw delimited text. The system runs a "Smart Column Mapper" using synonym matching to dynamically map client data (e.g., automatically mapping "Request ID", "Case", or "Ticket" to the `title` field, and "Pin", "Postal" to `pincode`) without forcing the client to use a strict template.
  - _(Note: Image/OCR extraction is strictly excluded from this pipeline to maintain data absolute accuracy)._

PHASE 17 — KYC & Background Verification (Didit Integration)
Objective: Allow BGV (Background Verification) agencies and clients to securely request KYC/AML identity verification from candidates. The system uses Didit's free tier to generate a verification session, emails the secure link to the candidate, and listens for a webhook to automatically close the case upon successful verification.

Architecture & Data Flow
Trigger: A Manager clicks "Request KYC" on a Candidate Task.

API Call: The Edge Worker calls the Didit API to generate a unique session_id and verification_url.

Delivery: The Edge Worker uses the existing Resend setup (Phase 6) to email the verification_url directly to the candidate.

Webhook: Once the candidate completes the KYC on their phone, Didit fires a POST request to Validiant.

Resolution: Validiant verifies the webhook signature, updates the Task to Verified, and logs the action in the Enterprise Audit Trail.

File: packages/shared/src/schemas/kyc.schemas.ts
TypeScript
import { z } from 'zod'

export const kycRequestSchema = z.object({
taskId: z.string().uuid(),
candidateEmail: z.string().email(),
candidateName: z.string().min(2),
})
File: apps/api/src/services/didit.service.ts
TypeScript
// Edge-native Didit Integration Service
import type { Env } from '../index'

export async function createDiditSession(env: Env, referenceId: string) {
// Call Didit's API to generate a verification link for the candidate
// referenceId maps back to the Validiant Task ID
const response = await fetch('https://apx.didit.me/v1/session/', {
method: 'POST',
headers: {
'Authorization': `Bearer ${env.DIDIT_API_KEY}`,
'Content-Type': 'application/json'
},
body: JSON.stringify({
vendor_data: referenceId, // Store the Task ID here so the webhook knows what to update
callback: `${env.API_BASE_URL}/api/v1/webhooks/didit`,
features: "kyc" // Requesting standard free KYC
})
})

if (!response.ok) {
throw new Error('Failed to generate Didit session')
}

return response.json() // Returns { session_id, url }
}
File: apps/api/src/routes/kyc.routes.ts
TypeScript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { authenticate } from '../middleware/auth'
import { requireProjectRole } from '../middleware/rbac'
import { getDb } from '../db'
import { tasks } from '../db/schema'
import { logActivity } from '../utils/activity'
import { sendEmail } from '../services/email.service'
import { createDiditSession } from '../services/didit.service'
import { kycRequestSchema } from '@validiant/shared'

const kycRoutes = new Hono<{ Bindings: Env }>()

// 1. Initiate KYC (Protected SaaS Route)
kycRoutes.post('/request',
authenticate,
requireProjectRole(['manager']), // Ensure only managers can trigger KYC
zValidator('json', kycRequestSchema),
async (c) => {
const { taskId, candidateEmail, candidateName } = c.req.valid('json')
const db = getDb(c.env.DATABASE_URL)
const user = c.var.user

    try {
      // 1. Generate the Didit link
      const diditSession = await createDiditSession(c.env, taskId)

      // 2. Save the session ID in the task's custom fields for tracking
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
      const currentCustomFields = task.customFields || {}

      await db.update(tasks).set({
        status: 'Pending', // Move task to pending while waiting for candidate
        customFields: {
          ...currentCustomFields,
          diditSessionId: diditSession.session_id,
          candidateEmail
        }
      }).where(eq(tasks.id, taskId))

      // 3. Email the Candidate using Resend
      await sendEmail(
        c.env,
        candidateEmail,
        'Action Required: Complete your Background Verification',
        `<p>Hello ${candidateName},</p>
         <p>Please complete your identity verification by clicking the secure link below:</p>
         <a href="${diditSession.url}" style="padding: 10px; background: #3b82f6; color: white;">Verify Identity</a>`
      )

      // 4. Log the Audit Trail
      await logActivity(db, {
        userId: user.id,
        action: 'KYC_REQUESTED',
        entityId: taskId,
        entityType: 'task',
        details: `KYC link sent to ${candidateEmail}`
      })

      return c.json({ success: true, message: 'KYC Request sent to candidate' })

    } catch (error) {
      return c.json({ error: 'Failed to initiate KYC' }, 500)
    }

}
)

export default kycRoutes

// File: apps/api/src/routes/webhook.routes.ts
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { tasks } from '../db/schema'
import { logActivity } from '../utils/activity'
import { broadcastTaskEvent } from '../utils/partykit'

const webhookRoutes = new Hono<{ Bindings: Env }>()

async function verifyDiditSignature(payload: string, signature: string, secret: string) {
const encoder = new TextEncoder();
const key = await crypto.subtle.importKey(
'raw', encoder.encode(secret),
{ name: 'HMAC', hash: 'SHA-256' },
false, ['verify']
);

const signatureBytes = new Uint8Array(
signature.match(/[\da-f]{2}/gi)?.map(h => parseInt(h, 16)) || []
);

return await crypto.subtle.verify(
'HMAC', key, signatureBytes, encoder.encode(payload)
);
}

// 2. Didit Callback Webhook (Secured by HMAC Signature)
webhookRoutes.post('/didit', async (c) => {
const signature = c.req.header('X-Didit-Signature');
const rawBody = await c.req.text();

if (!signature || !(await verifyDiditSignature(rawBody, signature, c.env.DIDIT_WEBHOOK_SECRET))) {
return c.json({ error: 'Invalid signature' }, 401);
}

const payload = JSON.parse(rawBody);
const db = getDb(c.env.DATABASE_URL)

const taskId = payload.vendor_data
const status = payload.status

const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
if (!task) return c.json({ error: 'Task not found' }, 404)

if (status === 'Approved') {
// Merge the detailed biometric report into customFields
const currentCustomFields = task.customFields || {}
const updatedCustomFields = {
...currentCustomFields,
faceMatchScore: payload.decision?.face_match_score || null,
livenessStatus: payload.decision?.liveness || null,
estimatedAge: payload.decision?.estimated_age || null,
ipRiskLevel: payload.decision?.ip_risk || null,
}

    await db.update(tasks).set({
      status: 'Verified',
      verifiedAt: new Date()
    }).where(eq(tasks.id, taskId))

    await logActivity(db, {
      userId: task.createdById,
      action: 'KYC_APPROVED',
      entityId: taskId,
      entityType: 'task',
      details: 'Candidate successfully passed Didit Identity Verification.'
    })

    await broadcastTaskEvent(c.env.PARTYKIT_HOST, {
      type: 'TASK_STATUS_CHANGED',
      projectId: task.projectId,
      taskId: taskId,
      status: 'Verified'
    })

}

return c.json({ received: true })
})

export default webhookRoutes

Phase 17 Completion Checklist
[ ] Add DIDIT_API_KEY to wrangler.toml and secrets.

[ ] Ensure POST /api/v1/kyc/request successfully creates a Didit session and fires a Resend email.

[ ] Webhook route POST /api/v1/webhooks/didit successfully parses the vendor_data to locate the correct Task ID.

[ ] Webhook successfully transitions the task status to Verified and triggers the PartyKit real-time update on the frontend.

[ ] Add a "Request KYC" button to the Task Detail Modal in the React frontend (apps/web/src/components/tasks/TaskModal.tsx).

PHASE 18 — High-Precision Geocoding Engine (Nominatim + Confidence Scoring)
🚨 HIGH PRIORITY: Field Service Location Accuracy & Fallbacks

Objective: Implement a completely free, 6-layer geocoding pipeline using OpenStreetMap/Nominatim to achieve 94–96% usable accuracy within a 300-meter tolerance. Tasks are automatically assigned confidence scores, allowing managers to safely automate dispatching or manually intervene when necessary.

1. Database Schema Updates (Add to Phase 2 tasks table)
   Add these columns to your tasks table to track confidence and prompt field workers.

TypeScript
// PHASE 18: Advanced Geocoding Fields
geocodeConfidence: integer('geocode_confidence'), // 0 to 100
geocodeMatchLevel: varchar('geocode_match_level', { length: 50 }), // 'rooftop', 'street', 'postal', 'city', 'failed'
locationWarning: text('location_warning'), // e.g., "Address approximate. Verify on site." 2. File: apps/api/src/services/geocode.service.ts
TypeScript
// Edge-native Geocoding Pipeline (Nominatim + Fallbacks)
export interface GeoResult {
latitude: number | null;
longitude: number | null;
matchLevel: 'rooftop' | 'street' | 'postal' | 'city' | 'failed';
confidence: number;
}

export async function geocodeAddress(rawAddress: string, pincode?: string): Promise<GeoResult> {
// 1. Normalization
const normalized = rawAddress
.replace(/st\.?/gi, 'Street')
.replace(/ave\.?/gi, 'Avenue')
.trim();

// 2. Structured Query (Nominatim)
const baseUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1`;

// 3. Tiered Fallback Approach
const queries = [
`${baseUrl}&street=${encodeURIComponent(normalized)}&postalcode=${pincode}`, // Tier 1: Exact
`${baseUrl}&q=${encodeURIComponent(normalized)}`, // Tier 2: General Street
`${baseUrl}&postalcode=${pincode}`, // Tier 3: Postal Code Centroid
];

for (const query of queries) {
const res = await fetch(query, { headers: { 'User-Agent': 'ValidiantApp/1.0' } });
const data = await res.json();

    if (data && data.length > 0) {
      const match = data[0];
      const type = match.addresstype; // e.g., 'building', 'highway', 'postcode'

      // 4. Compute Confidence Score
      let matchLevel: GeoResult['matchLevel'] = 'failed';
      let confidence = 0;

      if (['building', 'house'].includes(type)) {
        matchLevel = 'rooftop'; confidence = 95;
      } else if (['highway', 'residential', 'street'].includes(type)) {
        matchLevel = 'street'; confidence = 75;
      } else if (type === 'postcode') {
        matchLevel = 'postal'; confidence = 65;
      } else {
        matchLevel = 'city'; confidence = 40;
      }

      return {
        latitude: parseFloat(match.lat),
        longitude: parseFloat(match.lon),
        matchLevel,
        confidence
      };
    }

}

return { latitude: null, longitude: null, matchLevel: 'failed', confidence: 0 };
}

// 5. Policy-Based Assignment Logic
export function applyGeoPolicy(geo: GeoResult) {
if (geo.confidence >= 85) return { autoAssign: true, warning: null };
if (geo.confidence >= 60) return { autoAssign: true, warning: "Address is approximate (Street/Postal match). Verify on site." };
return { autoAssign: false, warning: "Low accuracy. Manual pin drop required." };
} 3. UI Implementation Specs (Next.js & Expo)
Web Dashboard: Add a visual badge next to the task location:

🟢 Confidence > 85% (Auto-Assigned)

🟡 Confidence 60-84% (Yellow Warning Icon - Needs Verification)

🔴 Confidence < 60% (Red Alert - Requires Manager to drop a pin on a MapLibre map)

Mobile App (apps/app/(tabs)/tasks.tsx): If a task has locationWarning != null, render a highly visible yellow banner at the top of the task card: "⚠️ The address is approximate. Please confirm your exact location upon arrival."

PHASE 19 — Enterprise Billing, Time Tracking & Full-Text Search
Objective: Equip organizations with native tools to track field-worker hours, generate automated PDF invoices, and search thousands of records instantly using native PostgreSQL features instead of paid services like Algolia.

Time Tracking:

Schema: Create time_entries (id, taskId, userId, startTime, endTime, duration).

Mobile UX: Add a "Start Timer" button to the Task Bottom Sheet in Expo. Hitting stop calculates duration and syncs to the DB.

Invoice Generation (react-pdf + Resend):

Logic: Create a route POST /api/v1/projects/:projectId/invoice. The Hono API aggregates completed tasks and time_entries for the month, uses @react-pdf/renderer (running in a Node.js compatible Worker or BFF) to generate a PDF, saves it to Cloudflare R2, and emails the presigned link to the client via Resend.

Advanced Full-Text Search (PostgreSQL tsvector):

Logic: Avoid Algolia. Add a search_vector column to the tasks table using Drizzle. Update the GET /tasks route to use to_tsquery() against title, description, and clientName, returning ranked results. It scales easily to hundreds of thousands of tasks for free.

PHASE 20 — Workspace Customization & Communications
Objective: Increase stickiness by allowing clients to customize their dashboards and communicate entirely within the platform.

Custom Dashboards (react-grid-layout):

Logic: In organizations.settings JSONB, save an array of widget configurations (x, y, w, h, widgetType). Users can drag-and-drop a "Pie Chart (Status)", "Recent Activity Feed", or "Overdue SLA List".

In-App Notifications (PartyKit + Bell Icon):

Logic: Create a notifications table (userId, type, content, isRead). When a task is assigned, the backend inserts a row and fires a PartyKit WebSockets message to user\_${assigneeId}. The frontend bell icon instantly increments the red counter.

Custom Forms (react-hook-form + JSONB):

Logic: Allow Admins to create drag-and-drop inspection checklists. The schema is stored in the DB. When a field worker opens a task, Expo renders the dynamic form. Answers are saved as a JSON object in the tasks.customFields column.

In-App Voice/Video Calls (Jitsi Meet):

Logic: Avoid Twilio costs. Integrate the free Jitsi React SDK into a Slide-Over drawer. Managers can instantly initiate a "Live Site Verification" video call with field workers without leaving the Validiant dashboard.

PHASE 21 — Automations, Insights & Enterprise Security
Objective: The final layer to close Enterprise deals—offering Zapier-like internal automation, deep analytics, self-serve backups, and SSO.

Validiant Workflows (Zapier Clone):

Logic: Create an automations table (orgId, trigger_event, conditions_json, action_type, action_payload).

Example: Trigger: Task Completed. Condition: Priority == Urgent. Action: Send Email to CEO. Cloudflare Workers execute these natively.

Automated R2 Backups:

Logic: Using a Cloudflare Cron Trigger, query all tasks and activity_logs for Enterprise organizations, convert them to CSV/JSON, and dump them into a dedicated Cloudflare R2 bucket. Provide a "Download Monthly Backup" button in the dashboard.

Multi-Language Support (i18n):

Logic: Implement next-i18next for Web and i18n-js for Expo. Store translations in local JSON files. Perfect for non-English speaking field workers.

Enterprise SSO (SAML 2.0 / OIDC):

Logic: Use samlify or a Cloudflare Worker compatible OIDC library. Add an "Enterprise Login" button that redirects to Okta/Azure AD, validating the token and returning an Edge JWT.

## Full Dependency Install Commands (Run Once)

```bash
# From repo root
pnpm install

# Generate and push DB schema
pnpm db:generate
pnpm db:push

# Set all CF Worker secrets (run each line separately)
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put UPSTASH_REDIS_REST_URL
wrangler secret put UPSTASH_REDIS_REST_TOKEN
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put DIDIT_API_KEY
wrangler secret put DIDIT_WEBHOOK_SECRET
wrangler secret put DIDIT_WEBHOOK_SECRET
wrangler secret put ORS_API_KEY

# Deploy PartyKit (before deploying API — API needs PARTYKIT_HOST)
pnpm --filter @validiant/party deploy

# Deploy CF Worker API
pnpm --filter @validiant/api deploy

# Deploy Next.js web (Vercel recommended)
pnpm --filter @validiant/web build

# Build Expo app
pnpm --filter @validiant/app android   # or ios
```

---

## Phase Execution Order (Non-negotiable)

```
Phase 1  → Phase 2  → Phase 3  → Phase 4  → Phase 5  → Phase 6
   ↓
Phase 7  → Phase 8  → Phase 9  → Phase 10 → Phase 11
   ↓
Phase 12 → Phase 13 → Phase 14 → Phase 15 → Phase 16
   ↓
Phase 17 → Phase 18 → Phase 19 → Phase 20 → Phase 21
   ↓
Phase 22 → Phase 23 → Phase 24 → Phase 25 → Phase 26 → Phase 27 → Phase 28

Phase 5 MUST be before Phase 7
  (PartyKit server must be deployed before web hook consumes it)

Phase 3 MUST be before Phase 4
  (auth middleware must exist before user routes use it)

Phase 11 can begin in PARALLEL with Phase 8
  (mobile and web dashboards are independent after Phase 7)

Phase 22 MUST be before Phase 23
  (workspace context needed before invite acceptance can set active org)

Phase 26 (Mobile Stitching) requires Phase 22 + Phase 24
  (workspace store + task engine must exist before mobile wiring)
```

| Phase | Title                           | Status          | Key Change                                                        |
| ----- | ------------------------------- | --------------- | ----------------------------------------------------------------- |
| 1     | Monorepo Foundation & SaaS Arch | ✅ Full rewrite | Next.js 15 App Router, Expo, Hono v4, Multi-tenant                |
| 2     | Elite SaaS Database Schema      | ✅ Full         | Organizations, Projects, Tasks, Passkeys, Activity Logs           |
| 3     | Elite Auth System               | ✅ Full         | Google OAuth, FIDO2 Passkeys, Edge JWTs (`jose`)                  |
| 4     | SaaS Management API (RBAC)      | ✅ Updated      | Strict Organization and Project Role-Based Access Control         |
| 5     | Task Management API & PartyKit  | ✅ Updated      | Join-table assignments, state machine, isolated websockets        |
| 6     | Analytics, Logs & Edge Cron     | ✅ Updated      | Tenant-scoped aggregation, Resend HTTP, Cloudflare Cron           |
| 7     | Frontend Routing & Middleware   | ✅ Full rewrite | Edge Middleware protection, Zustand + TanStack Query              |
| 8 & 9 | Unified RBAC Dashboards         | ✅ Updated      | Dynamic UI based on `useRBAC`, shared SaaS components             |
| 10    | Edge Rate Limiting              | ✅ Full         | Upstash Redis sliding window limits scoped per route              |
| 11    | Mobile Application (Expo)       | ✅ Updated      | SaaS Tab Layout, Native GPS sorting, secure store                 |
| 12    | Dynamic Tenant Dashboards       | 🚀 Planned      | Org-specific UI rendering via JSONB settings                      |
| 13    | Advanced Field Operations       | 🚀 Planned      | Expo Geofencing prompts and Base64 E-Signatures                   |
| 14    | Enterprise Storage & Comms      | 🚀 Planned      | Cloudflare R2 Presigned URLs, `@mentions`, task comments          |
| 15    | Automations & Webhooks          | 🚀 Planned      | Expo Push Notifications, SLA Alerts, Outgoing Webhooks            |
| 16    | Edge AI & Ecosystem API         | 🚀 Planned      | Cloudflare Workers AI Summaries, Swagger OpenAPI docs             |
| 17    | KYC & Didit Integration         | 🚀 Planned      | Free KYC verification, Resend emails, HMAC Webhooks               |
| 18    | Geocoding & Maps Engine         | 🚀 Planned      | Nominatim tiered fallback, Confidence Scores (0-100), MapLibre    |
| 19    | Billing & Adv. Search           | 🚀 Planned      | Time entries, react-pdf invoices, Postgres `tsvector` search      |
| 20    | Workspaces & Comms              | 🚀 Planned      | Drag-drop dashboards, PartyKit notifications, Jitsi Video         |
| 21    | Automations & Ent. Security     | 🚀 Planned      | Zapier-clone rules, R2 automated backups, SAML SSO, i18n          |
| 22    | Onboarding & Global Context     | ✅ Complete     | Zustand workspace store, OrgSwitcher, ProjectSwitcher, Onboarding |
| 23    | Invite Acceptance Flow          | ✅ Complete     | Invitations table, token generation, Resend email, Accept UI      |
| 24    | Task Creation & Slide-Over      | 🚀 Planned      | URL-driven task detail, optimistic updates, bulk upload           |
| 25    | Profile APIs & Passkeys UI      | 🚀 Planned      | Self-service profile updates, passkey enrollment/revoke UI        |
| 26    | Mobile Stitching (`apps/app/`)  | 🚀 Deferred     | Expo workspace store replica, offline mutation queue              |
| 27    | SaaS Polish & Error Boundaries  | 🚀 Planned      | Global ErrorBoundary, branded empty states                        |
| 28    | Guided Tour (Optional)          | 🚀 Future       | react-joyride 3-step onboarding tour                              |
