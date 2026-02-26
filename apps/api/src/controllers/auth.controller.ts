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
} from '@validiant/shared';
import type { User } from '../db/schema';

/**
 * Dynamic cookie options factory.
 *
 * Resolves the correct sameSite and domain policy at request time by
 * inspecting the FRONTEND_URL environment binding:
 *
 * Production (validiant.in):
 *   - sameSite: 'lax'          — safe for same-site requests; no CSRF risk
 *   - domain:   '.validiant.in' — shared across www. and api. subdomains
 *
 * Development / staging (any other origin):
 *   - sameSite: 'none'         — cross-domain delivery required
 *   - domain:   undefined      — host-only, no domain attribute emitted
 *
 * secure: true is unconditional — both environments use HTTPS exclusively.
 */
const getCookieOptions = (c: Context, maxAge: number) => {
  const { FRONTEND_URL } = env<{ FRONTEND_URL?: string }>(c);
  // Strictly identify if we are on the production validiant.in domain
  const isProd = FRONTEND_URL && FRONTEND_URL.includes('validiant.in');

  return {
    httpOnly: true,
    secure: true,
    sameSite: isProd ? ('lax' as const) : ('none' as const),
    domain: isProd ? '.validiant.in' : undefined,
    path: '/',
    maxAge,
  };
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60;          // 15 minutes
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
    const payload = (await c.req.json()) as z.infer<typeof userRegistrationSchema>;
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

    const accessToken = await generateToken({ userId: user.id, email: user.email });
    const refreshToken = await generateRefreshToken({ userId: user.id, email: user.email });

    setCookie(c, 'accessToken', accessToken, getCookieOptions(c, ACCESS_TOKEN_MAX_AGE));
    setCookie(c, 'refreshToken', refreshToken, getCookieOptions(c, REFRESH_TOKEN_MAX_AGE));

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
        { success: false, error: 'Invalid credentials', message: 'Email or password is incorrect' },
        401
      );
    }

    if (!user.passwordHash) {
      return c.json(
        { success: false, error: 'Invalid credentials', message: 'This account uses OAuth authentication' },
        401
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return c.json(
        { success: false, error: 'Invalid credentials', message: 'Email or password is incorrect' },
        401
      );
    }

    const accessToken = await generateToken({ userId: user.id, email: user.email });
    const refreshToken = await generateRefreshToken({ userId: user.id, email: user.email });

    setCookie(c, 'accessToken', accessToken, getCookieOptions(c, ACCESS_TOKEN_MAX_AGE));
    setCookie(c, 'refreshToken', refreshToken, getCookieOptions(c, REFRESH_TOKEN_MAX_AGE));

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
        { success: false, error: 'Refresh token not found', message: 'No refresh token provided' },
        401
      );
    }

    const decoded = await verifyToken(refreshToken);

    if (!decoded) {
      return c.json(
        { success: false, error: 'Invalid refresh token', message: 'Refresh token is invalid or expired' },
        401
      );
    }

    const isDenied = await cache.exists(`token:denylist:${refreshToken}`);
    if (isDenied) {
      return c.json(
        { success: false, error: 'Token has been revoked', message: 'This token has been invalidated' },
        401
      );
    }

    const newAccessToken = await generateToken({ userId: decoded.userId, email: decoded.email });

    setCookie(c, 'accessToken', newAccessToken, getCookieOptions(c, ACCESS_TOKEN_MAX_AGE));

    return c.json({
      success: true,
      data: { accessToken: newAccessToken, message: 'Token refreshed successfully' },
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

    if (!user || !user.userId) {
      return c.json(
        { success: false, error: 'Unauthorized', message: 'Authentication required' },
        401
      );
    }

    const [dbUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.userId))
      .limit(1);

    if (!dbUser) {
      return c.json(
        { success: false, error: 'User not found', message: 'User account no longer exists' },
        404
      );
    }

    return c.json({
      success: true,
      data: { user: formatUserResponse(dbUser) as any },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to get user',
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
            await cache.set(`token:denylist:${accessToken}`, true, remainingTTL);
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
            await cache.set(`token:denylist:${refreshToken}`, true, remainingTTL);
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
    data: { message: 'If an account exists with that email, a reset link has been sent.' },
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

    const payload = await c.req.json() as { email: string };
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
        'Password reset email was NOT sent for user:', user.id
      );
      return c.json(SAFE_RESPONSE, 200);
    }

    // Fire-and-forget email via Resend — failure must not block the response
    try {
      const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
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
    const { token, password } = await c.req.json() as { token: string; password: string };

    // Direct deterministic lookup — no bcrypt comparison required
    const [tokenRecord] = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.tokenHash, token))
      .limit(1);

    // Guard 1: Token does not exist
    if (!tokenRecord) {
      return c.json(
        { success: false, error: 'Invalid or expired reset token', message: 'This reset link is invalid or has already been used.' },
        400
      );
    }

    // Guard 2: Token has expired
    if (tokenRecord.expiresAt < new Date()) {
      return c.json(
        { success: false, error: 'Invalid or expired reset token', message: 'This reset link has expired. Please request a new one.' },
        400
      );
    }

    // Guard 3: Token already consumed
    if (tokenRecord.usedAt !== null) {
      return c.json(
        { success: false, error: 'Invalid or expired reset token', message: 'This reset link has already been used.' },
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
      data: { message: 'Your password has been reset successfully. You can now sign in.' },
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
