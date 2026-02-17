# BFF (Backend-For-Frontend) Authentication Pattern

## Problem Statement

### Cross-Domain Cookie Issue

We were facing a critical authentication issue:

- **Backend API:** Cloudflare Workers (`*.workers.dev`)
- **Frontend:** Next.js on Vercel (`*.vercel.app`)
- **Issue:** HttpOnly cookies set by Cloudflare could not be read by Next.js Edge Middleware
- **Result:** Middleware always saw user as unauthenticated, causing infinite redirects

### Infinite Redirect Loop (307 Ping-Pong)

After implementing BFF pattern, a **new critical issue** emerged:

```
1. User → /dashboard
2. Middleware sees accessToken cookie → ✅ Allows access
3. Dashboard layout fetches user from API
4. API returns 401 (token expired/invalid)
5. Layout returns null → redirects to /auth/login
6. ⚠️ COOKIES NEVER CLEARED! ⚠️
7. User → /auth/login
8. Middleware sees accessToken cookie → redirects to /dashboard
9. Back to step 3... INFINITE 307 REDIRECT LOOP! 🔄
```

**Root Cause:** When API auth fails, the layout redirects but cookies remain. Middleware sees valid cookies and allows back to dashboard, creating ping-pong.

**Solution:** **Cookie-Clear Safety Net** - Clear cookies immediately when API returns 401/403 or any error.

## Solution: BFF Pattern

### Architecture Overview

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Browser   │─────▶│  Next.js Server  │─────▶│  Cloudflare API  │
│   (Client)  │◀─────│   (Vercel BFF)   │◀─────│   (Workers.dev)  │
└─────────────┘      └──────────────────┘      └──────────────────┘
                            │
                            ▼
                    Sets HttpOnly Cookies
                    (Same Domain as Client)
```

### How It Works

1. **Client** calls Next.js Server Action (e.g., `loginAction`)
2. **Next.js Server** proxies request to Cloudflare API
3. **Cloudflare** returns tokens in JSON: `{ accessToken, refreshToken }`
4. **Next.js Server** extracts tokens and sets HttpOnly cookies on Vercel domain
5. **Middleware** can now read cookies (same domain!) and verify authentication
6. **Client** receives user data (tokens stay in HttpOnly cookies)
7. **Cookie-Clear Safety Net** ensures invalid tokens are removed immediately

## Implementation

### 0. Cookie-Clear Safety Net (CRITICAL)

**The Problem:**
- Expired/invalid tokens in cookies cause infinite redirect loop
- Middleware sees cookie → allows access
- Layout gets 401 from API → redirects to login
- Middleware sees cookie again → allows access
- **INFINITE LOOP!** 🔄

**The Solution:**
```typescript
// Helper function used in both actions and layouts
function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

// In getCurrentUser / getCurrentUserAction
if (response.status === 401 || response.status === 403) {
  console.warn('Token invalid, clearing cookies');
  clearAuthCookies(); // ⚠️ CRITICAL: Break the loop!
  return null;
}

if (!response.ok) {
  clearAuthCookies(); // ⚠️ CRITICAL: Clear on any error
  return null;
}

try {
  data = await response.json();
} catch (jsonError) {
  clearAuthCookies(); // ⚠️ CRITICAL: Clear on parse error
  return null;
}

if (!data.success || !data.data?.user) {
  clearAuthCookies(); // ⚠️ CRITICAL: Clear on invalid response
  return null;
}
```

**Why This Works:**
1. User with expired token visits `/dashboard`
2. Middleware sees cookie → allows access
3. Layout fetches user → gets 401
4. **Layout immediately clears cookies** ⚠️
5. Layout redirects to `/auth/login`
6. Middleware sees **NO cookie** → allows login page
7. **Loop broken!** ✅

### 1. Type System (`apps/web/src/types/auth.types.ts`)

**CRITICAL FIX:** The API returns a simplified user object, not the full `User` type from `@validiant/shared`. We created `AuthUser` type to match the actual API response.

```typescript
/**
 * Auth User Response
 * This is what the API actually returns in login/register/me endpoints
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  avatar?: string; // Note: API returns 'avatar', not 'avatarUrl'
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
```

**Why this matters:**
- The shared `User` type expects many fields (role, status, preferences, etc.)
- The API only returns essential auth fields
- Using the wrong type causes TypeScript errors and runtime issues
- `AuthUser` matches exactly what `formatUserResponse()` returns in the auth controller

### 2. Server Actions (`apps/web/src/actions/auth.actions.ts`)

```typescript
'use server';

import { cookies } from 'next/headers';
import type { AuthUser } from '@/types/auth.types';

// Helper to clear cookies (prevents infinite redirect)
function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

export async function getCurrentUserAction(): Promise<GetCurrentUserActionResult> {
  const cookieStore = cookies();
  
  try {
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return { success: false, error: 'Unauthenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // ⚠️ CRITICAL: Clear cookies on 401/403
    if (response.status === 401 || response.status === 403) {
      clearAuthCookies();
      return { success: false, error: 'TokenInvalid' };
    }

    const data = await response.json();

    // ⚠️ CRITICAL: Clear cookies on any failure
    if (!response.ok || !data.success) {
      clearAuthCookies();
      return { success: false, error: 'Failed to fetch user' };
    }

    if (!data.data?.user) {
      clearAuthCookies();
      return { success: false, error: 'InvalidResponse' };
    }

    return { success: true, user: data.data.user as AuthUser };
  } catch (error) {
    // ⚠️ CRITICAL: Clear cookies on network error
    clearAuthCookies();
    return { success: false, error: 'NetworkError' };
  }
}
```

#### Available Server Actions

- ✅ `loginAction(email, password)` - Login and set cookies
- ✅ `registerAction(email, password, fullName, terms)` - Register and set cookies
- ✅ `logoutAction()` - Clear cookies and denylist tokens
- ✅ `getCurrentUserAction()` - Fetch user with cookie auth + safety net

### 3. Dashboard Layout (Server Component)

```typescript
import { cookies } from 'next/headers';
import type { AuthUser } from '@/types/auth.types';

// Helper to clear cookies (prevents infinite redirect)
function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken');

    if (!accessToken) return null;

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken.value}` },
      cache: 'no-store',
    });

    // ⚠️ CRITICAL: Clear cookies on 401/403
    if (response.status === 401 || response.status === 403) {
      clearAuthCookies();
      return null;
    }

    if (!response.ok) {
      clearAuthCookies();
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.data?.user) {
      clearAuthCookies();
      return null;
    }

    return data.data.user as AuthUser;
  } catch (error) {
    // ⚠️ CRITICAL: Clear cookies on error
    clearAuthCookies();
    return null;
  }
}

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  
  // Cookies cleared by getCurrentUser() if error occurred
  // Middleware won't redirect back (loop broken)
  if (!user) {
    redirect('/auth/login');
  }

  return <DashboardHeader user={user} />;
}
```

### 4. Client Components

#### Login Page

```typescript
'use client';

import { useTransition } from 'react';
import { loginAction } from '@/actions/auth.actions';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  
  const onSubmit = async (data) => {
    startTransition(async () => {
      const result = await loginAction(data.email, data.password);
      if (result.success) {
        setAuth({ user: result.user });
        router.push('/dashboard');
        router.refresh(); // Trigger middleware check
      }
    });
  };
}
```

#### Logout Button

```typescript
'use client';

import { useTransition } from 'react';
import { logoutAction } from '@/actions/auth.actions';

function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  
  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      clearAuth();
      router.push('/login');
    });
  };
}
```

### 5. Middleware (`apps/web/src/middleware.ts`)

```typescript
export function middleware(request: NextRequest) {
  // ✅ Can now read cookie (same domain!)
  const accessToken = request.cookies.get('accessToken');
  const isAuthenticated = !!accessToken;
  
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect('/auth/login');
  }
}
```

### 6. Auth Store (Zustand)

```typescript
import { create } from 'zustand';
import type { AuthUser } from '@/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (data: { user: AuthUser }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setAuth: ({ user }) => set({ user, isAuthenticated: true }),
  clearAuth: () => set({ user: null, isAuthenticated: false }),
}));
```

## Security Benefits

### ✅ HttpOnly Cookies
- JavaScript **cannot** access tokens
- XSS attacks **cannot** steal tokens
- Tokens stored securely in browser

### ✅ Same-Origin Cookies
- Middleware can verify authentication
- No cross-domain cookie issues
- Better CSRF protection with `SameSite: Lax`

### ✅ Server-Side Token Management
- Client never sees tokens
- Tokens only in JSON during initial response
- All subsequent requests use cookies

### ✅ Token Denylist (Redis)
- Real logout (not just client-side)
- Tokens added to Redis denylist on logout
- Prevents token reuse after logout

### ✅ Cookie-Clear Safety Net
- **Prevents infinite redirect loops**
- **Invalid tokens immediately removed**
- **Graceful degradation on API errors**
- **User experience preserved**

## Cookie Configuration

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,          // ✅ XSS protection
  secure: true,            // ✅ HTTPS only (production)
  sameSite: 'lax',         // ✅ CSRF protection
  path: '/',               // ✅ Available site-wide
  maxAge: 900,             // ✅ 15 min (access) / 7 days (refresh)
};
```

### Cookie Lifecycle

| Cookie | Max Age | Purpose |
|--------|---------|----------|
| `accessToken` | 15 minutes | Short-lived auth token |
| `refreshToken` | 7 days | Long-lived renewal token |

## Authentication Flow

### Login Flow

```
1. User submits login form
   ↓
2. Client calls loginAction(email, password)
   ↓
3. [Server Side] Next.js fetches Cloudflare API
   ↓
4. Cloudflare returns: { success: true, data: { user, tokens } }
   ↓
5. [Server Side] Next.js sets HttpOnly cookies
   ↓
6. [Server Side] Returns user data (no tokens)
   ↓
7. Client updates Zustand store with user
   ↓
8. Client redirects to /dashboard
   ↓
9. ✅ Middleware sees cookie → Allows access
```

### Logout Flow

```
1. User clicks logout button
   ↓
2. Client calls logoutAction()
   ↓
3. [Server Side] Next.js calls Cloudflare /logout
   ↓
4. Cloudflare adds tokens to Redis denylist
   ↓
5. [Server Side] Next.js deletes cookies
   ↓
6. Client clears Zustand store
   ↓
7. Client redirects to /login
   ↓
8. ✅ Middleware sees no cookie → Redirects to login
```

### Infinite Redirect Prevention Flow

```
1. User with EXPIRED token visits /dashboard
   ↓
2. Middleware sees accessToken cookie → ✅ Allows access
   ↓
3. Dashboard layout calls getCurrentUser()
   ↓
4. API returns 401 (token expired)
   ↓
5. ⚠️ CRITICAL: getCurrentUser() CLEARS COOKIES
   ↓
6. getCurrentUser() returns null
   ↓
7. Layout redirects to /auth/login
   ↓
8. Middleware sees NO COOKIE → ✅ Allows login page
   ↓
9. ✅ LOOP BROKEN! User stays on login page
```

## File Structure

```
apps/web/
├── src/
│   ├── types/
│   │   └── auth.types.ts            ✅ AuthUser type definition
│   ├── actions/
│   │   └── auth.actions.ts          ✅ Server Actions (BFF) + Safety Net
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx       ✅ Uses loginAction
│   │   │   └── register/page.tsx    ✅ Uses registerAction
│   │   └── dashboard/
│   │       └── layout.tsx           ✅ Server-side user fetch + Safety Net
│   ├── components/
│   │   └── dashboard/
│   │       └── DashboardHeader.tsx  ✅ Uses logoutAction
│   ├── store/
│   │   └── auth.ts                  ✅ Uses AuthUser type
│   ├── middleware.ts                ✅ Reads same-domain cookies
│   └── services/
│       └── auth.service.ts          ⚠️  Deprecated (client-side)
```

## Migration Checklist

### ✅ Completed

- [x] Created auth types file with AuthUser
- [x] Created server actions file
- [x] Implemented loginAction with cookie setting
- [x] Implemented registerAction with cookie setting
- [x] Implemented logoutAction with cookie clearing
- [x] Implemented getCurrentUserAction
- [x] **Added cookie-clear safety net to getCurrentUserAction**
- [x] Refactored login page to use server action
- [x] Refactored register page to use server action
- [x] Refactored logout button to use server action
- [x] Fixed dashboard layout user fetch
- [x] **Added cookie-clear safety net to dashboard layout**
- [x] Updated auth store to use AuthUser type
- [x] Updated DashboardHeader to use AuthUser type
- [x] Verified middleware can read cookies
- [x] **CRITICAL: Prevented infinite redirect loop**

### 🔄 Optional Future Improvements

- [ ] Implement refresh token rotation
- [ ] Add session management UI
- [ ] Add "Remember Me" functionality
- [ ] Implement OAuth flow with BFF pattern
- [ ] Add rate limiting to server actions

## Type Safety Fixes

### The Problem

The `User` type from `@validiant/shared` expects **30+ fields**:
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;                    // ❌ Not in API response
  status: UserStatus;                // ❌ Not in API response
  preferences: UserPreferences;      // ❌ Not in API response
  notificationPreferences: {...};    // ❌ Not in API response
  phoneVerified: boolean;            // ❌ Not in API response
  // ... many more fields
}
```

But the API only returns **9 fields**:
```typescript
interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### The Solution

1. **Created `AuthUser` type** that matches actual API response
2. **Updated all auth-related code** to use `AuthUser` instead of `User`
3. **Type-safe** - no runtime errors or missing fields
4. **Future-proof** - easy to extend when API adds more fields

### Files Updated for Type Safety

- ✅ `apps/web/src/types/auth.types.ts` - New AuthUser type
- ✅ `apps/web/src/actions/auth.actions.ts` - Uses AuthUser
- ✅ `apps/web/src/store/auth.ts` - Uses AuthUser
- ✅ `apps/web/src/app/dashboard/layout.tsx` - Uses AuthUser
- ✅ `apps/web/src/components/dashboard/DashboardHeader.tsx` - Uses AuthUser

## Testing

### 1. Login Test

```bash
# 1. Open browser DevTools → Application → Cookies
# 2. Go to /auth/login
# 3. Submit valid credentials
# 4. Verify cookies are set:
#    - accessToken (HttpOnly, Secure)
#    - refreshToken (HttpOnly, Secure)
# 5. Verify redirect to /dashboard
# 6. Verify middleware allows access
```

### 2. Logout Test

```bash
# 1. While logged in, click logout
# 2. Verify cookies are deleted
# 3. Verify redirect to /login
# 4. Try accessing /dashboard
# 5. Verify middleware redirects to /login
```

### 3. Middleware Test

```bash
# 1. Delete cookies manually
# 2. Try accessing /dashboard
# 3. Verify immediate redirect to /login
# 4. Login again
# 5. Verify /dashboard is accessible
```

### 4. Type Safety Test

```bash
# 1. Run TypeScript compiler
npm run type-check

# 2. Verify no type errors
# 3. Check that AuthUser fields match API response
# 4. Test that components receive correct user data
```

### 5. Infinite Redirect Loop Test (CRITICAL)

```bash
# Test expired token handling:
# 1. Login successfully
# 2. Manually expire the token in Redis (or wait 15 minutes)
# 3. Visit /dashboard
# 4. Verify:
#    - API returns 401
#    - Cookies are cleared automatically
#    - User redirected to /login ONE TIME
#    - NO infinite redirect loop
#    - User stays on /login page
# 5. Check browser console for logs:
#    - "Token invalid (401/403), clearing cookies"
#    - "No user found, redirecting to login"
```

## Troubleshooting

### Issue: Infinite redirect loop (307)

**Cause:** Token expired but cookies not cleared  
**Fix:** ✅ Cookie-clear safety net now implemented in both `getCurrentUserAction()` and dashboard layout  
**Verify:** Check server logs for "Token invalid, clearing cookies" message

### Issue: User data not loading

**Cause:** Dashboard layout using wrong auth header  
**Fix:** Use `Authorization: Bearer ${token}` not `Cookie:` header

### Issue: Logout not working

**Cause:** Cookies not being deleted  
**Fix:** Use `cookies().delete()` in logoutAction

### Issue: Cookie not visible in DevTools

**Expected:** HttpOnly cookies don't show value in DevTools (security feature)  
**Verify:** Check Network tab → Response Headers → `Set-Cookie`

### Issue: TypeScript errors about missing User fields

**Cause:** Using `User` from `@validiant/shared` instead of `AuthUser`  
**Fix:** Import and use `AuthUser` from `@/types/auth.types`

### Issue: Runtime error - undefined user properties

**Cause:** Accessing fields that don't exist in AuthUser (e.g., `user.role`)  
**Fix:** Check `AuthUser` interface - only use fields that API returns

### Issue: API returns 401 but cookies not cleared

**Cause:** Missing cookie-clear safety net  
**Fix:** ✅ Now implemented - cookies cleared automatically on 401/403/errors

### Issue: Server logs show "Token invalid" repeatedly

**Cause:** Infinite redirect loop - cookies not being cleared  
**Fix:** ✅ Now fixed - cookie-clear safety net breaks the loop

## Debugging Logs

The implementation includes comprehensive logging for debugging:

```typescript
// Server Action Logs
'[getCurrentUserAction] No access token found'
'[getCurrentUserAction] Fetching user from API: ...'
'[getCurrentUserAction] API response status: 401'
'[getCurrentUserAction] Token invalid (401/403), clearing cookies'
'[getCurrentUserAction] Successfully fetched user: user@example.com'

// Dashboard Layout Logs
'[Dashboard Layout] No access token found'
'[Dashboard Layout] Fetching user from: ...'
'[Dashboard Layout] API response status: 401'
'[Dashboard Layout] Token invalid (401/403), clearing cookies'
'[Dashboard Layout] Successfully fetched user: user@example.com'
'[Dashboard Layout] No user found, redirecting to login'
```

Check server console (not browser console) for these logs when debugging auth issues.

## References

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [HttpOnly Cookies](https://owasp.org/www-community/HttpOnly)
- [BFF Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends)
- [TypeScript Type Safety](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [HTTP 307 Redirects](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307)

---

**Last Updated:** February 17, 2026  
**Status:** ✅ Fully Implemented with Type Safety + Infinite Redirect Loop Fix  
**Maintainer:** Validiant Team
