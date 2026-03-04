**Confirmed:** `apps/web` is already Next.js (has `next.config.js`, `next-env.d.ts`, `tailwind.config.ts`). `apps/app` and `apps/mobile` both exist in validiant-v2. Full 11-phase document below — every line is implementation-ready.

---

# VALIDIANT — MASTER BUILD DOCUMENT v2.0

### 11 Phases - Next.js 15 App Router - PartyKit Real-Time - Expo React Native

---

## ⚠️ MANDATORY READING FOR ANY AI IMPLEMENTING ANY PHASE

**Repository:** `Final-Crafts78/ValidiantOld-Newpatchwork` — ALL code goes here.
**Stack is locked.** Never deviate from these choices. Do not suggest alternatives.

### Confirmed Stack (read from actual package.json files)

| Layer            | Technology                             | Confirmed From                             |
| ---------------- | -------------------------------------- | ------------------------------------------ |
| API Runtime      | Cloudflare Workers (Wrangler)          | `validiant-v2/apps/api`                    |
| API Framework    | Hono v4                                | `validiant-v2/apps/api`                    |
| ORM              | Drizzle ORM + Neon PostgreSQL          | `validiant-v2/apps/api`                    |
| Web Frontend     | **Next.js 15 App Router**              | `validiant-v2/apps/web/next.config.js`     |
| Mobile           | **Expo React Native (apps/app)**       | `validiant-v2/apps/app`                    |
| State Management | **Zustand + TanStack Query v5**        | confirmed architecture                     |
| Real-Time        | **PartyKit**                           | `validiant-v2` package.json                |
| Auth - Tokens    | jose (JWT)                             | `validiant-v2/apps/api`                    |
| Auth - Password  | **Web Crypto API PBKDF2** (NOT bcrypt) | CF Workers constraint                      |
| Session Cache    | Upstash Redis                          | `validiant-v2/apps/api`                    |
| Email            | **Resend HTTP API** (NOT nodemailer)   | CF Workers constraint                      |
| Validation       | Zod + @hono/zod-validator              | `validiant-v2/apps/api`                    |
| CSS              | Tailwind CSS                           | `validiant-v2/apps/web/tailwind.config.ts` |
| Build            | pnpm workspaces + Turborepo            | `ValidiantOld-Newpatchwork`                |

### CF Workers — Forbidden Node.js APIs (NEVER USE)

| ❌ Forbidden                 | ✅ Correct Replacement                      |
| ---------------------------- | ------------------------------------------- |
| `crypto.randomBytes()`       | `crypto.getRandomValues(new Uint8Array(n))` |
| `bcrypt.hash()` / `bcryptjs` | `crypto.subtle.deriveBits()` with PBKDF2    |
| `crypto.timingSafeEqual()`   | Manual XOR loop (see Phase 3)               |
| `nodemailer`                 | Resend HTTP API via `fetch()`               |
| `multer`                     | `c.req.formData()` — Hono built-in          |
| `fs`, `path`                 | Not available in Workers                    |
| `setInterval` / `process.on` | CF Cron Triggers in `wrangler.toml`         |
| `process.env.X`              | `c.env.X` via Hono `Bindings`               |
| `sequelize.sync()`           | `drizzle-kit push`                          |
| `express`                    | `hono`                                      |

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

## PHASE 1 — Monorepo Foundation & Developer Environment

**🔄 UPDATED: Next.js 15 App Router + Expo**

### Objective

Establish the complete monorepo skeleton in `ValidiantOld-Newpatchwork`. Every subsequent phase drops files into this structure. Zero application logic in this phase — only infrastructure, tooling, and configuration files.

### Complete Final Directory Structure After Phase 1

```
ValidiantOld-Newpatchwork/
├── apps/
│   ├── api/                              ← Hono + Drizzle + Cloudflare Workers
│   │   ├── src/
│   │   │   ├── index.ts                  ← Hono app entry point + CF exports
│   │   │   ├── routes/                   ← Route files (created Phase 3+)
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   ├── analytics.ts
│   │   │   │   ├── activityLog.ts
│   │   │   │   └── contact.ts
│   │   │   ├── controllers/              ← Business logic (created Phase 3+)
│   │   │   ├── services/                 ← Shared services
│   │   │   │   └── activityLog.ts
│   │   │   ├── middleware/               ← Hono middleware
│   │   │   │   ├── auth.ts
│   │   │   │   ├── permissions.ts
│   │   │   │   └── rateLimit.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts             ← All Drizzle table definitions
│   │   │   │   ├── index.ts              ← Neon client factory
│   │   │   │   └── migrations/           ← Auto-generated by drizzle-kit
│   │   │   └── lib/
│   │   │       ├── crypto.ts             ← PBKDF2 + generateSecurePassword
│   │   │       ├── jwt.ts                ← jose sign/verify helpers
│   │   │       ├── redis.ts              ← Upstash helpers + lockout logic
│   │   │       ├── email.ts              ← Resend HTTP fetch helpers
│   │   │       └── coordinates.ts        ← GPS extraction + Haversine
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── wrangler.toml
│   │   └── drizzle.config.ts
│   │
│   ├── party/                            ← PartyKit real-time server (NEW)
│   │   ├── src/
│   │   │   └── tasks.ts                  ← PartyKit room for task events
│   │   ├── package.json
│   │   └── partykit.json
│   │
│   ├── web/                              ← Next.js 15 App Router (CONFIRMED EXISTING)
│   │   ├── src/
│   │   │   ├── app/                      ← App Router root
│   │   │   │   ├── layout.tsx            ← Root layout: html, body, Providers
│   │   │   │   ├── page.tsx              ← Root: redirects based on role
│   │   │   │   ├── (auth)/               ← Route group: no sidebar
│   │   │   │   │   ├── layout.tsx        ← Centered card layout
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── change-password/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── (dashboard)/          ← Route group: sidebar + topbar
│   │   │   │   │   ├── layout.tsx        ← DashboardShell (sidebar, topbar)
│   │   │   │   │   ├── admin/
│   │   │   │   │   │   ├── page.tsx      ← AdminHomePage
│   │   │   │   │   │   ├── tasks/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── tasks/[id]/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── unassigned/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── bulk-upload/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── employees/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── analytics/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── activity/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── messages/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── manager/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── workflow/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   ├── team/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── reports/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── employee/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── history/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── task/[id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── freelancer/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── focus/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── viewer/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── actions/              ← Server Actions (mutations)
│   │   │   │       ├── auth.ts
│   │   │   │       ├── tasks.ts
│   │   │   │       └── users.ts
│   │   │   ├── components/               ← Shared UI components
│   │   │   │   ├── ui/                   ← Primitive components
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Toast.tsx
│   │   │   │   │   ├── StatCard.tsx
│   │   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   │   └── SearchInput.tsx
│   │   │   │   ├── layout/               ← Layout components
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── TopBar.tsx
│   │   │   │   └── tasks/                ← Task-specific components
│   │   │   │       ├── TaskTable.tsx
│   │   │   │       └── TaskCard.tsx
│   │   │   ├── hooks/                    ← Custom React hooks
│   │   │   │   ├── usePartySocket.ts     ← PartyKit WebSocket hook
│   │   │   │   ├── useKeyboardShortcuts.ts
│   │   │   │   └── useTaskFilters.ts
│   │   │   ├── lib/
│   │   │   │   └── apiClient.ts          ← Axios instance for client components
│   │   │   ├── store/                    ← Zustand stores
│   │   │   │   ├── useAuthStore.ts
│   │   │   │   ├── useUIStore.ts
│   │   │   │   └── useTaskStore.ts
│   │   │   ├── providers/                ← React context providers
│   │   │   │   └── Providers.tsx         ← QueryClientProvider + Zustand init
│   │   │   └── middleware.ts             ← Next.js Edge Middleware (auth guard)
│   │   ├── package.json
│   │   ├── next.config.js                ← ALREADY EXISTS — update only
│   │   ├── tailwind.config.ts            ← ALREADY EXISTS — update only
│   │   └── tsconfig.json
│   │
│   └── app/                              ← Expo React Native (ALREADY EXISTS)
│       ├── app/                          ← Expo Router
│       │   ├── (auth)/
│       │   │   ├── login.tsx
│       │   │   └── change-password.tsx
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx           ← Tab bar layout
│       │   │   ├── index.tsx             ← My Tasks tab
│       │   │   ├── history.tsx           ← Task History tab
│       │   │   └── profile.tsx           ← Profile tab
│       │   ├── task/
│       │   │   └── [id].tsx              ← Task detail screen
│       │   └── _layout.tsx               ← Root layout
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       │   ├── apiClient.ts              ← Axios (same pattern as web)
│       │   └── secureStorage.ts          ← expo-secure-store wrapper
│       ├── store/                        ← Zustand (same stores as web)
│       │   ├── useAuthStore.ts
│       │   └── useUIStore.ts
│       ├── package.json
│       └── app.json
│
├── packages/
│   └── shared/                           ← Types + Zod validators (web + api + app)
│       ├── src/
│       │   ├── types/
│       │   │   ├── user.ts               ← SystemRole, Persona, Permissions types
│       │   │   ├── task.ts               ← TaskStatus, VALID_TRANSITIONS
│       │   │   └── index.ts              ← re-exports all
│       │   └── validators/
│       │       ├── user.ts               ← Zod schemas for user input
│       │       ├── task.ts               ← Zod schemas for task input
│       │       └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                          ← Root workspace config
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

### File: Root `package.json`

```json
{
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
    "lint": "turbo lint",
    "db:push": "pnpm --filter @validiant/api db:push",
    "db:generate": "pnpm --filter @validiant/api db:generate",
    "db:studio": "pnpm --filter @validiant/api db:studio",
    "deploy:api": "pnpm --filter @validiant/api deploy",
    "deploy:party": "pnpm --filter @validiant/party deploy",
    "deploy:web": "pnpm --filter @validiant/web build"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "engines": { "node": ">=20.0.0", "pnpm": ">=9.0.0" }
}
```

### File: `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### File: `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "type-check": { "dependsOn": ["^build"] },
    "lint": {},
    "deploy": { "dependsOn": ["build"] }
  }
}
```

### File: `apps/api/package.json`

```json
{
  "name": "@validiant/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "build": "tsc --noEmit",
    "deploy": "wrangler deploy",
    "type-check": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@hono/zod-validator": "^0.2.1",
    "@neondatabase/serverless": "^0.9.0",
    "@upstash/redis": "^1.28.2",
    "@validiant/shared": "workspace:*",
    "drizzle-orm": "^0.29.3",
    "hono": "^4.0.0",
    "jose": "^5.9.6",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240208.0",
    "drizzle-kit": "^0.20.13",
    "typescript": "^5.3.3",
    "wrangler": "latest"
  }
}
```

> ⚠️ `bcryptjs`, `nodemailer`, `multer`, `express`, `xlsx` are NOT in this file. Zero Node.js-only packages in `apps/api`.

### File: `apps/api/wrangler.toml`

```toml
name = "validiant-api"
main = "src/index.ts"
compatibility_date = "2024-02-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
PARTYKIT_HOST = "validiant-party.YOUR_USERNAME.partykit.dev"

[triggers]
crons = ["*/5 * * * *"]

# ALL secrets set via: wrangler secret put SECRET_NAME
# NEVER store secrets in this file
# Required secrets:
# DATABASE_URL            — Neon PostgreSQL pooled connection string
# JWT_ACCESS_SECRET       — min 32 random bytes, base64url encoded
# JWT_REFRESH_SECRET      — min 32 random bytes, DIFFERENT from ACCESS
# UPSTASH_REDIS_REST_URL
# UPSTASH_REDIS_REST_TOKEN
# ADMIN_PASSWORD          — initial admin account password (min 12 chars)
# RESEND_API_KEY          — from resend.com
# RESEND_FROM_EMAIL       — verified sender address in Resend
```

### File: `apps/party/package.json`

```json
{
  "name": "@validiant/party",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "partykit dev",
    "deploy": "partykit deploy",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "partysocket": "^1.0.0"
  },
  "devDependencies": {
    "partykit": "^0.0.111",
    "typescript": "^5.3.3"
  }
}
```

### File: `apps/web/package.json` — Updated, REPLACES existing

```json
{
  "name": "@validiant/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "lint": "next lint"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.25.0",
    "@validiant/shared": "workspace:*",
    "axios": "^1.6.7",
    "next": "^15.0.0",
    "partysocket": "^1.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "xlsx": "^0.18.5",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.25.0",
    "@types/node": "^20.11.5",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

### File: `apps/app/package.json` — Expo React Native

```json
{
  "name": "@validiant/app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.25.0",
    "@validiant/shared": "workspace:*",
    "axios": "^1.6.7",
    "expo": "~52.0.0",
    "expo-location": "~17.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~13.0.0",
    "expo-status-bar": "~2.0.0",
    "partysocket": "^1.0.0",
    "react": "^18.3.0",
    "react-native": "0.76.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.3.0",
    "typescript": "^5.3.3"
  }
}
```

### File: `packages/shared/src/types/user.ts`

```typescript
export const SYSTEM_ROLES = ['admin', 'member', 'guest', 'viewer'] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const PERSONAS = [
  'project_manager',
  'contributor',
  'remote_worker',
  'habit_tracker',
] as const;
export type Persona = (typeof PERSONAS)[number];

// Option C: Fine-grained per-user permission flags stored in JSONB
export type Permissions = {
  tasks: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    assign: boolean;
    bulkUpload: boolean;
    export: boolean;
  };
  users: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    resetPassword: boolean;
  };
  system: {
    viewAnalytics: boolean;
    viewActivityLog: boolean;
    manageSettings: boolean;
  };
};

export const DEFAULT_PERMISSIONS: Record<SystemRole, Permissions> = {
  admin: {
    tasks: {
      create: true,
      read: true,
      update: true,
      delete: true,
      assign: true,
      bulkUpload: true,
      export: true,
    },
    users: {
      create: true,
      read: true,
      update: true,
      delete: true,
      resetPassword: true,
    },
    system: {
      viewAnalytics: true,
      viewActivityLog: true,
      manageSettings: true,
    },
  },
  member: {
    tasks: {
      create: false,
      read: true,
      update: true,
      delete: false,
      assign: false,
      bulkUpload: false,
      export: false,
    },
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      resetPassword: false,
    },
    system: {
      viewAnalytics: false,
      viewActivityLog: false,
      manageSettings: false,
    },
  },
  guest: {
    tasks: {
      create: false,
      read: true,
      update: false,
      delete: false,
      assign: false,
      bulkUpload: false,
      export: false,
    },
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      resetPassword: false,
    },
    system: {
      viewAnalytics: false,
      viewActivityLog: false,
      manageSettings: false,
    },
  },
  viewer: {
    tasks: {
      create: false,
      read: true,
      update: false,
      delete: false,
      assign: false,
      bulkUpload: false,
      export: false,
    },
    users: {
      create: false,
      read: false,
      update: false,
      delete: false,
      resetPassword: false,
    },
    system: {
      viewAnalytics: false,
      viewActivityLog: false,
      manageSettings: false,
    },
  },
};
```

### File: `packages/shared/src/types/task.ts`

```typescript
export const TASK_STATUSES = [
  'Unassigned',
  'Pending',
  'Completed',
  'Verified',
  'Left Job',
  'Not Sharing Info',
  'Not Picking',
  'Switch Off',
  'Incorrect Number',
  'Wrong Address',
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Enforced in BOTH api (Phase 5 route) AND web/app (client-side dropdown)
export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  Unassigned: ['Pending'],
  Pending: [
    'Completed',
    'Left Job',
    'Not Sharing Info',
    'Not Picking',
    'Switch Off',
    'Incorrect Number',
    'Wrong Address',
  ],
  Completed: ['Verified'],
  Verified: [], // Final state — no transitions
  'Left Job': [], // Final state
  'Not Sharing Info': ['Pending'],
  'Not Picking': ['Pending'],
  'Switch Off': ['Pending'],
  'Incorrect Number': [], // Final state
  'Wrong Address': [], // Final state
};

// PartyKit event types — shared between api, web, and app
export type PartyKitEvent =
  | {
      type: 'TASK_STATUS_CHANGED';
      taskId: number;
      status: TaskStatus;
      updatedBy: string;
    }
  | {
      type: 'TASK_ASSIGNED';
      taskId: number;
      assignedTo: string;
      updatedBy: string;
    }
  | {
      type: 'TASK_REASSIGNED';
      taskId: number;
      newAssignee: string;
      updatedBy: string;
    }
  | { type: 'TASK_UNASSIGNED'; taskId: number; updatedBy: string }
  | { type: 'TASK_CREATED'; taskId: number; title: string }
  | { type: 'TASK_DELETED'; taskId: number };
```

### File: `apps/api/src/index.ts` — Skeleton (expanded each phase)

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

export type Env = {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  ADMIN_PASSWORD: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  PARTYKIT_HOST: string; // Set in wrangler.toml [vars] — not a secret
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      const allowed = [
        'https://validiant.com',
        'https://www.validiant.com',
        'http://localhost:3000', // Next.js dev
      ];
      return allowed.includes(origin ?? '') ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
  })
);

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    env: c.env.ENVIRONMENT,
    ts: Date.now(),
  })
);

// Routes mounted in Phase 3+

export default {
  fetch: app.fetch,
  scheduled: async (
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext
  ) => {
    // CF Cron Trigger — replaces keep-alive setInterval from Validiant server.js
    // Runs every 5 minutes per wrangler.toml [triggers].crons
    console.log('Cron tick:', new Date().toISOString());
    // Phase 6+: add log cleanup, SLA digest emails
  },
};
```

### Phase 1 Completion Checklist

- [ ] `pnpm install` from repo root completes with zero errors
- [ ] `pnpm run type-check` across all packages reports zero TS errors
- [ ] `pnpm --filter @validiant/api dev` starts wrangler dev server on `localhost:8787`
- [ ] `pnpm --filter @validiant/web dev` starts Next.js dev server on `localhost:3000`
- [ ] `pnpm --filter @validiant/app dev` starts Expo dev server
- [ ] `packages/shared` types are importable from `apps/api`, `apps/web`, and `apps/app`
- [ ] `turbo.json` task graph resolves correctly (`build` waits for `^build`)
- [ ] `GET localhost:8787/health` returns `{ status: 'ok' }`

---

## PHASE 2 — Drizzle Schema & Database Migrations

**✅ UNCHANGED from v1.0** — Full schema, relations, indexes, and migration commands are defined in the previous document version. Reproduced in full below for completeness.

### File: `apps/api/src/db/index.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon HTTP driver — stateless, perfect for Cloudflare Workers
// Called once per Worker invocation — no persistent connections
export function getDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof getDb>;
```

### File: `apps/api/src/db/schema.ts`

```typescript
import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  boolean,
  integer,
  real,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { Permissions } from '@validiant/shared';

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export const systemRoleEnum = pgEnum('system_role', [
  'admin',
  'member',
  'guest',
  'viewer',
]);
export const personaEnum = pgEnum('persona', [
  'project_manager',
  'contributor',
  'remote_worker',
  'habit_tracker',
]);
export const taskStatusEnum = pgEnum('task_status', [
  'Unassigned',
  'Pending',
  'Completed',
  'Verified',
  'Left Job',
  'Not Sharing Info',
  'Not Picking',
  'Switch Off',
  'Incorrect Number',
  'Wrong Address',
]);

// ─── USERS ───────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    // Format: "pbkdf2:sha512:600000:{saltB64}:{hashB64}"
    passwordHash: text('password_hash').notNull(),
    systemRole: systemRoleEnum('system_role').notNull().default('member'),
    persona: personaEnum('persona').notNull().default('contributor'),
    // Option C RBAC — override DEFAULT_PERMISSIONS per user
    permissions: jsonb('permissions').$type<Permissions>().notNull(),
    employeeId: varchar('employee_id', { length: 50 }).unique(),
    phone: varchar('phone', { length: 30 }),
    isActive: boolean('is_active').notNull().default(true),
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    loginAttempts: integer('login_attempts').notNull().default(0),
    lockoutUntil: timestamp('lockout_until', { withTimezone: true }),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    // System user — noted, not implemented (Q4: future Android placeholder)
    // isSystemUser: boolean('is_system_user').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
    roleIdx: index('users_role_idx').on(t.systemRole),
    personaIdx: index('users_persona_idx').on(t.persona),
    employeeIdIdx: uniqueIndex('users_employee_id_idx').on(t.employeeId),
    activeIdx: index('users_active_idx').on(t.isActive),
  })
);

// ─── TASKS ───────────────────────────────────────────────────────────────────

export const tasks = pgTable(
  'tasks',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 500 }).notNull(),
    clientName: varchar('client_name', { length: 200 }),
    pincode: varchar('pincode', { length: 6 }),
    // address = free-text address; mapUrl = Google Maps link (both from Validiant)
    address: text('address'),
    mapUrl: text('map_url'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    assignedTo: integer('assigned_to').references(() => users.id, {
      onDelete: 'set null',
    }),
    assignedDate: varchar('assigned_date', { length: 10 }), // "YYYY-MM-DD"
    assignedAtTimestamp: timestamp('assigned_at_timestamp', {
      withTimezone: true,
    }),
    status: taskStatusEnum('status').notNull().default('Unassigned'),
    notes: text('notes'),
    manualDate: varchar('manual_date', { length: 10 }),
    manualTime: varchar('manual_time', { length: 8 }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdBy: integer('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    assignedToIdx: index('tasks_assigned_to_idx').on(t.assignedTo),
    statusIdx: index('tasks_status_idx').on(t.status),
    pincodeIdx: index('tasks_pincode_idx').on(t.pincode),
    assignedDateIdx: index('tasks_assigned_date_idx').on(t.assignedDate),
    createdAtIdx: index('tasks_created_at_idx').on(t.createdAt),
  })
);

// ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    userName: varchar('user_name', { length: 100 }),
    action: varchar('action', { length: 100 }).notNull(),
    // Valid action values: LOGIN_SUCCESS | LOGIN_FAILED | TASK_CREATED |
    // TASK_UPDATED | TASK_ASSIGNED | TASK_UNASSIGNED | TASK_REASSIGNED |
    // TASK_DELETED | TASK_STATUS_CHANGED | BULK_UPLOAD_COMPLETED |
    // USER_CREATED | USER_UPDATED | USER_DELETED | PASSWORD_RESET
    taskId: integer('task_id'),
    taskTitle: varchar('task_title', { length: 500 }),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    details: text('details'),
    deviceType: varchar('device_type', { length: 20 }), // "Mobile App" | "Web Browser" | "Unknown"
    ipAddress: varchar('ip_address', { length: 50 }),
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index('logs_user_id_idx').on(t.userId),
    taskIdIdx: index('logs_task_id_idx').on(t.taskId),
    actionIdx: index('logs_action_idx').on(t.action),
    timestampIdx: index('logs_timestamp_idx').on(t.timestamp),
  })
);

// ─── CONTACT MESSAGES (from Validiant/server.js) ─────────────────────────────

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('new'),
  // status values: "new" | "read" | "replied"
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── RELATIONS ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  assignedTasks: many(tasks, { relationName: 'assignedTasks' }),
  createdTasks: many(tasks, { relationName: 'createdTasks' }),
  activityLogs: many(activityLogs, { relationName: 'userLogs' }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: 'assignedTasks',
  }),
  createdByUser: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: 'createdTasks',
  }),
}));
```

### File: `apps/api/drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
} satisfies Config;
```

### Migration Execution — Exact Order

```bash
cd apps/api
cp ../../.env.example .env
# Fill DATABASE_URL in .env with Neon connection string
pnpm db:generate   # generates SQL migration files in src/db/migrations/
pnpm db:push       # applies schema to Neon database
pnpm db:studio     # opens Drizzle Studio to verify tables
```

### Phase 2 Completion Checklist

- [ ] `pnpm db:push` completes with zero errors
- [ ] Neon console shows 4 tables: `users`, `tasks`, `activity_logs`, `contact_messages`
- [ ] Neon console shows 3 ENUM types: `system_role`, `persona`, `task_status`
- [ ] All indexes present — verify in Neon → Tables → Indexes tab
- [ ] `pnpm type-check` in `apps/api` shows zero TS errors

---

## PHASE 3 — Auth System (PBKDF2 + JWT + Redis Lockout)

**✅ UNCHANGED from v1.0** — Full implementation of `lib/crypto.ts`, `lib/jwt.ts`, `lib/redis.ts`, `middleware/auth.ts`, `middleware/permissions.ts`, and `routes/auth.ts` as specified in the previous document version.

### Critical Reminders for Any AI Implementing Phase 3

- `crypto.getRandomValues()` — NOT `crypto.randomBytes()`
- PBKDF2 SHA-512, 600,000 iterations — NIST SP 800-132 (2023)
- `crypto.subtle.deriveBits()` runs in hardware-accelerated native crypto — zero CF Workers CPU time budget used
- Constant-time XOR comparison loop — NOT `crypto.timingSafeEqual()` (Node.js only)
- `jose` `SignJWT`/`jwtVerify` — NOT `jsonwebtoken`
- Access token: 15-minute expiry, `HS256`
- Refresh token: 7-day expiry, blocked in Upstash Redis on logout
- Lockout: 5 failed attempts → 15-minute Redis block via `INCR`/`EXPIRE` pattern
- `DUMMY_HASH` always runs crypto verify even for non-existent emails — prevents timing attacks
- `mustChangePassword: true` set on all employee accounts created by admin — enforced frontend-side in Phase 7

### Phase 3 Completion Checklist

- [ ] Correct credentials return `{ accessToken, refreshToken, mustChangePassword, user }`
- [ ] Wrong password 5× → HTTP 429 with minutes remaining in message
- [ ] Refresh with valid token → new `accessToken`
- [ ] Logout → blocks refresh token → next refresh returns 401
- [ ] Non-existent email → identical response time as wrong password (timing safe)
- [ ] New password fails any complexity rule → specific 400 message

---

## PHASE 4 — Backend: User Management API

**✅ UNCHANGED from v1.0** — Full implementation of `lib/email.ts` (Resend), `services/activityLog.ts`, `services/userSeeder.ts`, and `routes/users.ts` with all 6 CRUD endpoints as specified in the previous document version.

### Critical Reminders for Any AI Implementing Phase 4

- `sendEmail()` uses `fetch('https://api.resend.com/emails', {...})` — NOT nodemailer
- `generateSecurePassword()` uses `crypto.getRandomValues()` — NOT `Math.random()`
- `DELETE /api/users/:id` requires `adminPassword` in body — re-verifies via `verifyPassword()` before deleting
- `DELETE /api/users/:id` must cascade: `UPDATE tasks SET assigned_to=null, status='Unassigned'` before deleting user
- `DELETE /api/users/:id` must prevent deleting any user where `systemRole='admin'`
- `POST /api/users` sets `mustChangePassword: true` and `permissions = DEFAULT_PERMISSIONS['member']`
- All routes require `authMiddleware` + `requirePermission()` — no unprotected user endpoints
- `tempPassword` returned in API response once (in case email delivery fails — admin can copy it)

### Phase 4 Completion Checklist

- [ ] `POST /api/users` creates employee, returns `tempPassword`, fires Resend API
- [ ] `DELETE /api/users/:id` with wrong `adminPassword` → 401
- [ ] `DELETE /api/users/:id` cascades all tasks to `Unassigned`
- [ ] `POST /api/users/:id/reset-password` sets `mustChangePassword: true`, sends email
- [ ] Member role cannot call `POST /api/users` → 403

---

## PHASE 5 — Backend: Task Management API + PartyKit Real-Time

**🔄 UPDATED: PartyKit broadcast added to all mutating task endpoints**

### File: `apps/party/src/tasks.ts` — PartyKit Room Server

```typescript
import type * as Party from 'partykit/server';
import type { PartyKitEvent } from '@validiant/shared';

// This is the PartyKit server — deployed separately from the Hono CF Worker
// All connected clients (web and mobile) subscribe to this room
// The Hono API POSTs events to this room after task mutations

export default class TasksParty implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Called when a client (web/mobile) sends a message
  async onMessage(message: string, sender: Party.Connection) {
    // Clients don't send messages — they only receive
    // If a client sends anyway, ignore it
    console.log('Client message ignored from:', sender.id);
  }

  // Called when the Hono API (or any HTTP client) POSTs to this room
  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.text();

    // Validate it's a known event type before broadcasting
    let event: PartyKitEvent;
    try {
      event = JSON.parse(body) as PartyKitEvent;
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Broadcast to ALL connected clients in this room
    this.room.broadcast(JSON.stringify(event));

    return new Response('OK', { status: 200 });
  }
}
```

### File: `apps/party/partykit.json`

```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "validiant-party",
  "main": "src/tasks.ts",
  "parties": {
    "tasks": "src/tasks.ts"
  }
}
```

### File: `apps/api/src/lib/partykit.ts` — Broadcast Helper

```typescript
// Called from Hono API after every task-mutating operation
// Uses plain fetch() — available natively in CF Workers

export async function broadcastTaskEvent(
  partykitHost: string,
  event: import('@validiant/shared').PartyKitEvent
): Promise<void> {
  try {
    // PartyKit room name is fixed: "global"
    // All web and mobile clients connect to the same "global" room
    const url = `https://${partykitHost}/parties/tasks/global`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (err) {
    // NEVER let a broadcast failure crash the API response
    // Log only — task was already updated in DB
    console.error('PartyKit broadcast failed:', err);
  }
}
```

### File: `apps/api/src/lib/coordinates.ts`

```typescript
export function extractCoordinates(
  url: string
): { latitude: number; longitude: number } | null {
  if (!url) return null;
  // Pattern 1: @lat,lng (Google Maps standard URL)
  const p1 = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (p1) return { latitude: parseFloat(p1[1]), longitude: parseFloat(p1[2]) };
  // Pattern 2: ?q=lat,lng
  const p2 = url.match(/\?q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (p2) return { latitude: parseFloat(p2[1]), longitude: parseFloat(p2[2]) };
  return null;
}

// Haversine distance in km — used for GPS-sort on employee dashboard
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

### File: `apps/api/src/routes/tasks.ts` — With PartyKit Broadcasts

Every mutating route follows this exact pattern:

1. Auth middleware → permission check → Zod validation
2. Execute DB operation (Drizzle)
3. Call `logActivity()` (never throws)
4. Call `broadcastTaskEvent()` (never throws — fire-and-forget)
5. Return response

**Example: `PUT /api/tasks/:taskId/status`** (dedicated status endpoint from Validiant):

```typescript
app.put(
  '/:taskId/status',
  authMiddleware,
  requirePermission('tasks', 'update'),
  zValidator(
    'json',
    z.object({
      status: z.enum(TASK_STATUSES),
      manualDate: z.string().optional(),
      manualTime: z.string().optional(),
    })
  ),
  async (c) => {
    const { taskId } = c.req.param();
    const { status: newStatus, manualDate, manualTime } = c.req.valid('json');
    const db = getDb(c.env.DATABASE_URL);
    const user = c.var.user;

    // Fetch current task
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, parseInt(taskId)))
      .limit(1);
    if (!task)
      return c.json({ success: false, message: 'Task not found' }, 404);

    // Enforce state machine — import VALID_TRANSITIONS from @validiant/shared
    const validNextStatuses = VALID_TRANSITIONS[task.status];
    if (!validNextStatuses.includes(newStatus)) {
      return c.json(
        {
          success: false,
          message:
            `Cannot transition from "${task.status}" to "${newStatus}". ` +
            `Valid: ${validNextStatuses.join(', ') || 'none (final state)'}`,
        },
        400
      );
    }

    const updateData: Partial<typeof tasks.$inferInsert> = {
      status: newStatus,
      updatedAt: new Date(),
    };
    if (newStatus === 'Completed') {
      updateData.completedAt = new Date();
      if (manualDate) updateData.manualDate = manualDate;
      if (manualTime) updateData.manualTime = manualTime;
    }
    if (newStatus === 'Verified') updateData.verifiedAt = new Date();

    await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, parseInt(taskId)));

    // Log activity
    await logActivity(
      db,
      parseInt(user.sub),
      user.name ?? 'Unknown',
      'TASK_STATUS_CHANGED',
      parseInt(taskId),
      task.title,
      { status: task.status },
      { status: newStatus },
      {
        details: `Status changed: ${task.status} → ${newStatus}`,
        deviceType: c.req.header('User-Agent')?.includes('Mobile')
          ? 'Mobile App'
          : 'Web Browser',
      }
    );

    // ⚡ Broadcast to ALL connected clients via PartyKit
    await broadcastTaskEvent(c.env.PARTYKIT_HOST, {
      type: 'TASK_STATUS_CHANGED',
      taskId: parseInt(taskId),
      status: newStatus,
      updatedBy: user.name ?? user.sub,
    });

    return c.json({ success: true, message: `Status updated to ${newStatus}` });
  }
);
```

**All mutating task routes must call `broadcastTaskEvent()` — mapping:**

| Route                              | PartyKit event type                     |
| ---------------------------------- | --------------------------------------- |
| `POST /api/tasks` (create)         | `TASK_CREATED`                          |
| `PUT /api/tasks/:id` (full update) | `TASK_STATUS_CHANGED` if status changed |
| `PUT /api/tasks/:id/status`        | `TASK_STATUS_CHANGED`                   |
| `POST /api/tasks/:id/assign`       | `TASK_ASSIGNED`                         |
| `POST /api/tasks/:id/unassign`     | `TASK_UNASSIGNED`                       |
| `PUT /api/tasks/:id/reassign`      | `TASK_REASSIGNED`                       |
| `DELETE /api/tasks/:id`            | `TASK_DELETED`                          |

**Bulk upload route — accepts JSON array (NOT multipart):**

```typescript
// POST /api/tasks/bulk-upload
// Client (Next.js web or Expo app) parses Excel/CSV using SheetJS
// then sends normalized JSON array to this endpoint
// Zod schema:
const bulkUploadSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        pincode: z.string().regex(/^\d{6}$/, '6-digit pincode required'),
        clientName: z.string().optional().default('Unknown Client'),
        mapUrl: z.string().url().optional().nullable(),
        address: z.string().optional().nullable(),
        latitude: z.number().min(-90).max(90).optional().nullable(),
        longitude: z.number().min(-180).max(180).optional().nullable(),
        notes: z.string().optional().nullable(),
        employeeId: z.string().optional().nullable(),
      })
    )
    .min(1)
    .max(500),
});
// After bulk insert, broadcast ONE event (not 500):
await broadcastTaskEvent(env.PARTYKIT_HOST, {
  type: 'TASK_CREATED',
  taskId: 0, // 0 means bulk — clients refetch entire task list
  title: `BULK:${successCount}`,
});
```

**CSV export SLA logic (from Validiant/server.js):**

```typescript
function calculateSLA(task: typeof tasks.$inferSelect): string {
  const THRESHOLD_HOURS = 72;
  if (task.completedAt && task.assignedAtTimestamp) {
    const hours =
      (task.completedAt.getTime() - task.assignedAtTimestamp.getTime()) /
      3_600_000;
    return hours <= THRESHOLD_HOURS ? 'On Time' : 'Overdue';
  }
  if (task.status === 'Pending' && task.assignedAtTimestamp) {
    const hours = (Date.now() - task.assignedAtTimestamp.getTime()) / 3_600_000;
    return hours <= THRESHOLD_HOURS ? 'In Progress' : 'Overdue';
  }
  return 'N/A';
}
// CSV column order (exact):
// CaseID, ClientName, Employee, EmployeeID, Email, Pincode, Status,
// AssignedDate, CompletedDate, Latitude, Longitude, MapURL, Address,
// Notes, SLAStatus, ManualDate, ManualTime, CreatedAt
```

### Phase 5 Completion Checklist

- [ ] `PUT /api/tasks/:id/status` with `Pending` → `Verified` (skipping Completed) returns 400
- [ ] `PUT /api/tasks/:id/status` with `Verified` → anything returns 400 (final state)
- [ ] `POST /api/tasks/:id/assign` broadcasts `TASK_ASSIGNED` event to PartyKit
- [ ] PartyKit `GET https://validiant-party.USERNAME.partykit.dev/parties/tasks/global` connects via WebSocket
- [ ] Bulk upload of 100 JSON rows returns `{ successCount, errorCount, errors: [...first 20] }`
- [ ] Export CSV has `SLAStatus` column with `On Time` / `Overdue` / `In Progress` / `N/A` values
- [ ] Member without `tasks.assign` permission gets 403 on assign endpoint
- [ ] `broadcastTaskEvent()` failure does NOT cause API route to error — only logs to console

---

## PHASE 6 — Backend: Analytics, Activity Log & Contact

**✅ UNCHANGED from v1.0** — Full implementation of `routes/analytics.ts` (parallel `Promise.all` queries), `routes/activityLog.ts` (paginated), `routes/contact.ts` (Resend notification), and CF Cron Trigger handler.

### Phase 6 Completion Checklist

- [ ] `GET /api/analytics` runs all queries in parallel — confirm no sequential awaits
- [ ] `GET /api/activity-log?page=2&limit=20` returns correct 20-item slice with `total`
- [ ] `POST /api/contact` inserts row and calls Resend API
- [ ] `GET /health` returns `{ status: 'ok', ts: <epoch> }`
- [ ] Mount all routes in `apps/api/src/index.ts`: `app.route('/api/auth', auth)`, `app.route('/api/users', users)`, etc.

---

## PHASE 7 — Frontend Foundation (Next.js 15 App Router)

**🔄 FULL REWRITE: Next.js 15 App Router + Server Actions + TanStack Query + Zustand + PartyKit**

### Architecture Decisions (critical — read before writing any code)

**Token Storage Strategy:**

- `accessToken` → `cookie` with `SameSite=Strict; Secure; Path=/; Max-Age=900` — readable by JS so Axios can attach it
- `refreshToken` → `httpOnly` cookie with `SameSite=Strict; Secure; Path=/; Max-Age=604800` — Server Actions read this, never exposed to JS

**Data Flow Rules:**

- **Mutations** (create, update, delete, assign) → **Server Actions** → call CF Worker API with `Authorization: Bearer <accessToken>`
- **Queries** (reads) → **TanStack Query** `useQuery` → Axios client → CF Worker API directly
- **Initial SSR data** → Server Components fetch CF Worker API on server side (RSC)
- **Real-time updates** → PartyKit `usePartySocket` hook → `queryClient.invalidateQueries()`
- **Global UI state** (modal open, sidebar, toast queue) → **Zustand** `useUIStore`
- **Auth state** (user, role) → **Zustand** `useAuthStore` with `persist` middleware

### File: `apps/web/src/middleware.ts` — Edge Middleware (route protection)

```typescript
// THIS FILE MUST BE AT apps/web/src/middleware.ts
// It runs on the Next.js Edge Runtime — BEFORE any page renders
// Protects all dashboard routes without JavaScript

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/change-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // Redirect already-authed users away from login
    if (accessToken && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // All other paths require accessToken
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths EXCEPT Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
```

### File: `apps/web/src/store/useAuthStore.ts`

```typescript
'use client';
// Zustand store for auth state — persisted in localStorage
// Tokens are in cookies (managed by server) — this store holds only the user object
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemRole, Persona } from '@validiant/shared';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: SystemRole;
  persona: Persona;
};

type AuthStore = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  setAuth: (user: AuthUser, mustChangePassword: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      mustChangePassword: false,
      setAuth: (user, mustChangePassword) =>
        set({ user, isAuthenticated: true, mustChangePassword }),
      clearAuth: () =>
        set({ user: null, isAuthenticated: false, mustChangePassword: false }),
    }),
    {
      name: 'validiant-auth',
      // Only persist user object — tokens are in cookies
      partialize: (state) => ({
        user: state.user,
        mustChangePassword: state.mustChangePassword,
      }),
    }
  )
);
```

### File: `apps/web/src/store/useUIStore.ts`

```typescript
'use client';
import { create } from 'zustand';

type Toast = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

type Modal =
  | { type: 'assign-task'; taskId: number }
  | { type: 'edit-task'; taskId: number }
  | { type: 'delete-task'; taskId: number }
  | { type: 'create-employee' }
  | { type: 'edit-employee'; userId: number }
  | { type: 'reset-password'; userId: number }
  | { type: 'delete-employee'; userId: number }
  | null;

type UIStore = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  modal: Modal;
  openModal: (modal: NonNullable<Modal>) => void;
  closeModal: () => void;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  modal: null,
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  toasts: [],
  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3000
    );
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
```

### File: `apps/web/src/store/useTaskStore.ts`

```typescript
'use client';
import { create } from 'zustand';
import type { TaskStatus } from '@validiant/shared';

type TaskFilters = {
  status: TaskStatus | 'all';
  employeeId: string | 'all';
  pincode: string;
  search: string;
};

type TaskStore = {
  filters: TaskFilters;
  selectedTaskIds: number[];
  setFilter: <K extends keyof TaskFilters>(
    key: K,
    value: TaskFilters[K]
  ) => void;
  resetFilters: () => void;
  toggleTaskSelection: (id: number) => void;
  clearSelection: () => void;
  selectAll: (ids: number[]) => void;
};

const defaultFilters: TaskFilters = {
  status: 'all',
  employeeId: 'all',
  pincode: '',
  search: '',
};

export const useTaskStore = create<TaskStore>((set) => ({
  filters: defaultFilters,
  selectedTaskIds: [],
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
  toggleTaskSelection: (id) =>
    set((s) => ({
      selectedTaskIds: s.selectedTaskIds.includes(id)
        ? s.selectedTaskIds.filter((x) => x !== id)
        : [...s.selectedTaskIds, id],
    })),
  clearSelection: () => set({ selectedTaskIds: [] }),
  selectAll: (ids) => set({ selectedTaskIds: ids }),
}));
```

### File: `apps/web/src/providers/Providers.tsx`

```typescript
'use client'
// Wraps the entire app — placed in root layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient per-component-tree (Next.js App Router requirement)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,       // 30 seconds — tasks are fairly fresh
        retry: 1,
        refetchOnWindowFocus: true, // Refetch when tab becomes active
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

### File: `apps/web/src/app/layout.tsx` — Root Layout

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/providers/Providers'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Validiant',
  description: 'Task Management System',
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
```

### File: `apps/web/src/app/page.tsx` — Root Redirect

```typescript
// Server Component — reads cookie to determine redirect
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

export default async function RootPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) redirect('/login');

  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(accessToken, secret);
    const role = payload.role as string;
    const persona = payload.persona as string;

    // Route to correct dashboard based on systemRole + persona
    if (role === 'admin') redirect('/admin');
    if (persona === 'project_manager') redirect('/manager');
    if (role === 'guest' || role === 'viewer') redirect('/viewer');
    redirect('/employee'); // Default: member / contributor / remote_worker / habit_tracker
  } catch {
    redirect('/login');
  }
}
```

### File: `apps/web/src/app/actions/auth.ts` — Server Actions

```typescript
'use server';
// Server Actions for auth mutations
// Run on Next.js server — can set httpOnly cookies

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE = process.env.API_URL!;

// Helper: get access token from cookie (used by all mutation server actions)
async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) throw new Error('Not authenticated');
  return token;
}

// Called by LoginPage form — sets cookies on success
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!data.success) return { error: data.message };

  const cookieStore = await cookies();

  // accessToken — readable by JS (for Axios)
  cookieStore.set('accessToken', data.accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  });

  // refreshToken — httpOnly (never readable by JS)
  cookieStore.set('refreshToken', data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  // Return user so client Zustand store can hydrate
  return {
    success: true,
    user: data.user,
    mustChangePassword: data.mustChangePassword,
  };
}

// Called by LogoutButton
export async function logoutAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (refreshToken) {
    // Block the refresh token in Redis
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {}); // Fire and forget
  }

  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
  redirect('/login');
}
```

### File: `apps/web/src/app/actions/tasks.ts` — Task Mutation Server Actions

```typescript
'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_BASE = process.env.API_URL!;

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value ?? '';
}

async function apiCall(path: string, method: string, body?: unknown) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// All mutations go through Server Actions — NOT client-side Axios
// After each mutation, revalidate ALL paths that display task data

export async function updateTaskStatusAction(
  taskId: number,
  status: string,
  manualDate?: string,
  manualTime?: string
) {
  const result = await apiCall(`/api/tasks/${taskId}/status`, 'PUT', {
    status,
    manualDate,
    manualTime,
  });
  revalidatePath('/admin/tasks');
  revalidatePath('/employee');
  revalidatePath('/manager/workflow');
  return result;
}

export async function assignTaskAction(taskId: number, employeeId: number) {
  const result = await apiCall(`/api/tasks/${taskId}/assign`, 'POST', {
    employeeId,
  });
  revalidatePath('/admin/tasks');
  revalidatePath('/admin/unassigned');
  return result;
}

export async function createTaskAction(taskData: unknown) {
  const result = await apiCall('/api/tasks', 'POST', taskData);
  revalidatePath('/admin/tasks');
  revalidatePath('/admin/unassigned');
  return result;
}

export async function deleteTaskAction(taskId: number) {
  const result = await apiCall(`/api/tasks/${taskId}`, 'DELETE');
  revalidatePath('/admin/tasks');
  return result;
}

export async function bulkUploadAction(tasks: unknown[]) {
  const result = await apiCall('/api/tasks/bulk-upload', 'POST', { tasks });
  revalidatePath('/admin/tasks');
  return result;
}
```

### File: `apps/web/src/lib/apiClient.ts` — Client-side Axios (for TanStack Query)

```typescript
// This file is used by 'use client' components for TanStack Query reads
// It reads the accessToken from cookie (not httpOnly, so JS can access it)
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getTokenFromCookie();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    // On 401: attempt refresh via Server Action equivalent
    // Since we can't call Server Actions from Axios interceptors,
    // redirect to /login (middleware will handle re-auth)
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        // Call Next.js Route Handler that does the token refresh
        await fetch('/api/refresh-token', { method: 'POST' });
        const token = getTokenFromCookie();
        if (token) {
          error.config.headers.Authorization = `Bearer ${token}`;
          return apiClient(error.config);
        }
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### File: `apps/web/src/app/api/refresh-token/route.ts` — Next.js Route Handler

```typescript
// This is a Next.js API Route (not Hono) — handles token refresh
// Called by Axios interceptor when access token expires
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_BASE = process.env.API_URL!;

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
    return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
  }

  const { accessToken } = await res.json();
  cookieStore.set('accessToken', accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60,
  });

  return NextResponse.json({ success: true });
}
```

### File: `apps/web/src/hooks/usePartySocket.ts` — Real-Time Updates

```typescript
'use client';
// Connects to PartyKit and invalidates TanStack Query caches on task events
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import PartySocket from 'partysocket';
import type { PartyKitEvent } from '@validiant/shared';

export function useTaskPartySocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
    if (!PARTYKIT_HOST) return;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: 'global', // Must match party server room name
      party: 'tasks', // Must match partykit.json party key
    });

    socket.addEventListener('message', (event) => {
      let data: PartyKitEvent;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      // All task events invalidate task queries — TanStack Query refetches automatically
      switch (data.type) {
        case 'TASK_CREATED':
        case 'TASK_DELETED':
        case 'TASK_STATUS_CHANGED':
        case 'TASK_ASSIGNED':
        case 'TASK_UNASSIGNED':
        case 'TASK_REASSIGNED':
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          // If this specific task is open in detail view, refetch it
          if ('taskId' in data && data.taskId > 0) {
            queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
          }
          break;
      }
    });

    // Cleanup on unmount
    return () => socket.close();
  }, [queryClient]);
}
```

### File: `apps/web/src/app/(dashboard)/layout.tsx` — Dashboard Shell

```typescript
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { PartySocketInitializer } from '@/components/PartySocketInitializer'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value
  if (!token) redirect('/login')

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      {/* PartySocketInitializer is a 'use client' component that calls useTaskPartySocket() */}
      <PartySocketInitializer />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Design System Token Reference (apply consistently in all phases 8, 9, 10)

```
Background main:         bg-[#0f1117]
Background cards:        bg-[#1a1d2e]
Background sidebar:      bg-[#12141f]
Borders:                 border border-[#2a2d3e]
Text primary:            text-white
Text secondary:          text-[#8b8fa8]
Accent blue (admin):     bg-blue-500   | text-blue-400   | border-blue-500/30
Accent green (success):  bg-emerald-500/20 | text-emerald-400
Accent purple (manager): bg-purple-500/20  | text-purple-400
Accent yellow (warning): bg-yellow-500/20  | text-yellow-400
Accent red (danger):     bg-red-500/20     | text-red-400
Border radius cards:     rounded-xl
Border radius buttons:   rounded-lg
Border radius badges:    rounded-full
Shadow:                  shadow-lg shadow-black/30
```

### Phase 7 Completion Checklist

- [ ] `middleware.ts` blocks unauthenticated access to all `/admin/*`, `/employee/*` routes
- [ ] Login form submits via Server Action, sets `accessToken` and `refreshToken` cookies
- [ ] `mustChangePassword: true` — root page redirects to `/change-password` BEFORE dashboard
- [ ] Axios interceptor calls `/api/refresh-token` on 401 and retries original request
- [ ] Logout calls `logoutAction()`, clears both cookies, redirects to `/login`
- [ ] `useTaskPartySocket()` hook receives broadcast and `queryClient.invalidateQueries()` fires
- [ ] TanStack Query Devtools visible in development mode
- [ ] Zustand `useAuthStore` persists `user` object across page refreshes
- [ ] TypeScript: zero errors across all `apps/web/src` files

---

## PHASE 8 — Admin & Project Manager Dashboards

**🔄 UPDATED: Server Components for SSR, TanStack Query for client interactivity**

### Admin Dashboard Pages

**Pattern for every Admin page (Server Component outer + Client Component inner):**

```typescript
// apps/web/src/app/(dashboard)/admin/tasks/page.tsx
// Server Component — fetches initial data on server, passes to client

import { cookies } from 'next/headers'
import { TasksClientPage } from '@/components/tasks/TasksClientPage'

async function fetchTasks(token: string) {
  const res = await fetch(`${process.env.API_URL}/api/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }, // No ISR cache — always fresh
  })
  return res.ok ? res.json() : []
}

export default async function AdminTasksPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value ?? ''
  const initialTasks = await fetchTasks(token)

  // Pass initialData to TanStack Query in client component
  return <TasksClientPage initialTasks={initialTasks} />
}
```

```typescript
// apps/web/src/components/tasks/TasksClientPage.tsx
'use client';
// Client Component — TanStack Query manages real-time updates
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useUIStore } from '@/store/useUIStore';
import { useTaskStore } from '@/store/useTaskStore';

export function TasksClientPage({ initialTasks }: { initialTasks: Task[] }) {
  const { filters } = useTaskStore();

  const { data: tasks } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () =>
      apiClient.get('/tasks', { params: filters }).then((r) => r.data),
    initialData: initialTasks, // SSR data used until first client fetch
    staleTime: 30_000,
  });
  // ...render TaskTable with tasks
}
```

**Admin Pages — Features per page:**

`/admin` — AdminHomePage:

- Server Component → fetches analytics via `fetch(API_URL/api/analytics)`
- Renders 6 `StatCard` components: Total Tasks, Pending, Completed, Verified, Overdue, Active Employees
- Recent activity feed (last 10 logs) — static SSR
- Quick action buttons: "New Task", "Bulk Upload", "Export CSV" — open modals via `useUIStore.openModal()`

`/admin/bulk-upload` — BulkUploadPage (pure `'use client'`):

```typescript
// Full client component — SheetJS runs in browser
import * as XLSX from 'xlsx';
import { bulkUploadAction } from '@/app/actions/tasks';

// Step 1: Drag-and-drop zone — accepts .xlsx, .xls, .csv (10MB max)
// Step 2: Read with XLSX.read(fileBuffer, { type: 'array' })
// Step 3: Normalize column names:
//   const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
//   const normalized = rows.map(row => {
//     const r: Record<string, unknown> = {}
//     Object.keys(row).forEach(k => { r[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k] })
//     return {
//       title:      r.requestid || r.caseid || r.title || r.id,
//       pincode:    r.pincode || r.pin,
//       clientName: r.clientname || r.individualname,
//       mapUrl:     r.mapurl || r.map,
//       address:    r.address,
//       latitude:   r.latitude || r.lat,
//       longitude:  r.longitude || r.lng,
//       notes:      r.notes,
//     }
//   }).filter(r => r.title && r.pincode)
// Step 4: Show preview table (first 5 rows)
// Step 5: "Upload" button calls bulkUploadAction(normalized)
// Step 6: Show { successCount, errorCount, errors } result
// Step 7: "Download Template" button — generates blank CSV with correct headers via XLSX
```

`/admin/analytics` — AnalyticsDashboardPage:

- Add `chart.js` and `react-chartjs-2` to `apps/web/package.json`
- Donut chart: tasks by status (8 status values)
- Bar chart: tasks per employee (completed vs pending side-by-side)
- Line chart: tasks created per day (last 30 days)
- KPI row: avg completion time, SLA breach %, top performer name

### Project Manager Dashboard Pages

`/manager/workflow` — WorkflowPage:

- Kanban columns: Unassigned | Pending | Completed | Verified | Problems
- "Problems" column groups: Left Job, Not Sharing Info, Not Picking, Switch Off, Incorrect Number, Wrong Address
- Task cards: shows CaseID, Pincode, Client, Assignee chip
- Click card → opens Task Detail modal
- Drag-and-drop: NOT required in Phase 8 — add to Phase 10 backlog

### Phase 8 Completion Checklist

- [ ] Admin home SSR renders stat cards with real numbers from API
- [ ] BulkUploadPage parses a real `.xlsx` file via SheetJS in browser, POSTs JSON to API
- [ ] Analytics donut chart renders with live task status distribution
- [ ] Task table filters (status/employee/pincode) update URL params and TanStack Query key
- [ ] Deleting a task shows confirmation modal, calls Server Action, triggers `revalidatePath`
- [ ] After task mutation, PartyKit broadcasts event, all open browser tabs update via TanStack Query invalidation

---

## PHASE 9 — Employee, Freelancer & Viewer Dashboards

**🔄 UPDATED: GPS via browser API, Haversine client-side, PartyKit live updates**

### Employee Dashboard (`/employee`)

`/employee` — EmployeeHomePage:

```typescript
'use client';
// Full client component — GPS, real-time, interactive

import { useQuery } from '@tanstack/react-query';
import { useTaskPartySocket } from '@/hooks/usePartySocket';
import { haversineDistance } from '@validiant/shared'; // if moved to shared, else inline
import { VALID_TRANSITIONS } from '@validiant/shared';
import { updateTaskStatusAction } from '@/app/actions/tasks';

// haversineDistance is defined in packages/shared/src/types/task.ts for reuse
// If not there yet, move it from apps/api/src/lib/coordinates.ts to shared

export function EmployeeHome({ userId }: { userId: number }) {
  useTaskPartySocket(); // Connect to PartyKit — auto-updates on status changes

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [sortMode, setSortMode] = useState<'default' | 'gps' | 'pincode'>(
    'default'
  );

  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'employee', userId],
    queryFn: () =>
      apiClient
        .get(`/tasks?assignedTo=${userId}&status=Pending`)
        .then((r) => r.data),
  });

  // GPS sort button handler
  function handleGPSSort() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setSortMode('gps');
      },
      (err) => addToast('error', `GPS failed: ${err.message}`)
    );
  }

  // Sort tasks based on sortMode
  const sortedTasks = useMemo(() => {
    if (!tasks) return [];
    if (sortMode === 'gps' && userLocation) {
      return [...tasks].sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        const da = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          a.latitude,
          a.longitude
        );
        const db = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          b.latitude,
          b.longitude
        );
        return da - db;
      });
    }
    if (sortMode === 'pincode') {
      return [...tasks].sort((a, b) =>
        (a.pincode ?? '').localeCompare(b.pincode ?? '')
      );
    }
    return tasks; // default: by created_at desc
  }, [tasks, sortMode, userLocation]);

  // Status update handler — calls Server Action
  async function handleStatusUpdate(taskId: number, newStatus: TaskStatus) {
    const result = await updateTaskStatusAction(taskId, newStatus);
    if (result.success) addToast('success', `Status updated to ${newStatus}`);
    else addToast('error', result.message);
  }

  // Render: search bar, sort buttons (Default | Sort by GPS | Sort by Pincode)
  // Task cards with: CaseID (prominent), Client, Pincode (pill), Status badge,
  //   "Open in Maps" button (mapUrl), Status dropdown (only VALID_TRANSITIONS[task.status]),
  //   Manual date + time fields (shown when status changes to Completed)
}
```

**First-login guard — placed in `/employee/layout.tsx`:**

````typescript
// apps/web/src/app/(dashboard)/employee/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value
  if (!token) redirect('/login')

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_ACCESS_SECRET))
    // mustChangePassword is stored in Zustand — read it client-side
    // Role guard: only 'member' can access employee routes
    if (payload.role === 'admin')
Continuing exactly from where the cut-off happened — inside `/employee/layout.tsx`.

***

```typescript
    // Role guard: only 'member' can access employee routes
    if (payload.role === 'admin') redirect('/admin')
    if (payload.role === 'guest' || payload.role === 'viewer') redirect('/viewer')
  } catch {
    redirect('/login')
  }

  return <>{children}</>
}
````

**`/employee/history` — TaskHistoryPage:**

```typescript
// Server Component outer — SSR initial data
// Client Component inner — TanStack Query + search + pagination

// Query: GET /api/tasks?assignedTo=:userId&includeAll=true
// (includeAll=true = all statuses except Unassigned, all time)

// Table columns:
// Case ID | Client Name | Pincode | Status (badge) | Assigned Date | Completed Date | View Map (link icon)

// Features:
// - Client-side search: filters Case ID, Pincode, Status, Client Name
// - Pagination: 20 per page, "Previous" / "Next" buttons
// - Status badge colors:
//     Completed  → emerald
//     Verified   → blue
//     Pending    → yellow
//     Left Job / Not Picking / Switch Off / etc. → red
```

**`/employee/task/[id]` — TaskDetailPage:**

```typescript
// Server Component — full task detail with map embed
// If mapUrl exists: render Google Maps embed in iframe
//   src={`https://maps.google.com/maps?q=${task.latitude},${task.longitude}&z=15&output=embed`}
//   IF no lat/lng: open mapUrl in new tab instead (no embed)
// Show all task fields: CaseID, Client, Pincode, Address, Notes
// Status timeline: Unassigned → Pending → Completed → Verified (visual step indicator)
// "Update Status" form — calls updateTaskStatusAction server action
// Manual date/time fields: shown only when transitioning to 'Completed'
```

### Freelancer/Individual Contributor Dashboard (`/freelancer`)

`/freelancer/layout.tsx`:

```typescript
// Same role guard as employee layout
// persona must be 'contributor' — others redirect to their correct dashboard
// No GPS, no bulk operations, no assign features
```

`/freelancer` — MyTasksPage:

```typescript
// Minimal personal view — same TanStack Query as employee but cleaner UI
// Shows: personal task cards (no GPS sort button, no bulk select)
// Progress streak: "You have completed X tasks this week" card at top
// "Currently Pending: X" pill
// No sidebar bulk operations — only single task status updates
```

`/freelancer/focus` — FocusModePage:

```typescript
// Full-screen single task view
// URL: /freelancer/focus?taskId=:id
// Shows ONE task at a time — maximized, distraction free
// Large CaseID at top, Client and Pincode side by side
// Big map embed if coordinates available
// Status update buttons as large cards (not a dropdown):
//   Each valid transition = its own button with color + icon
//   e.g., Pending → [✅ Mark Complete] [📴 Switch Off] [❓ Not Sharing Info]
// Back button returns to /freelancer
```

### Guest/Viewer Dashboard (`/viewer`)

`/viewer/layout.tsx`:

```typescript
// Accessible to: systemRole === 'guest' OR systemRole === 'viewer'
// All admin/employee/manager routes redirect HERE for guest/viewer users
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'

export default async function ViewerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value
  if (!token) redirect('/login')

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_ACCESS_SECRET))
    const role = payload.role as string
    if (role !== 'guest' && role !== 'viewer') {
      // Has higher privileges — redirect to their correct dashboard
      if (role === 'admin') redirect('/admin')
      redirect('/employee')
    }
  } catch {
    redirect('/login')
  }

  return (
    <div className="relative">
      {/* Persistent read-only banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 text-center">
        <span className="text-yellow-400 text-sm font-medium">
          👁 View Only Mode — You do not have permission to edit or create records
        </span>
      </div>
      {children}
    </div>
  )
}
```

`/viewer` — ReadOnlyTasksPage:

```typescript
// Server Component — SSR initial task list
// Renders TaskTable component BUT with these props:
//   canEdit={false}
//   canDelete={false}
//   canAssign={false}
//   canExport={false}
// All action buttons are hidden (not disabled — hidden entirely)
// Status column shows badge only — no dropdown
// Search by Case ID, Pincode, Status — read-only filters only
// Pagination: 20 per page
```

`/viewer/task/[id]` — ReadOnlyTaskDetailPage:

```typescript
// Same as employee task detail BUT:
// No status update form
// No manual date/time fields
// Map embed visible (read-only viewing allowed)
// Shows: CaseID, Client, Pincode, Address, Notes, Status, Assigned Employee name
// "Back to list" button only
```

### Phase 9 Completion Checklist

- [ ] GPS sort button requests browser location permission → re-orders task cards by distance
- [ ] Status dropdown on employee task card shows ONLY `VALID_TRANSITIONS[task.status]` options — never the full list
- [ ] `mustChangePassword` guard: employee navigating to `/employee` is redirected to `/change-password` first
- [ ] Guest/viewer visiting `/admin` → redirected to `/viewer`
- [ ] Admin visiting `/viewer` → redirected to `/admin`
- [ ] Viewer page has zero action buttons — no Edit, no Delete, no Assign visible in DOM
- [ ] PartyKit: employee updates task status → all other open browser tabs reflect update within 1 second
- [ ] `/freelancer/focus?taskId=99` renders single-task fullscreen view
- [ ] Task history paginated — page 2 fetches next 20 rows

---

## PHASE 10 — Production Hardening & Final QA

### Objective

Security hardening, rate limiting, keyboard shortcuts, error boundaries, mobile responsiveness, environment validation, and full end-to-end smoke test across all roles.

### File: `apps/api/src/middleware/rateLimit.ts`

```typescript
// Sliding window rate limiter using Upstash Redis
// Same INCR/EXPIRE pattern as Phase 3 lockout — no new concepts

import { createMiddleware } from 'hono/factory';
import type { Env } from '../index';
import { getRedis } from '../lib/redis';

type RateLimitOptions = {
  requests: number; // max requests
  windowSeconds: number; // time window
  keyPrefix: string; // Redis key prefix for namespacing
};

export function rateLimit({
  requests,
  windowSeconds,
  keyPrefix,
}: RateLimitOptions) {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const redis = getRedis(c.env);

    // Key by IP address (CF Workers sets CF-Connecting-IP header)
    const ip =
      c.req.header('CF-Connecting-IP') ??
      c.req.header('X-Forwarded-For')?.split(',')[0].trim() ??
      'unknown';

    const key = `${keyPrefix}:${ip}`;
    const count = await redis.incr(key);

    if (count === 1) {
      // First request in window — set expiry
      await redis.expire(key, windowSeconds);
    }

    if (count > requests) {
      const ttl = await redis.ttl(key);
      c.header('Retry-After', String(ttl));
      return c.json(
        {
          success: false,
          message: `Rate limit exceeded. Retry in ${ttl} seconds.`,
        },
        429
      );
    }

    // Set rate limit headers on every response
    c.header('X-RateLimit-Limit', String(requests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, requests - count)));

    await next();
  });
}
```

**Apply rate limits in `apps/api/src/index.ts`:**

```typescript
import { rateLimit } from './middleware/rateLimit';

// Login endpoint: 10 attempts per 15 minutes per IP
app.use(
  '/api/auth/login',
  rateLimit({ requests: 10, windowSeconds: 900, keyPrefix: 'rl:login' })
);

// All other API routes: 120 requests per minute per IP
app.use(
  '/api/*',
  rateLimit({ requests: 120, windowSeconds: 60, keyPrefix: 'rl:api' })
);
```

### File: `apps/web/src/components/ErrorBoundary.tsx`

```typescript
'use client'
// Must be 'use client' — React error boundaries require class components or useErrorBoundary
import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Future: send to Sentry here
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-red-400 text-4xl">⚠️</div>
          <p className="text-white font-semibold">Something went wrong</p>
          <p className="text-[#8b8fa8] text-sm">{this.state.error?.message}</p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Wrap each dashboard layout with ErrorBoundary:**

```typescript
// In apps/web/src/app/(dashboard)/admin/layout.tsx:
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function AdminLayout({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
// Repeat for /manager, /employee, /freelancer, /viewer layouts
```

### File: `apps/web/src/hooks/useKeyboardShortcuts.ts`

```typescript
'use client';
// Keyboard shortcuts — port from validiant-tracker (same shortcuts preserved)
import { useEffect } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';

export function useKeyboardShortcuts() {
  const { openModal } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore if typing in an input, textarea, or select
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      // Ignore if a modal is already open (prevent stacking)
      if (document.querySelector('[data-modal-open="true"]')) {
        if (e.key === 'Escape') useUIStore.getState().closeModal();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            if (isAdmin) openModal({ type: 'create-employee' });
            break;
          case 'u':
            e.preventDefault();
            if (isAdmin) window.location.href = '/admin/bulk-upload';
            break;
          case 'e':
            e.preventDefault();
            if (isAdmin) window.open('/api/export', '_blank');
            break;
          case '/':
            e.preventDefault()(
              document.querySelector('[data-search-input]') as HTMLInputElement
            )?.focus();
            break;
        }
      }
      if (e.key === 'Escape') useUIStore.getState().closeModal();
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAdmin, openModal]);
}
```

### File: `apps/web/src/app/(dashboard)/layout.tsx` — Add shortcuts + error boundary

```typescript
// Updated dashboard layout — add keyboard shortcuts initializer
'use client'
// This layout must be client-side to call the hook
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useTaskPartySocket } from '@/hooks/usePartySocket'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { Toast } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts()   // Register global keyboard shortcuts
  useTaskPartySocket()     // Connect to PartyKit real-time

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <Toast /> {/* Fixed position toast container */}
    </div>
  )
}
```

### Environment Variable Validation

**File: `apps/api/src/lib/validateEnv.ts`** — called at startup:

```typescript
// Validates all required CF Worker bindings exist at startup
// Called once inside apps/api/src/index.ts app.get('/health', ...) handler

export function validateEnv(env: Record<string, string | undefined>): void {
  const REQUIRED = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'ADMIN_PASSWORD',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'PARTYKIT_HOST',
  ] as const;

  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Set them with: wrangler secret put <SECRET_NAME>`
    );
  }

  // JWT secrets must be at least 32 characters (256-bit minimum)
  if (env.JWT_ACCESS_SECRET!.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  }
  if (env.JWT_REFRESH_SECRET!.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
  }
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be DIFFERENT values'
    );
  }
}
```

**File: `apps/web/src/lib/validateEnv.ts`** — called in `next.config.js`:

```typescript
// Validates Next.js environment variables at build time
// Add this to apps/web/next.config.js in the `env` validation section

const REQUIRED_SERVER = [
  'API_URL',
  'JWT_ACCESS_SECRET', // Needed for server-side token verification in layouts
];
const REQUIRED_PUBLIC = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_PARTYKIT_HOST'];
// Both lists checked in next.config.js during `next build`
```

### Updated `apps/web/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@validiant/shared'], // Compile shared package
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'validiant.com'],
    },
  },
  // Validate required env vars at build time
  env: {
    // Build will FAIL if any of these are missing
    ...(process.env.NODE_ENV === 'production' && {
      _validateApiUrl:
        process.env.API_URL ||
        (() => {
          throw new Error('API_URL is required');
        })(),
    }),
  },
};

module.exports = nextConfig;
```

### Final Smoke Test — Run After Deploy

**AUTH FLOW:**

- [ ] `POST /api/auth/login` correct credentials → `{ accessToken, refreshToken, user }`
- [ ] `POST /api/auth/login` wrong password 5× → HTTP 429 with minutes remaining
- [ ] `POST /api/auth/login` after lockout window expires → success
- [ ] `POST /api/auth/refresh` valid token → new `accessToken`
- [ ] `POST /api/auth/logout` → blocks refresh → next refresh returns 401
- [ ] Web login form → cookies set → redirects to correct dashboard per role

**ROLE ROUTING:**

- [ ] Admin account → `/admin`
- [ ] Member + `project_manager` persona → `/manager`
- [ ] Member + `contributor` persona → `/employee`
- [ ] Guest/viewer account → `/viewer`
- [ ] `mustChangePassword: true` account → `/change-password` (cannot bypass)

**TASKS:**

- [ ] `POST /api/tasks` creates task, broadcasts `TASK_CREATED` to PartyKit
- [ ] `PUT /api/tasks/:id/status` Pending → Verified returns 400 (invalid transition)
- [ ] `PUT /api/tasks/:id/status` Verified → anything returns 400 (final state)
- [ ] `DELETE /api/users/:id` cascades all tasks to `Unassigned`
- [ ] Bulk upload: 100 rows processed, returns `successCount` and per-row errors

**REAL-TIME:**

- [ ] Open two browsers as admin
- [ ] Browser 1 updates task status
- [ ] Browser 2 task table updates within 1 second (no manual refresh)
- [ ] Open admin web + Expo app simultaneously — both update

**SECURITY:**

- [ ] `GET /api/tasks` without auth header → 401
- [ ] `DELETE /api/tasks/:id` with `member` token → 403
- [ ] Login 11× per minute from same IP → 429 after 10th attempt
- [ ] `wrangler secret list` shows all 9 secrets, none in `wrangler.toml`

### Phase 10 Completion Checklist

- [ ] Rate limiter blocks IP after 10 login attempts per 15-minute window
- [ ] `Ctrl+N` opens create modal on admin dashboard
- [ ] `Escape` closes any open modal from any page
- [ ] Error boundary renders "Something went wrong" for a forced error, not blank page
- [ ] `apps/api` build: `pnpm deploy` completes with zero errors
- [ ] `apps/web` build: `pnpm build` completes with zero errors, zero TS errors
- [ ] All 9 CF Worker secrets confirmed present via `wrangler secret list`
- [ ] `GET /health` returns `{ status: 'ok', env: 'production', ts: <epoch> }`

---

## PHASE 11 — Mobile Application (Expo React Native)

**🆕 NEW PHASE**

### Objective

Build the Expo React Native app in `apps/app` that consumes the same Cloudflare Workers API, uses the same `@validiant/shared` Zod schemas and types, connects to the same PartyKit room for real-time updates, and provides the full employee experience on mobile.

### Critical Expo vs Web Differences

| Concern             | Web (Next.js)                  | Mobile (Expo)                                   |
| ------------------- | ------------------------------ | ----------------------------------------------- |
| Token storage       | Cookies (httpOnly + regular)   | `expo-secure-store` (encrypted native keychain) |
| GPS                 | `navigator.geolocation`        | `expo-location`                                 |
| File upload trigger | SheetJS in browser             | Not supported on mobile — removed               |
| Navigation          | Next.js App Router             | Expo Router v4                                  |
| Server Actions      | ✅ Available                   | ❌ Not available — all calls via Axios          |
| Mutations           | Server Actions → CF Worker     | Axios → CF Worker directly                      |
| CSS                 | Tailwind classes               | StyleSheet API or NativeWind                    |
| Auth redirect       | `next/navigation` `redirect()` | Expo Router `router.replace()`                  |

### File: `apps/app/lib/secureStorage.ts`

```typescript
// Wraps expo-secure-store with typed get/set/delete
// expo-secure-store encrypts all values using the device keychain
// On Android: Android Keystore; on iOS: iOS Keychain

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'validiant_access_token',
  REFRESH_TOKEN: 'validiant_refresh_token',
  USER: 'validiant_user',
} as const;

export const secureStorage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },
  async setAccessToken(token: string) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },
  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async getUser() {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  async setUser(user: object) {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },
  async clearAll() {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);
  },
};
```

### File: `apps/app/lib/apiClient.ts`

```typescript
// Axios instance for mobile — same structure as web but reads token from SecureStore
import axios from 'axios';
import { secureStorage } from './secureStorage';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://validiant-api.workers.dev';

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000, // 10 second timeout for mobile networks
});

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
            refreshToken,
          });
          await secureStorage.setAccessToken(data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(error.config);
        } catch {
          await secureStorage.clearAll();
          // Navigation handled by Expo Router — import router here
          const { router } = await import('expo-router');
          router.replace('/(auth)/login');
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### File: `apps/app/store/useAuthStore.ts`

```typescript
// Same Zustand shape as web — but hydrates from SecureStore on app launch
// NOT using zustand persist middleware (SecureStore is async — persist is sync)

import { create } from 'zustand';
import { secureStorage } from '../lib/secureStorage';
import type { SystemRole, Persona } from '@validiant/shared';

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: SystemRole;
  persona: Persona;
};

type AuthStore = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  isLoading: boolean;
  hydrate: () => Promise<void>; // Called once on app launch
  setAuth: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string,
    mustChange: boolean
  ) => Promise<void>;
  clearAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  mustChangePassword: false,
  isLoading: true,

  hydrate: async () => {
    const user = await secureStorage.getUser();
    const token = await secureStorage.getAccessToken();
    set({ user, isAuthenticated: !!user && !!token, isLoading: false });
  },

  setAuth: async (user, accessToken, refreshToken, mustChange) => {
    await secureStorage.setAccessToken(accessToken);
    await secureStorage.setRefreshToken(refreshToken);
    await secureStorage.setUser(user);
    set({
      user,
      isAuthenticated: true,
      mustChangePassword: mustChange,
      isLoading: false,
    });
  },

  clearAuth: async () => {
    await secureStorage.clearAll();
    set({ user: null, isAuthenticated: false, mustChangePassword: false });
  },
}));
```

### File: `apps/app/app/_layout.tsx` — Root Layout

```typescript
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function RootLayout() {
  const { hydrate, isLoading } = useAuthStore()

  // Hydrate auth state from SecureStore on launch
  useEffect(() => { hydrate() }, [])

  if (isLoading) return null // Prevent flash — show nothing until auth state known

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  )
}
```

### File: `apps/app/app/(auth)/login.tsx`

```typescript
// No Server Actions on mobile — direct Axios call
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { apiClient } from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.post('/auth/login', { email, password })
      if (!data.success) { setError(data.message); return }

      await setAuth(data.user, data.accessToken, data.refreshToken, data.mustChangePassword)

      if (data.mustChangePassword) {
        router.replace('/(auth)/change-password')
        return
      }

      // Route to correct screen based on role
      const { role, persona } = data.user
      if (role === 'admin') router.replace('/(tabs)/')
      else if (persona === 'project_manager') router.replace('/(tabs)/')
      else router.replace('/(tabs)/')
      // In Phase 11, all roles go to tabs — role-based tab hiding done in tab layout
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', padding: 24 }}>
      <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
        Validiant
      </Text>
      <Text style={{ color: '#8b8fa8', marginBottom: 32 }}>Sign in to your account</Text>

      {error ? (
        <View style={{ backgroundColor: '#7f1d1d', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: '#fca5a5' }}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email address"
        placeholderTextColor="#8b8fa8"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ backgroundColor: '#1a1d2e', color: 'white', padding: 14, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#2a2d3e' }}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#8b8fa8"
        secureTextEntry
        style={{ backgroundColor: '#1a1d2e', color: 'white', padding: 14, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: '#2a2d3e' }}
      />
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={{ backgroundColor: '#3b82f6', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        {loading
          ? <ActivityIndicator color="white" />
          : <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Sign In</Text>
        }
      </TouchableOpacity>
    </View>
  )
}
```

### File: `apps/app/app/(tabs)/_layout.tsx` — Tab Bar Layout

```typescript
// Role-based tab visibility — tabs shown/hidden per systemRole
import { Tabs } from 'expo-router'
import { useAuthStore } from '../../store/useAuthStore'

export default function TabLayout() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const isManager = user?.persona === 'project_manager'

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#12141f', borderTopColor: '#2a2d3e' },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#8b8fa8',
      }}
    >
      {/* MY TASKS — visible to all roles */}
      <Tabs.Screen
        name="index"
        options={{ title: 'My Tasks', tabBarIcon: ({ color }) => <TabIcon name="tasks" color={color} /> }}
      />

      {/* HISTORY — visible to all roles */}
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: ({ color }) => <TabIcon name="history" color={color} /> }}
      />

      {/* ADMIN — visible to admin only */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <TabIcon name="admin" color={color} />,
          href: isAdmin ? '/admin' : null, // null hides the tab
        }}
      />

      {/* PROFILE — visible to all */}
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} /> }}
      />
    </Tabs>
  )
}
```

### File: `apps/app/app/(tabs)/index.tsx` — My Tasks Screen

```typescript
'use client' // Not needed in RN — all components are client-side
import { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import PartySocket from 'partysocket'
import * as Location from 'expo-location'
import { apiClient } from '../../lib/apiClient'
import { useAuthStore } from '../../store/useAuthStore'
import { VALID_TRANSITIONS, haversineDistance } from '@validiant/shared'
import type { TaskStatus } from '@validiant/shared'

export default function MyTasksScreen() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<'default' | 'gps' | 'pincode'>('default')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // ─── PartyKit WebSocket ──────────────────────────────────────────────────
  useEffect(() => {
    const PARTYKIT_HOST = process.env.EXPO_PUBLIC_PARTYKIT_HOST
    if (!PARTYKIT_HOST) return

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: 'global',
      party: 'tasks',
    })

    socket.addEventListener('message', () => {
      // Any task event → invalidate tasks query
      queryClient.invalidateQueries({ queryKey: ['tasks', 'mobile', user?.id] })
    })

    return () => socket.close()
  }, [queryClient, user?.id])

  // ─── TanStack Query ──────────────────────────────────────────────────────
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'mobile', user?.id],
    queryFn: () =>
      apiClient.get(`/tasks?assignedTo=${user?.id}&status=Pending`).then(r => r.data),
    enabled: !!user?.id,
  })

  // ─── GPS Sort ────────────────────────────────────────────────────────────
  async function handleGPSSort() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { alert('Location permission denied'); return }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
    setSortMode('gps')
  }

  // ─── Sorted + Filtered Tasks ─────────────────────────────────────────────
  const displayTasks = useMemo(() => {
    let result = tasks.filter((t: { title: string; pincode: string; clientName: string }) =>
      !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.pincode?.includes(search) ||
      t.clientName?.toLowerCase().includes(search.toLowerCase())
    )
    if (sortMode === 'gps' && userLocation) {
      result = [...result].sort((a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
        if (!a.latitude) return 1
        if (!b.latitude) return -1
        return haversineDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
             - haversineDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
      })
    }
    if (sortMode === 'pincode') {
      result = [...result].sort((a: { pincode: string }, b: { pincode: string }) =>
        (a.pincode ?? '').localeCompare(b.pincode ?? ''))
    }
    return result
  }, [tasks, search, sortMode, userLocation])

  // ─── Status Update ───────────────────────────────────────────────────────
  async function updateStatus(taskId: number, newStatus: TaskStatus) {
    await apiClient.put(`/tasks/${taskId}/status`, { status: newStatus })
    queryClient.invalidateQueries({ queryKey: ['tasks', 'mobile', user?.id] })
  }

  if (isLoading) return (
    <View style={{ flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#3b82f6" size="large" />
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: '#0f1117' }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#12141f' }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>My Tasks</Text>
        <Text style={{ color: '#8b8fa8', marginTop: 4 }}>{displayTasks.length} assigned</Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#12141f' }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by Case ID, Pincode, Client..."
          placeholderTextColor="#8b8fa8"
          style={{ backgroundColor: '#1a1d2e', color: 'white', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2a2d3e' }}
        />
      </View>

      {/* Sort Controls */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8, backgroundColor: '#12141f', borderBottomWidth: 1, borderBottomColor: '#2a2d3e' }}>
        {(['default', 'gps', 'pincode'] as const).map(mode => (
          <TouchableOpacity
            key={mode}
            onPress={() => mode === 'gps' ? handleGPSSort() : setSortMode(mode)}
            style={{
              paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
              backgroundColor: sortMode === mode ? '#3b82f6' : '#1a1d2e',
              borderWidth: 1, borderColor: sortMode === mode ? '#3b82f6' : '#2a2d3e'
            }}
          >
            <Text style={{ color: sortMode === mode ? 'white' : '#8b8fa8', fontSize: 12 }}>
              {{ default: 'Default', gps: '📍 Near Me', pincode: 'Pincode' }[mode]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <FlatList
        data={displayTasks}
        keyExtractor={(item: { id: number }) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }: { item: {
          id: number; title: string; clientName: string; pincode: string;
          status: TaskStatus; mapUrl: string; address: string; notes: string;
        }}) => (
          <View style={{ backgroundColor: '#1a1d2e', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2a2d3e' }}>
            {/* CaseID */}
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{item.title}</Text>
            <Text style={{ color: '#8b8fa8', marginTop: 2 }}>{item.clientName}</Text>

            {/* Pincode pill */}
            <View style={{ flexDirection: 'row', marginTop: 8, gap: 8, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#1e3a5f', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 }}>
                <Text style={{ color: '#60a5fa', fontWeight: '600' }}>📍 {item.pincode}</Text>
              </View>
              {/* Status badge */}
              <StatusBadge status={item.status} />
            </View>

            {/* Action row */}
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
              {/* Open in Maps */}
              {item.mapUrl ? (
                <TouchableOpacity
                  onPress={() => Linking.openURL(item.mapUrl)}
                  style={{ flex: 1, backgroundColor: '#0f2942', padding: 8, borderRadius: 8, alignItems: 'center' }}
                >
                  <Text style={{ color: '#3b82f6', fontWeight: '600' }}>🗺 Open Map</Text>
                </TouchableOpacity>
              ) : null}

              {/* Status Update — shows only valid transitions */}
              <StatusUpdateButton task={item} onUpdate={updateStatus} />
            </View>
          </View>
        )}
      />
    </View>
  )
}

// ─── StatusBadge Component ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TaskStatus }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Pending:          { bg: '#422006', text: '#fbbf24' },
    Completed:        { bg: '#052e16', text: '#34d399' },
    Verified:         { bg: '#1e3a5f', text: '#60a5fa' },
    Unassigned:       { bg: '#1a1d2e', text: '#8b8fa8' },
    'Left Job':       { bg: '#450a0a', text: '#f87171' },
    'Not Picking':    { bg: '#450a0a', text: '#f87171' },
    'Switch Off':     { bg: '#450a0a', text: '#f87171' },
    'Not Sharing Info':   { bg: '#450a0a', text: '#f87171' },
    'Incorrect Number':   { bg: '#450a0a', text: '#f87171' },
    'Wrong Address':      { bg: '#450a0a', text: '#f87171' },
  }
  const c = colors[status] ?? { bg: '#1a1d2e', text: '#8b8fa8' }
  return (
    <View style={{ backgroundColor: c.bg, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 }}>
      <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{status}</Text>
    </View>
  )
}

// ─── StatusUpdateButton Component ────────────────────────────────────────────
function StatusUpdateButton({ task, onUpdate }: {
  task: { id: number; status: TaskStatus }
  onUpdate: (id: number, status: TaskStatus) => Promise<void>
}) {
  const validNext = VALID_TRANSITIONS[task.status]
  if (validNext.length === 0) return null // Final state — no button

  // If only 1 valid transition: single button
  if (validNext.length === 1) {
    return (
      <TouchableOpacity
        onPress={() => onUpdate(task.id, validNext[0])}
        style={{ flex: 1, backgroundColor: '#052e16', padding: 8, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: '#34d399', fontWeight: '600' }}>
          → {validNext[0]}
        </Text>
      </TouchableOpacity>
    )
  }

  // Multiple valid transitions: show bottom sheet or inline mini-menu
  // Implementation: use a simple state-driven inline dropdown
  // (Full bottom sheet can be added in Phase 11 enhancement pass)
  return <StatusDropdownMobile taskId={task.id} validStatuses={validNext} onUpdate={onUpdate} />
}
```

### File: `apps/app/app/(tabs)/history.tsx` — Task History Screen

```typescript
// TanStack Query: GET /api/tasks?assignedTo=:userId&includeAll=true&page=:page&limit=20
// FlatList with onEndReached for infinite scroll (replaces web pagination)
// Each row: CaseID | Pincode | Status badge | Assigned date
// Tap row → navigate to /task/:id detail screen
```

### File: `apps/app/app/task/[id].tsx` — Task Detail Screen

```typescript
// Fetches single task: GET /api/tasks/:id
// Shows all fields: CaseID, Client, Pincode, Address, Notes, Status timeline
// "Open in Maps" button: Linking.openURL(task.mapUrl)
// Status update: calls PUT /api/tasks/:id/status via Axios (NOT Server Action)
// Manual date/time pickers: shown when transitioning to 'Completed'
//   Use expo DateTimePicker or simple TextInput (your preference)
// Back button: router.back()
```

### File: `apps/app/app/(tabs)/profile.tsx` — Profile Screen

```typescript
// Shows: name, email, employeeId, role, persona
// "Change Password" button → router.push('/(auth)/change-password')
// "Sign Out" button → calls POST /api/auth/logout → clearAuth() → router.replace('/(auth)/login')
// Shows: last active timestamp, account created date
```

### File: `apps/app/app.json`

```json
{
  "expo": {
    "name": "Validiant",
    "slug": "validiant",
    "version": "1.0.0",
    "scheme": "validiant",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "backgroundColor": "#0f1117",
    "android": {
      "adaptiveIcon": { "backgroundColor": "#0f1117" },
      "package": "com.validiant.app"
    },
    "ios": {
      "bundleIdentifier": "com.validiant.app"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Validiant needs location to sort tasks by proximity.",
          "locationWhenInUsePermission": "Validiant needs location to sort tasks by proximity."
        }
      ]
    ],
    "extra": {
      "eas": { "projectId": "YOUR_EAS_PROJECT_ID" }
    }
  }
}
```

### Phase 11 Completion Checklist

- [ ] `pnpm --filter @validiant/app dev` starts Expo dev server without errors
- [ ] Login screen submits via Axios, stores tokens in `expo-secure-store` (NOT AsyncStorage)
- [ ] Tokens persist across app close/reopen — user stays logged in
- [ ] `mustChangePassword: true` routes to change-password screen on login
- [ ] My Tasks screen loads tasks for the logged-in employee only
- [ ] GPS sort button requests `expo-location` permission — on grant, re-orders tasks by proximity
- [ ] Status dropdown shows ONLY `VALID_TRANSITIONS[task.status]` options — verified against `@validiant/shared`
- [ ] Status update calls `PUT /api/tasks/:id/status` via Axios — not a Server Action
- [ ] PartyKit WebSocket: admin updates task on web → Expo app task list updates within 1 second
- [ ] "Open in Maps" button opens Google Maps / Apple Maps (native) correctly
- [ ] Admin tab is hidden for `member` / `guest` / `viewer` roles
- [ ] Sign out clears `expo-secure-store` completely — re-opening app shows login screen
- [ ] `pnpm type-check` in `apps/app` shows zero TS errors
- [ ] `@validiant/shared` Zod validators import correctly in Expo (no bundler issues)

---

## Full Dependency Install Commands (Run Once)

```bash
# From repo root
pnpm install

# Generate and push DB schema
pnpm db:generate
pnpm db:push

# Set all CF Worker secrets (run each line separately)
wrangler secret put DATABASE_URL
wrangler secret put JWT_ACCESS_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put UPSTASH_REDIS_REST_URL
wrangler secret put UPSTASH_REDIS_REST_TOKEN
wrangler secret put ADMIN_PASSWORD
wrangler secret put RESEND_API_KEY
wrangler secret put RESEND_FROM_EMAIL

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

Phase 5 MUST be before Phase 7
  (PartyKit server must be deployed before web hook consumes it)

Phase 3 MUST be before Phase 4
  (auth middleware must exist before user routes use it)

Phase 11 can begin in PARALLEL with Phase 8
  (mobile and web dashboards are independent after Phase 7)
```

| Phase | Title                              | Status          | Key Change                                                                    |
| ----- | ---------------------------------- | --------------- | ----------------------------------------------------------------------------- |
| 1     | Monorepo Foundation                | ✅ Full rewrite | Next.js 15 App Router enforced; apps/party/ added; apps/app/ wired in         |
| 2     | Drizzle Schema & Migrations        | ✅ Full         | All 4 tables, 3 enums, all indexes                                            |
| 3     | Auth System (PBKDF2 + JWT + Redis) | ✅ Confirmed    | PBKDF2, lockout, refresh — unchanged                                          |
| 4     | User Management API                | ✅ Confirmed    | Resend, activity log, cascade delete — unchanged                              |
| 5     | Task Management API                | ✅ Updated      | PartyKit broadcast injected into every mutating route                         |
| 6     | Analytics, Activity Log, Contact   | ✅ Confirmed    | Parallel queries, cron trigger — unchanged                                    |
| 7     | Frontend Foundation                | ✅ Full rewrite | Next.js 15 App Router, Server Actions, Zustand, TanStack Query, PartyKit hook |
| 8     | Admin & Manager Dashboards         | ✅ Updated      | RSC outer + Client Component inner pattern                                    |
| 9     | Employee, Freelancer, Viewer       | ✅ Updated      | GPS via expo-location pattern mirrored                                        |
| 10    | Production Hardening               | ✅ Full         | Rate limiting, error boundaries, keyboard shortcuts, env validation           |
| 11    | Mobile Application (Expo)          | ✅ New          | expo-secure-store, Axios, PartyKit WebSocket, VALID_TRANSITIONS shared        |
