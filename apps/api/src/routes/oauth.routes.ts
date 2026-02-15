/**
 * OAuth 2.0 Routes (Hono) - SECURITY HARDENED
 * 
 * Provides OAuth authentication endpoints for:
 * - Google OAuth 2.0
 * - GitHub OAuth 2.0
 * 
 * Security Features:
 * - HttpOnly cookies for JWT tokens (no URL exposure)
 * - CSRF protection via oauth_state cookie
 * - Secure cookie flags (Secure, SameSite=Lax)
 * - State verification tied to browser session
 * 
 * Flow:
 * 1. Client initiates OAuth (/oauth/{provider})
 * 2. Server sets oauth_state cookie and redirects to provider
 * 3. User authenticates with provider
 * 4. Provider redirects to callback with code and state
 * 5. Server verifies state cookie matches URL state
 * 6. Server creates/links user and sets JWT cookies (HttpOnly)
 * 7. Client redirects to dashboard (tokens in cookies)
 * 
 * Edge-compatible using Hono and Arctic
 */

import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  initiateGoogleOAuth,
  initiateGitHubOAuth,
  handleGoogleCallback,
  handleGitHubCallback,
  unlinkOAuthProvider,
} from '../services/oauth.service';
import { generateTokens } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';

const app = new Hono();

/**
 * Validation Schemas
 */
const callbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State is required'),
});

const unlinkProviderSchema = z.object({
  provider: z.enum(['google', 'github']),
});

/**
 * Cookie Configuration
 */
const isProduction = env.NODE_ENV === 'production';

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'Lax' as const,
  maxAge: 3600, // 1 hour
  path: '/',
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'Lax' as const,
  maxAge: 604800, // 7 days
  path: '/',
};

const stateCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'Lax' as const,
  maxAge: 600, // 10 minutes
  path: '/',
};

// ============================================================================
// GOOGLE OAUTH
// ============================================================================

/**
 * @route   GET /oauth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 * @security Sets oauth_state cookie for CSRF protection
 */
app.get('/google', async (c) => {
  try {
    // Generate OAuth authorization URL with state
    const { authUrl, state } = await initiateGoogleOAuth();
    
    // Store state in HttpOnly cookie (CSRF protection)
    setCookie(c, 'oauth_state', state, stateCookieOptions);
    
    logger.info('Google OAuth initiated', { state });
    
    // Redirect user to Google
    return c.redirect(authUrl);
  } catch (error) {
    logger.error('Google OAuth initiation failed:', error as Error);
    
    // Redirect to error page
    const errorUrl = new URL(env.WEB_APP_URL + '/auth/error');
    errorUrl.searchParams.set('error', 'oauth_init_failed');
    errorUrl.searchParams.set(
      'message',
      error instanceof Error ? error.message : 'Failed to initiate Google OAuth'
    );
    
    return c.redirect(errorUrl.toString());
  }
});

/**
 * @route   GET /oauth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 * @query   code - Authorization code (required)
 * @query   state - OAuth state (required)
 * @security Verifies state cookie matches URL state (CSRF protection)
 */
app.get('/google/callback', zValidator('query', callbackSchema), async (c) => {
  try {
    const { code, state: urlState } = c.req.valid('query');
    
    // Retrieve state from cookie (CSRF protection)
    const cookieState = getCookie(c, 'oauth_state');
    
    if (!cookieState) {
      throw new Error('Missing OAuth state cookie');
    }
    
    if (cookieState !== urlState) {
      throw new Error('OAuth state mismatch - possible CSRF attack');
    }
    
    // Delete state cookie after verification (one-time use)
    deleteCookie(c, 'oauth_state');
    
    // Handle OAuth callback
    const result = await handleGoogleCallback(code, urlState);
    
    // Generate JWT tokens
    const tokens = await generateTokens(
      result.user.id,
      result.user.email,
      result.user.role
    );
    
    // Set tokens as HttpOnly cookies (SECURE)
    setCookie(c, 'access_token', tokens.accessToken, accessTokenCookieOptions);
    setCookie(c, 'refresh_token', tokens.refreshToken, refreshTokenCookieOptions);
    
    // Set user metadata cookie (NOT HttpOnly - accessible by frontend)
    setCookie(c, 'user_id', result.user.id, {
      secure: isProduction,
      sameSite: 'Lax' as const,
      maxAge: 3600,
      path: '/',
    });
    
    logger.info('Google OAuth successful', {
      userId: result.user.id,
      isNewUser: result.isNewUser,
    });
    
    // Redirect to dashboard (tokens in cookies)
    const dashboardUrl = result.isNewUser
      ? `${env.WEB_APP_URL}/onboarding`
      : `${env.WEB_APP_URL}/dashboard`;
    
    return c.redirect(dashboardUrl);
  } catch (error) {
    logger.error('Google OAuth callback failed:', error as Error);
    
    // Delete state cookie on error
    deleteCookie(c, 'oauth_state');
    
    // Redirect to error page
    const errorUrl = new URL(env.WEB_APP_URL + '/auth/error');
    errorUrl.searchParams.set('error', 'oauth_failed');
    errorUrl.searchParams.set(
      'message',
      error instanceof Error ? error.message : 'OAuth authentication failed'
    );
    
    return c.redirect(errorUrl.toString());
  }
});

// ============================================================================
// GITHUB OAUTH
// ============================================================================

/**
 * @route   GET /oauth/github
 * @desc    Initiate GitHub OAuth flow
 * @access  Public
 * @security Sets oauth_state cookie for CSRF protection
 */
app.get('/github', async (c) => {
  try {
    // Generate OAuth authorization URL with state
    const { authUrl, state } = await initiateGitHubOAuth();
    
    // Store state in HttpOnly cookie (CSRF protection)
    setCookie(c, 'oauth_state', state, stateCookieOptions);
    
    logger.info('GitHub OAuth initiated', { state });
    
    // Redirect user to GitHub
    return c.redirect(authUrl);
  } catch (error) {
    logger.error('GitHub OAuth initiation failed:', error as Error);
    
    // Redirect to error page
    const errorUrl = new URL(env.WEB_APP_URL + '/auth/error');
    errorUrl.searchParams.set('error', 'oauth_init_failed');
    errorUrl.searchParams.set(
      'message',
      error instanceof Error ? error.message : 'Failed to initiate GitHub OAuth'
    );
    
    return c.redirect(errorUrl.toString());
  }
});

/**
 * @route   GET /oauth/github/callback
 * @desc    Handle GitHub OAuth callback
 * @access  Public
 * @query   code - Authorization code (required)
 * @query   state - OAuth state (required)
 * @security Verifies state cookie matches URL state (CSRF protection)
 */
app.get('/github/callback', zValidator('query', callbackSchema), async (c) => {
  try {
    const { code, state: urlState } = c.req.valid('query');
    
    // Retrieve state from cookie (CSRF protection)
    const cookieState = getCookie(c, 'oauth_state');
    
    if (!cookieState) {
      throw new Error('Missing OAuth state cookie');
    }
    
    if (cookieState !== urlState) {
      throw new Error('OAuth state mismatch - possible CSRF attack');
    }
    
    // Delete state cookie after verification (one-time use)
    deleteCookie(c, 'oauth_state');
    
    // Handle OAuth callback
    const result = await handleGitHubCallback(code, urlState);
    
    // Generate JWT tokens
    const tokens = await generateTokens(
      result.user.id,
      result.user.email,
      result.user.role
    );
    
    // Set tokens as HttpOnly cookies (SECURE)
    setCookie(c, 'access_token', tokens.accessToken, accessTokenCookieOptions);
    setCookie(c, 'refresh_token', tokens.refreshToken, refreshTokenCookieOptions);
    
    // Set user metadata cookie (NOT HttpOnly - accessible by frontend)
    setCookie(c, 'user_id', result.user.id, {
      secure: isProduction,
      sameSite: 'Lax' as const,
      maxAge: 3600,
      path: '/',
    });
    
    logger.info('GitHub OAuth successful', {
      userId: result.user.id,
      isNewUser: result.isNewUser,
    });
    
    // Redirect to dashboard (tokens in cookies)
    const dashboardUrl = result.isNewUser
      ? `${env.WEB_APP_URL}/onboarding`
      : `${env.WEB_APP_URL}/dashboard`;
    
    return c.redirect(dashboardUrl);
  } catch (error) {
    logger.error('GitHub OAuth callback failed:', error as Error);
    
    // Delete state cookie on error
    deleteCookie(c, 'oauth_state');
    
    // Redirect to error page
    const errorUrl = new URL(env.WEB_APP_URL + '/auth/error');
    errorUrl.searchParams.set('error', 'oauth_failed');
    errorUrl.searchParams.set(
      'message',
      error instanceof Error ? error.message : 'OAuth authentication failed'
    );
    
    return c.redirect(errorUrl.toString());
  }
});

// ============================================================================
// OAUTH MANAGEMENT
// ============================================================================

/**
 * @route   POST /oauth/unlink/:provider
 * @desc    Unlink OAuth provider from account
 * @access  Protected
 * @param   provider - OAuth provider (google | github)
 */
app.post(
  '/unlink/:provider',
  authenticate,
  zValidator('param', unlinkProviderSchema),
  async (c) => {
    try {
      const { provider } = c.req.valid('param');
      const userId = c.get('userId' as never);
      
      if (!userId) {
        return c.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'User not authenticated',
          },
          401
        );
      }
      
      await unlinkOAuthProvider(userId, provider);
      
      return c.json({
        success: true,
        message: `${provider} account unlinked successfully`,
      });
    } catch (error) {
      logger.error('OAuth unlink failed:', error as Error);
      return c.json(
        {
          success: false,
          error: 'OAuthError',
          message: error instanceof Error ? error.message : 'Failed to unlink OAuth provider',
        },
        error instanceof Error && error.message.includes('Cannot unlink') ? 400 : 500
      );
    }
  }
);

export default app;
