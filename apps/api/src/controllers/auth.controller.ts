/**
 * Auth Controller - Dual-Auth Pattern
 *
 * Handles authentication-related requests with dual-platform support:
 * - Web: HttpOnly cookies (XSS-proof)
 * - Mobile: JSON tokens (SecureStore)
 *
 * DUAL-AUTH TRAP PATTERN:
 * - Sets HttpOnly cookies for web app
 * - Returns tokens in JSON payload for mobile app
 * - Web app ignores JSON tokens (uses cookies)
 * - Mobile app uses JSON tokens (stores in SecureStore)
 *
 * Security features:
 * - HttpOnly cookies (XSS-proof for web)
 * - SecureStore tokens (encrypted for mobile)
 * - Redis token denylist (real logout)
 * - JWT access + refresh tokens
 * - Secure cookie settings
 *
 * ELITE PATTERN: Controllers blindly trust c.req.valid('json')
 * Validation is enforced at route level via @hono/zod-validator
 */

import { Context } from 'hono';
import { env } from 'hono/adapter';
import { z } from 'zod';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
} from '../utils/jwt';
import { cache } from '../config/redis.config';
import {
  userRegistrationSchema,
  userLoginSchema,
  PLATFORM_ROLE_PERMISSIONS,
} from '@validiant/shared';
import * as organizationService from '../services/organization.service';
import type { User } from '../db/schema';

import { getCookieOptions, setUserPrefsCookie } from '../utils/cookie';

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

/**
 * Helper: Format user response (no sensitive data)
 * CRITICAL: Uses avatarUrl to match database schema and @validiant/shared
 */
const formatUserResponse = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: `${user.firstName} ${user.lastName}`,
  avatarUrl: user.avatarUrl,
  emailVerified: user.emailVerified,
  twoFactorEnabled: user.twoFactorEnabled,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export const register = async (c: Context) => {
  try {
    const payload = (await c.req.json()) as z.infer<
      typeof userRegistrationSchema
    >;
    const email = payload.email.toLowerCase();
    const { password, fullName } = payload;

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return c.json(
        {
          success: false,
          error: 'Email already registered',
          message: 'A user with this email already exists',
        },
        409
      );
    }

    const hashedPassword = await hashPassword(password);

    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        fullName,
      })
      .returning();

    // Resolve initial permission context
    const orgs = await organizationService.getUserOrganizations(user.id);
    const activeOrg = orgs[0];
    const platformPerms = PLATFORM_ROLE_PERMISSIONS[user.role || 'user'] || [];
    let orgPerms: string[] = [];

    if (activeOrg) {
      orgPerms = await organizationService.resolvePermissions(
        activeOrg.id,
        user.id
      );
    }

    // Merge and deduplicate permissions
    const permissions = Array.from(new Set([...platformPerms, ...orgPerms]));

    const accessToken = await generateToken({
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: activeOrg?.id,
      permissions,
    });
    
    const refreshToken = await generateRefreshToken({
      sub: user.id,
      userId: user.id,
      email: user.email,
    });

    const accessCookieOptions = getCookieOptions(c, ACCESS_TOKEN_MAX_AGE);
    const refreshCookieOptions = getCookieOptions(c, REFRESH_TOKEN_MAX_AGE);

    console.debug('[Auth:Register] Tokens & Cookies', {
      userId: user.id,
      orgId: activeOrg?.id || 'NONE',
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
      cookieOptions: {
        access: accessCookieOptions,
        refresh: refreshCookieOptions,
      },
      timestamp: new Date().toISOString(),
    });

    setCookie(
      c,
      'accessToken',
      accessToken,
      getCookieOptions(c, ACCESS_TOKEN_MAX_AGE)
    );
    setCookie(
      c,
      'refreshToken',
      refreshToken,
      getCookieOptions(c, REFRESH_TOKEN_MAX_AGE)
    );

    // Initial user preferences (Mini-Phase 6)
    setUserPrefsCookie(c, {
      theme: (user.preferences as any)?.theme || 'light',
    });

    return c.json(
      {
        success: true,
        data: {
          user: formatUserResponse(user) as any,
          accessToken,
          refreshToken,
        },
      },
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return c.json(
      {
        success: false,
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (c: Context) => {
  try {
    const payload = (await c.req.json()) as z.infer<typeof userLoginSchema>;
    const email = payload.email.toLowerCase();
    const { password } = payload;

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        401
      );
    }

    if (!user.passwordHash) {
      return c.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'This account uses OAuth authentication',
        },
        401
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return c.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        },
        401
      );
    }

    // Resolve initial permission context (Phase 5: Permission Injection)
    const orgs = await organizationService.getUserOrganizations(user.id);
    const activeOrg = orgs[0];
    const platformPerms = PLATFORM_ROLE_PERMISSIONS[user.role || 'user'] || [];
    let orgPerms: string[] = [];

    if (activeOrg) {
      orgPerms = await organizationService.resolvePermissions(
        activeOrg.id,
        user.id
      );
    }

    // Merge and deduplicate permissions
    const permissions = Array.from(new Set([...platformPerms, ...orgPerms]));

    const accessToken = await generateToken({
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: activeOrg?.id,
      permissions,
    });
    
    const refreshToken = await generateRefreshToken({
      sub: user.id,
      userId: user.id,
      email: user.email,
    });

    const accessCookieOptions = getCookieOptions(c, ACCESS_TOKEN_MAX_AGE);
    const refreshCookieOptions = getCookieOptions(c, REFRESH_TOKEN_MAX_AGE);

    console.debug('[Auth:Login] Tokens & Cookies', {
      userId: user.id,
      orgId: activeOrg?.id || 'NONE',
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
      cookieOptions: {
        access: accessCookieOptions,
        refresh: refreshCookieOptions,
      },
      timestamp: new Date().toISOString(),
    });

    setCookie(
      c,
      'accessToken',
      accessToken,
      getCookieOptions(c, ACCESS_TOKEN_MAX_AGE)
    );
    setCookie(
      c,
      'refreshToken',
      refreshToken,
      getCookieOptions(c, REFRESH_TOKEN_MAX_AGE)
    );

    // Set user preferences cookie for theme flash prevention (Mini-Phase 6)
    setUserPrefsCookie(c, {
      theme: (user.preferences as any)?.theme || 'light',
    });

    return c.json({
      success: true,
      data: {
        user: formatUserResponse(user) as any,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      {
        success: false,
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refresh = async (c: Context) => {
  try {
    let refreshToken = getCookie(c, 'refreshToken');

    if (!refreshToken) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        refreshToken = authHeader.substring(7);
      }
    }

    if (!refreshToken) {
      return c.json(
        {
          success: false,
          error: 'Refresh token not found',
          message: 'No refresh token provided',
        },
        401
      );
    }

    const decoded = await verifyToken(refreshToken);

    if (!decoded) {
      return c.json(
        {
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired',
        },
        401
      );
    }

    const isDenied = await cache.exists(`token:denylist:${refreshToken}`);
    if (isDenied) {
      return c.json(
        {
          success: false,
          error: 'Token has been revoked',
          message: 'This token has been invalidated',
        },
        401
      );
    }

    const newAccessToken = await generateToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    setCookie(
      c,
      'accessToken',
      newAccessToken,
      getCookieOptions(c, ACCESS_TOKEN_MAX_AGE)
    );

    return c.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        message: 'Token refreshed successfully',
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json(
      {
        success: false,
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export const getMe = async (c: Context) => {
  try {
    const user = c.get('user');

    console.log('[getMe] Called', {
      hasUser: !!user,
      userId: user?.userId ?? null,
      email: user?.email ?? null,
    });

    if (!user || !user.userId) {
      return c.json({ success: false, error: 'Unauthorized', message: 'Authentication required' }, 401);
    }

    const [dbUser] = await db.select().from(schema.users).where(eq(schema.users.id, user.userId)).limit(1);

    console.log('[getMe] DB lookup', {
      userId: user.userId,
      found: !!dbUser,
      email: dbUser?.email ?? 'NOT FOUND IN DB',
    });

    if (!dbUser) {
      return c.json({ success: false, error: 'User not found', message: 'User account no longer exists' }, 404);
    }

    return c.json({ success: true, data: { user: { ...formatUserResponse(dbUser), activeOrganizationId: user.organizationId, permissions: user.permissions || [] } } });
  } catch (error) {
    console.error('Get me error:', error);
    return c.json({ success: false, error: 'Failed to get user', message: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
};

/**
 * Switch Organization
 * POST /api/v1/auth/switch-org
 *
 * Regenerates the access token with permissions for the selected organization.
 */
export const switchOrganization = async (c: Context) => {
  try {
    const user = c.get('user');
    const { organizationId } = (await c.req.json()) as {
      organizationId: string;
    };

    if (!user || !user.userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        },
        401
      );
    }

    // 1. Verify user is a member of the organization
    const isMember = await organizationService.isMember(
      organizationId,
      user.userId
    );

    if (!isMember) {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this organization',
        },
        403
      );
    }

    // 2. Resolve platform and organization permissions
    const [dbUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.userId))
      .limit(1);

    if (!dbUser) {
      return c.json(
        {
          success: false,
          error: 'User not found',
          message: 'User account no longer exists',
        },
        404
      );
    }

    const platformPerms =
      PLATFORM_ROLE_PERMISSIONS[dbUser.role || 'user'] || [];
    const orgPerms = await organizationService.resolvePermissions(
      organizationId,
      user.userId
    );

    const permissions = Array.from(new Set([...platformPerms, ...orgPerms]));

    const tokenPayload = {
      sub: user.userId,
      userId: user.userId,
      email: user.email,
      role: dbUser.role,
      organizationId: organizationId,
      permissions,
    };

    console.debug('[Auth:Controller] switchOrg - Token Payload', {
      ...tokenPayload,
      timestamp: new Date().toISOString(),
    });

    // 3. Generate new tokens with new organizationId and permissions
    const accessToken = await generateToken(tokenPayload);

    const accessCookieOptions = getCookieOptions(c, ACCESS_TOKEN_MAX_AGE);
    const refreshCookieOptions = getCookieOptions(c, REFRESH_TOKEN_MAX_AGE);

    console.debug('[Auth:SwitchOrg] Tokens & Cookies', {
      userId: user.userId,
      orgId: organizationId,
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
      cookieOptions: {
        access: accessCookieOptions,
        refresh: refreshCookieOptions,
      },
      timestamp: new Date().toISOString(),
    });

    setCookie(
      c,
      'accessToken',
      accessToken,
      accessCookieOptions
    );
    setCookie(
      c,
      'refreshToken',
      refreshToken,
      refreshCookieOptions
    );

    // Sync preferences on org switch (Mini-Phase 6)
    setUserPrefsCookie(c, {
      theme: (dbUser.preferences as any)?.theme || 'light',
      // brandConfig will be added in Mini-Phase 10
    });

    return c.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        message: 'Workspace switched successfully',
      },
    });
  } catch (error) {
    console.error('Switch org error:', error);
    return c.json(
      {
        success: false,
        error: 'Switch failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Logout user with Redis token denylist
 * POST /api/v1/auth/logout
 */
export const logout = async (c: Context) => {
  try {
    let accessToken = getCookie(c, 'accessToken');
    const refreshToken = getCookie(c, 'refreshToken');

    if (!accessToken) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }

    if (accessToken) {
      try {
        const decoded = decodeToken(accessToken);
        if (decoded && decoded.exp) {
          const remainingTTL = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingTTL > 0) {
            await cache.set(
              `token:denylist:${accessToken}`,
              true,
              remainingTTL
            );
          }
        }
      } catch (err) {
        console.warn('Failed to denylist access token:', err);
      }
    }

    if (refreshToken) {
      try {
        const decoded = decodeToken(refreshToken);
        if (decoded && decoded.exp) {
          const remainingTTL = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingTTL > 0) {
            await cache.set(
              `token:denylist:${refreshToken}`,
              true,
              remainingTTL
            );
          }
        }
      } catch (err) {
        console.warn('Failed to denylist refresh token:', err);
      }
    }

    deleteCookie(c, 'accessToken', getCookieOptions(c, 0));
    deleteCookie(c, 'refreshToken', getCookieOptions(c, 0));

    return c.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json(
      {
        success: false,
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Forgot Password
 * POST /api/v1/auth/forgot-password
 *
 * Security: Email-enumeration safe — always returns 200 regardless of
 * whether the email exists in the database.
 *
 * DETERMINISTIC TOKEN: Uses crypto.randomUUID() stored as a plain string
 * in the tokenHash column. This allows a direct eq() lookup on retrieval
 * without any bcrypt comparison (edge-native, O(1) lookup).
 *
 * Email delivery: Native fetch() to Resend API (fire-and-forget).
 * Email failures are logged but never surface as HTTP errors.
 *
 * ENV: Variables are extracted via Hono's env(c) adapter — fully
 * compatible with Cloudflare Workers bindings and wrangler.toml [vars].
 * No process.env is used inside this function.
 */
export const forgotPassword = async (c: Context) => {
  // Safe success response — returned regardless of whether the user exists
  const SAFE_RESPONSE = {
    success: true,
    data: {
      message:
        'If an account exists with that email, a reset link has been sent.',
    },
  } as const;

  try {
    // ---------------------------------------------------------------------------
    // Extract env bindings via Hono's edge-native adapter.
    // Works with Cloudflare Workers wrangler.toml [vars] and Secrets.
    // ---------------------------------------------------------------------------
    const { RESEND_API_KEY, FRONTEND_URL } = env<{
      RESEND_API_KEY: string;
      FRONTEND_URL: string;
    }>(c);

    const payload = (await c.req.json()) as { email: string };
    const email = payload.email.toLowerCase();

    // Look up user — silently exit with 200 if not found (enumeration guard)
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      return c.json(SAFE_RESPONSE, 200);
    }

    // Generate a cryptographically random token (UUID v4, edge-native)
    const resetToken = crypto.randomUUID();

    // Insert token record — tokenHash stores the raw token (no bcrypt)
    // Direct eq() lookup is therefore possible on reset
    await db.insert(schema.passwordResetTokens).values({
      userId: user.id,
      tokenHash: resetToken,
      expiresAt: new Date(Date.now() + 3_600_000), // 1 hour
    });

    // ---------------------------------------------------------------------------
    // Guard: if RESEND_API_KEY is not bound, log a critical error and
    // return SAFE_RESPONSE — do not crash or leak the misconfiguration.
    // ---------------------------------------------------------------------------
    if (!RESEND_API_KEY) {
      console.error(
        '[forgotPassword] CRITICAL: RESEND_API_KEY binding is not set. ' +
          'Add it to wrangler.toml [vars] or as a Cloudflare Secret. ' +
          'Password reset email was NOT sent for user:',
        user.id
      );
      return c.json(SAFE_RESPONSE, 200);
    }

    // Fire-and-forget email via Resend — failure must not block the response
    try {
      const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Reset your Validiant password',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #1e293b; margin-bottom: 8px;">Reset your password</h2>
              <p style="color: #475569; margin-bottom: 24px;">
                We received a request to reset the password for your Validiant account
                associated with <strong>${email}</strong>.
              </p>
              <a
                href="${resetUrl}"
                style="
                  display: inline-block;
                  background-color: #2563eb;
                  color: #ffffff;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 14px;
                "
              >
                Reset Password
              </a>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
                This link expires in 1 hour. If you did not request a password reset,
                you can safely ignore this email.
              </p>
              <p style="color: #cbd5e1; font-size: 12px; margin-top: 8px;">
                Or paste this URL into your browser:<br />
                <span style="color: #64748b;">${resetUrl}</span>
              </p>
            </div>
          `,
        }),
      });
    } catch (emailError) {
      // Non-blocking — log the failure but do not surface it to the caller
      console.error('Resend email delivery failed:', emailError);
    }

    return c.json(SAFE_RESPONSE, 200);
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json(
      {
        success: false,
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};

/**
 * Reset Password
 * POST /api/v1/auth/reset-password
 *
 * DETERMINISTIC LOOKUP: Queries passwordResetTokens directly via
 * eq(schema.passwordResetTokens.tokenHash, token) — no bcrypt comparison.
 *
 * Guards:
 * 1. Token not found in DB
 * 2. Token expired (expiresAt < now)
 * 3. Token already used (usedAt is not null)
 *
 * On success:
 * - Updates user.passwordHash with bcrypt-hashed new password
 * - Sets passwordResetTokens.usedAt = now to prevent reuse
 */
export const resetPassword = async (c: Context) => {
  try {
    const { token, password } = (await c.req.json()) as {
      token: string;
      password: string;
    };

    // Direct deterministic lookup — no bcrypt comparison required
    const [tokenRecord] = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.tokenHash, token))
      .limit(1);

    // Guard 1: Token does not exist
    if (!tokenRecord) {
      return c.json(
        {
          success: false,
          error: 'Invalid or expired reset token',
          message: 'This reset link is invalid or has already been used.',
        },
        400
      );
    }

    // Guard 2: Token has expired
    if (tokenRecord.expiresAt < new Date()) {
      return c.json(
        {
          success: false,
          error: 'Invalid or expired reset token',
          message: 'This reset link has expired. Please request a new one.',
        },
        400
      );
    }

    // Guard 3: Token already consumed
    if (tokenRecord.usedAt !== null) {
      return c.json(
        {
          success: false,
          error: 'Invalid or expired reset token',
          message: 'This reset link has already been used.',
        },
        400
      );
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(password);

    // Update the user's password
    await db
      .update(schema.users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, tokenRecord.userId));

    // Mark token as used to prevent reuse
    await db
      .update(schema.passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.passwordResetTokens.tokenHash, token));

    return c.json({
      success: true,
      data: {
        message:
          'Your password has been reset successfully. You can now sign in.',
      },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json(
      {
        success: false,
        error: 'Reset failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
