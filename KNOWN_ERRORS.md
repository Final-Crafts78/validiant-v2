# Validiant v2 Known Errors & Gotchas

This document tracks known issues, architectural quirks, and deployment "gotchas" discovered during development.

## 1. Cloudflare Environment Injection (Zod Failures)
**Symptom**: API redirects to `localhost:3000` or returns "OAuth not configured" despite credentials being set in the Cloudflare dashboard.
**Cause**: If any **required** field in `apps/api/src/config/env.config.ts` (Zod schema) is missing from the `Env` interface in `apps/api/src/app.ts`, it is NOT passed to `initEnv(c.env)`. Zod validation then fails, triggering a fallback to development placeholders.
**Fix**: Ensure every variable in `wrangler.toml` [vars] and every secret set via `wrangler secret put` is explicitly declared in the `Env` interface in `app.ts`.

## 2. Cross-Subdomain Authentication (SSE/EventSource)
**Symptom**: Real-time stream (SSE) fails with `401 Unauthorized` in production.
**Cause**: The native browser `EventSource` API has limited support for custom headers and cross-site cookies. Even with `withCredentials: true`, `SameSite=Lax` cookies may not be sent from `www.validiant.in` to `api.validiant.in`.
**Fix**: Pass the `accessToken` as a query parameter (`?token=...`) in the EventSource URL. The `auth.middleware.ts` has been updated to check this query parameter as a fallback.

## 3. Middleware Path Collision (Tenant Isolation)
**Symptom**: Navigation to `/dashboard` redirects to `/auth/login` even after successful auth.
**Cause**: The Next.js middleware misidentifies the first path segment (e.g., `dashboard`) as an organization slug because it wasn't in the `publicKeywords` list. This triggers "Org-Scoped" isolation logic which requires an active session.
**Fix**: Explicitly add global routes (`auth`, `api`, `dashboard`, `profile`, `onboard`, `organizations`) to the `publicKeywords` array in `apps/web/src/middleware.ts`.

## 4. HttpOnly Cookie Visibility
**Symptom**: `isAuthenticated` is false in the frontend middleware after OAuth login.
**Cause**: The `accessToken` cookie must be set with `domain: '.validiant.in'` in production to be shared across `api.` and `www.` subdomains. If `NODE_ENV` defaults to `development` on the API, it sets a host-only cookie on `api.validiant.in` which `www.validiant.in` cannot see.
**Fix**: Ensure `NODE_ENV = "production"` is set in `wrangler.toml` [vars] so the cookie domain logic fires correctly.

## 5. Next.js Manifest Conflict
**Symptom**: `JSON Syntax Error` on `manifest.json`.
**Cause**: Conflict between a static `public/manifest.json` and the dynamic `app/manifest.ts` generator in Next.js.
**Fix**: Remove the static `public/manifest.json` and rely solely on `apps/web/src/app/manifest.ts`.
