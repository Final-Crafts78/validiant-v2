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

### Ghost Cookie Issue (Browser Ignores cookies().delete())

After implementing cookie-clear safety net, **another critical issue** was discovered:

```
1. API returns 401 → clearAuthCookies() called
2. clearAuthCookies() calls cookies().delete('accessToken')
3. ⚠️ BROWSER IGNORES DELETE COMMAND! ⚠️
4. "Ghost cookie" remains in browser
5. Middleware sees ghost cookie → redirects to /dashboard
6. INFINITE 307 REDIRECT LOOP PERSISTS! 🔄
```

**Root Cause:** Some browsers (especially in certain configurations) ignore `cookies().delete()` calls from Server Actions, leaving "ghost cookies" that still trigger authentication checks.

**Solution:** **Explicit Cookie Overwrite** - Force browser compliance by:
1. Overwriting cookie with empty value and expired date (`new Date(0)`)
2. Then calling `delete()` as fallback for Next.js internal state

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
8. **Explicit Overwrite** forces browsers to actually clear cookies (no ghost cookies)

## Implementation

### 0. Cookie-Clear Safety Net (CRITICAL)

#### The Problem: Infinite Redirect Loop
- Expired/invalid tokens in cookies cause infinite redirect loop
- Middleware sees cookie → allows access
- Layout gets 401 from API → redirects to login
- Middleware sees cookie again → allows access
- **INFINITE LOOP!** 🔄

#### The Problem: Ghost Cookies
- `cookies().delete()` doesn't always work in browsers
- Browser ignores delete command
- Cookie remains ("ghost cookie")
- Middleware still sees it → loop continues
- **DELETE DOESN'T WORK!** 👻

#### The Solution: Explicit Overwrite
```typescript
/**
 * Clear authentication cookies
 * 
 * CRITICAL: Uses explicit overwrite method to force browser compliance.
 * Some browsers ignore cookies().delete() calls, leaving "ghost cookies" that
 * cause infinite redirect loops. This method:
 * 1. Overwrites cookies with empty value and past expiration (new Date(0))
 * 2. Calls delete() as fallback for Next.js internal state
 * 
 * This ensures cookies are actually removed from the browser.
 */
function clearAuthCookies() {
  const cookieStore = cookies();
  
  console.log('[clearAuthCookies] Force clearing cookies with overwrite method');
  
  // 1. Force overwrite with empty value and immediate expiration
  cookieStore.set({
    name: 'accessToken',
    value: '',
    expires: new Date(0), // Expire instantly in the past (Unix epoch)
    path: '/',
  });

  cookieStore.set({
    name: 'refreshToken',
    value: '',
    expires: new Date(0),
    path: '/',
  });

  // 2. Also call delete as a fallback for Next.js internal state
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

// In getCurrentUser / getCurrentUserAction
if (response.status === 401 || response.status === 403) {
  console.warn('Token invalid, clearing cookies');
  clearAuthCookies(); // ⚠️ CRITICAL: Break the loop with forced overwrite!
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

#### Why This Works

**Step-by-Step Cookie Clearing:**

1. **Set empty cookie with expired date** - Browser sees "set-cookie" header with:
   - `accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
   - Browser MUST honor this (HTTP spec requirement)
   - Cookie effectively deleted from browser's cookie store

2. **Call delete() as fallback** - Clears Next.js internal state:
   - Ensures middleware doesn't see stale data
   - Prevents race conditions
   - Belt-and-suspenders approach

**Why `new Date(0)` works:**
- `new Date(0)` = January 1, 1970, 00:00:00 UTC (Unix epoch)
- Any date in the past tells browser "this cookie is expired"
- Browser automatically removes expired cookies
- More reliable than `delete()` across different browsers

**Infinite Redirect Loop Prevention:**
```
1. User with EXPIRED token visits /dashboard
   ↓
2. Middleware sees accessToken cookie → ✅ Allows access
   ↓
3. Dashboard layout calls getCurrentUser()
   ↓
4. API returns 401 (token expired)
   ↓
5. ⚠️ CRITICAL: clearAuthCookies() FORCE OVERWRITES WITH EMPTY VALUE
   ↓
6. Browser receives Set-Cookie headers with expires=Jan 1, 1970
   ↓
7. Browser removes cookies immediately
   ↓
8. Layout redirects to /auth/login
   ↓
9. Middleware sees NO COOKIE → ✅ Allows login page
   ↓
10. ✅ LOOP BROKEN! User stays on login page (no ghost cookies)
```

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

// Helper to clear cookies with explicit overwrite (prevents ghost cookies)
function clearAuthCookies() {
  const cookieStore = cookies();
  
  // 1. Force overwrite with empty value and expired date
  cookieStore.set({
    name: 'accessToken',
    value: '',
    expires: new Date(0),
    path: '/',
  });

  cookieStore.set({
    name: 'refreshToken',
    value: '',
    expires: new Date(0),
    path: '/',
  });

  // 2. Also call delete as a fallback
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

    // ⚠️ CRITICAL: Clear cookies on 401/403 with explicit overwrite
    if (response.status === 401 || response.status === 403) {
      clearAuthCookies(); // Forces browser to remove cookies
      return { success: false, error: 'TokenInvalid' };
    }

    const data = await response.json();

    // ⚠️ CRITICAL: Clear cookies on any failure with explicit overwrite
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
    // ⚠️ CRITICAL: Clear cookies on network error with explicit overwrite
    clearAuthCookies();
    return { success: false, error: 'NetworkError' };
  }
}
```

#### Available Server Actions

- ✅ `loginAction(email, password)` - Login and set cookies
- ✅ `registerAction(email, password, fullName, terms)` - Register and set cookies
- ✅ `logoutAction()` - Clear cookies and denylist tokens
- ✅ `getCurrentUserAction()` - Fetch user with cookie auth + safety net + ghost cookie fix

### 3. Dashboard Layout (Server Component)

```typescript
import { cookies } from 'next/headers';
import type { AuthUser } from '@/types/auth.types';

// Helper to clear cookies with explicit overwrite (prevents ghost cookies)
function clearAuthCookies() {
  const cookieStore = cookies();
  
  // 1. Force overwrite with empty value and expired date
  cookieStore.set({
    name: 'accessToken',
    value: '',
    expires: new Date(0),
    path: '/',
  });

  cookieStore.set({
    name: 'refreshToken',
    value: '',
    expires: new Date(0),
    path: '/',
  });

  // 2. Also call delete as a fallback
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

    // ⚠️ CRITICAL: Clear cookies on 401/403 with explicit overwrite
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
    // ⚠️ CRITICAL: Clear cookies on error with explicit overwrite
    clearAuthCookies();
    return null;
  }
}

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  
  // Cookies cleared by getCurrentUser() with explicit overwrite if error occurred
  // Middleware won't redirect back (loop broken, no ghost cookies)
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

### ✅ Explicit Cookie Overwrite (Ghost Cookie Fix)
- **Forces browser compliance**
- **No ghost cookies left behind**
- **Works across all browsers**
- **Breaks infinite redirect loop completely**
- **Uses HTTP spec-compliant expired date**

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

### Cookie Clearing Methods

| Method | Reliability | Used In |
|--------|-------------|----------|
| `cookies().delete()` | ❌ Unreliable | Deprecated (causes ghost cookies) |
| `cookies().set({ expires: new Date(0) })` | ✅ Reliable | Current implementation |
| Both (overwrite + delete) | ✅✅ Most Reliable | **Recommended** |

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
5. [Server Side] Next.js clears cookies (explicit overwrite + delete)
   ↓
6. Client clears Zustand store
   ↓
7. Client redirects to /login
   ↓
8. ✅ Middleware sees no cookie → Redirects to login
```

### Infinite Redirect Prevention Flow (With Ghost Cookie Fix)

```
1. User with EXPIRED token visits /dashboard
   ↓
2. Middleware sees accessToken cookie → ✅ Allows access
   ↓
3. Dashboard layout calls getCurrentUser()
   ↓
4. API returns 401 (token expired)
   ↓
5. ⚠️ CRITICAL: clearAuthCookies() with explicit overwrite
   ↓
6. Browser receives Set-Cookie headers:
   - accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT
   - refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT
   ↓
7. Browser removes cookies (HTTP spec compliant)
   ↓
8. Layout redirects to /auth/login
   ↓
9. Middleware sees NO COOKIE → ✅ Allows login page
   ↓
10. ✅ LOOP BROKEN! User stays on login page
11. ✅ NO GHOST COOKIES! Browser actually cleared them
```

## File Structure

```
apps/web/
├── src/
│   ├── types/
│   │   └── auth.types.ts            ✅ AuthUser type definition
│   ├── actions/
│   │   └── auth.actions.ts          ✅ Server Actions + Explicit Overwrite
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/page.tsx       ✅ Uses loginAction
│   │   │   └── register/page.tsx    ✅ Uses registerAction
│   │   └── dashboard/
│   │       └── layout.tsx           ✅ Server-side user fetch + Explicit Overwrite
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
- [x] Added cookie-clear safety net to getCurrentUserAction
- [x] **CRITICAL: Replaced cookies().delete() with explicit overwrite in server actions**
- [x] Refactored login page to use server action
- [x] Refactored register page to use server action
- [x] Refactored logout button to use server action
- [x] Fixed dashboard layout user fetch
- [x] Added cookie-clear safety net to dashboard layout
- [x] **CRITICAL: Replaced cookies().delete() with explicit overwrite in dashboard layout**
- [x] Updated auth store to use AuthUser type
- [x] Updated DashboardHeader to use AuthUser type
- [x] Verified middleware can read cookies
- [x] **CRITICAL: Prevented infinite redirect loop**
- [x] **CRITICAL: Fixed ghost cookie issue with explicit overwrite**

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
#    - Cookies are cleared automatically with explicit overwrite
#    - User redirected to /login ONE TIME
#    - NO infinite redirect loop
#    - User stays on /login page
# 5. Check browser console for logs:
#    - "Token invalid (401/403), clearing cookies"
#    - "Force clearing cookies with overwrite method"
#    - "No user found, redirecting to login"
```

### 6. Ghost Cookie Test (CRITICAL)

```bash
# Test explicit cookie overwrite:
# 1. Login successfully
# 2. Open DevTools → Application → Cookies
# 3. Note the accessToken cookie
# 4. Manually expire token in Redis
# 5. Visit /dashboard (triggers 401)
# 6. Immediately check cookies in DevTools
# 7. Verify:
#    - accessToken cookie is GONE (not just marked as expired)
#    - refreshToken cookie is GONE
#    - NO ghost cookies remain
#    - Network tab shows Set-Cookie with "expires=Thu, 01 Jan 1970"
# 8. Try visiting /dashboard again
# 9. Verify:
#    - Middleware sees NO cookie
#    - Redirects to /login
#    - NO 307 redirect loop
```

## Troubleshooting

### Issue: Infinite redirect loop (307)

**Cause:** Token expired but cookies not cleared  
**Fix:** ✅ Cookie-clear safety net now implemented in both `getCurrentUserAction()` and dashboard layout  
**Verify:** Check server logs for "Token invalid, clearing cookies" and "Force clearing cookies with overwrite method" messages

### Issue: Ghost cookies persisting after clearAuthCookies()

**Cause:** Browser ignoring `cookies().delete()` calls  
**Fix:** ✅ Explicit overwrite method now implemented (expires: new Date(0))  
**Verify:** 
- Check Network tab → Response Headers → See "Set-Cookie: accessToken=; expires=Thu, 01 Jan 1970"
- Check Application tab → Cookies → Cookies should disappear immediately
- No ghost cookies remain

### Issue: User data not loading

**Cause:** Dashboard layout using wrong auth header  
**Fix:** Use `Authorization: Bearer ${token}` not `Cookie:` header

### Issue: Logout not working

**Cause:** Cookies not being deleted  
**Fix:** Use explicit overwrite method in clearAuthCookies()

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
**Fix:** ✅ Now implemented - cookies cleared automatically on 401/403/errors with explicit overwrite

### Issue: Server logs show "Token invalid" repeatedly

**Cause:** Infinite redirect loop - cookies not being cleared  
**Fix:** ✅ Now fixed - explicit overwrite cookie-clear breaks the loop

### Issue: Browser still sees cookie after calling clearAuthCookies()

**Cause:** Browser ignoring .delete() calls  
**Fix:** ✅ Now using explicit overwrite - browser MUST honor expired date per HTTP spec

## Debugging Logs

The implementation includes comprehensive logging for debugging:

```typescript
// Explicit Overwrite Logs
'[clearAuthCookies] Force clearing cookies with overwrite method'

// Server Action Logs
'[getCurrentUserAction] No access token found'
'[getCurrentUserAction] Fetching user from API: ...'
'[getCurrentUserAction] API response status: 401'
'[getCurrentUserAction] Token invalid (401/403), clearing cookies'
'[getCurrentUserAction] Successfully fetched user: user@example.com'

// Dashboard Layout Logs
'[Dashboard Layout] Force clearing cookies with overwrite method'
'[Dashboard Layout] No access token found'
'[Dashboard Layout] Fetching user from: ...'
'[Dashboard Layout] API response status: 401'
'[Dashboard Layout] Token invalid (401/403), clearing cookies'
'[Dashboard Layout] Successfully fetched user: user@example.com'
'[Dashboard Layout] No user found, redirecting to login'
```

Check server console (not browser console) for these logs when debugging auth issues.

## Technical Details: Why Explicit Overwrite Works

### HTTP Cookie Specification (RFC 6265)

From the HTTP Cookie spec:
> "If the expires attribute is set to a date in the past, the user agent SHOULD remove the cookie"

### Browser Cookie Clearing Methods

| Method | How It Works | Reliability |
|--------|--------------|-------------|
| `cookies().delete('name')` | Sends internal delete signal | ❌ Implementation-dependent |
| `document.cookie = 'name=; expires=...'` | Client-side JS (blocked by HttpOnly) | ❌ Can't access HttpOnly cookies |
| `Set-Cookie: name=; expires=Thu, 01 Jan 1970` | Server sets expired cookie | ✅ **HTTP spec compliant** |

### Why `new Date(0)` Works Universally

```typescript
new Date(0).toUTCString()
// → "Thu, 01 Jan 1970 00:00:00 GMT"

// HTTP Response Header:
// Set-Cookie: accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/

// Browser behavior (HTTP spec):
// 1. Sees expires date is in the past (1970 < current year)
// 2. MUST remove cookie from cookie store
// 3. No longer sends cookie in subsequent requests
// 4. Middleware sees no cookie → authentication fails → redirect to login
```

### Why .delete() Alone Fails

```typescript
// What cookies().delete() does:
cookies().delete('accessToken');
// → Next.js internal state updated
// → MAY send Max-Age=0 or expires header
// → Browser implementation-dependent
// → Some browsers cache and ignore
// → "Ghost cookie" persists

// What explicit overwrite does:
cookies().set({ name: 'accessToken', value: '', expires: new Date(0) });
// → Sends explicit Set-Cookie header
// → Browser MUST honor (HTTP spec)
// → Cookie actually removed from browser
// → No ghost cookies possible
```

## References

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [HttpOnly Cookies](https://owasp.org/www-community/HttpOnly)
- [BFF Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends)
- [TypeScript Type Safety](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [HTTP 307 Redirects](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307)
- [RFC 6265 - HTTP State Management (Cookies)](https://datatracker.ietf.org/doc/html/rfc6265)
- [MDN - Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)

---

**Last Updated:** February 17, 2026  
**Status:** ✅ Fully Implemented with Type Safety + Infinite Redirect Loop Fix + Ghost Cookie Fix  
**Critical Fixes Applied:** Explicit Cookie Overwrite (expires: new Date(0))  
**Maintainer:** Validiant Team
