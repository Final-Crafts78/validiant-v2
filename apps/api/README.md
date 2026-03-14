# Validiant API (Enterprise Edition)

## Edge-Native Cloudflare Workers API

High-performance, edge-first REST API built with Hono, Drizzle ORM, and Neon Serverless PostgreSQL. Optimized for sub-100ms global latency and infinite scalability.

---

## Technical Architecture (Phase 24)

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (V8 Isolate)
- **Framework**: [Hono](https://hono.dev/) (Edge-native web framework)
- **Database**: [Neon.tech](https://neon.tech/) (Serverless PostgreSQL)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (Type-safe SQL builder)
- **File Storage**: [Supabase Storage](https://supabase.com/storage) (S3-compatible)
- **Caching & Counters**: [Cloudflare KV](https://www.cloudflare.com/products/workers-kv/)
- **Real-time Engine**: [Cloudflare Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)

---

## Performance & Optimization

### Cursor Pagination

We utilize **Cursor-based Pagination** for all large datasets (e.g., `/api/v1/tasks`).

- **O(log N)** lookup performance.
- Eliminates `OFFSET` performance degradation.
- Consistent sorting even as new items are added.

### TanStack Query Key Factory

Query keys are centralized in the web application to ensure precise cache invalidation and prevent stale data.

### Optimistic UIs

The frontend utilizes TanStack Query's `onMutate` to provide instantaneous feedback for common actions like status changes or task assignments.

---

## Features

- 🔒 **Edge JWT Authentication** - Validated at the closest edge node.
- 📦 **Serverless PostgreSQL** - Scales to zero, handles massive bursts.
- 🔧 **Drizzle ORM** - Zero-overhead SQL generation.
- ✅ **Schema Validation** - Powered by Zod and Hono's validator.
- 🛡️ **Edge Security** - Built-in rate limiting and WAF at the Cloudflare layer.
- 📝 **Forensic Logging** - Cryptographically hashed audit logs for compliance.

---

## Core Endpoints

### Base URL

```
https://api.validiant.com/api/v1
```

### Authentication

- `POST /auth/login` - Secure login
- `POST /auth/register` - User registration
- `GET /auth/me` - Profile retrieval

### Organizations

- `GET /organizations/my` - List my organizations
- `PUT /organizations/:id` - Update branding & settings
- `POST /organizations/:id/invites` - Generate secure tokens

### Tasks & Cases

- `GET /api/v1/tasks` - List tasks (Cursor Paginated)
- `PATCH /api/v1/tasks/:id` - Update status/assignment

---

## Development

### Prerequisites

- Node.js >= 20.x
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-setup/)

### Local Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Run Local Server**

   ```bash
   npm run dev
   ```

3. **Database Migrations**
   ```bash
   npm run db:push
   ```

---

## License

Proprietary - Validiant Enterprise
