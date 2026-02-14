/**
 * OAuth 2.0 Routes (Hono)
 * 
 * Provides OAuth authentication endpoints for:
 * - Google OAuth 2.0
 * - GitHub OAuth 2.0
 * 
 * Flow:
 * 1. Client initiates OAuth (/oauth/{provider})
 * 2. User authenticates with provider
 * 3. Provider redirects to callback (/oauth/{provider}/callback)
 * 4. Server creates/links user and returns JWT tokens
 * 5. Client redirects to app with tokens
 * 
 * Edge-compatible using Hono and Arctic
 */

import { Hono } from 'hono';
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
import { authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';

const app = new Hono();

/**
 * Validation Schemas
 */
const initiateOAuthSchema = z.object({
  redirectUri: z.string().url('Invalid redirect URI'),
});

const callbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State is required'),
});

const unlinkProviderSchema = z.object({
  provider: z.enum(['google', 'github']),
});

// ============================================================================
// GOOGLE OAUTH
// ============================================================================

/**
 * @route   GET /oauth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 * @query   redirectUri - Client redirect URI (required)
 */
app.get('/google', zValidator('query', initiateOAuthSchema), async (c) => {
  try {
    const { redirectUri } = c.req.valid('query');
    
    // Generate OAuth authorization URL
    const authUrl = await initiateGoogleOAuth(redirectUri);
    
    // Redirect user to Google
    return c.redirect(authUrl);
  } catch (error) {
    logger.error('Google OAuth initiation failed:', error);
    return c.json(
      {
        success: false,
        error: 'OAuthError',
        message: error instanceof Error ? error.message : 'Failed to initiate Google OAuth',
      },
      500
    );
  }
});

/**
 * @route   GET /oauth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 * @query   code - Authorization code (required)
 * @query   state - OAuth state (required)
 */
app.get('/google/callback', zValidator('query', callbackSchema), async (c) => {
  try {
    const { code, state } = c.req.valid('query');
    
    // Handle OAuth callback
    const result = await handleGoogleCallback(code, state);
    
    // Generate JWT tokens
    const tokens = await generateTokens(
      result.user.id,
      result.user.email,
      result.user.role
    );
    
    // Redirect to client with tokens
    const redirectUrl = new URL(result.redirectUri);
    redirectUrl.searchParams.set('access_token', tokens.accessToken);
    redirectUrl.searchParams.set('refresh_token', tokens.refreshToken);
    redirectUrl.searchParams.set('is_new_user', result.isNewUser.toString());
    
    return c.redirect(redirectUrl.toString());
  } catch (error) {
    logger.error('Google OAuth callback failed:', error);
    
    // Redirect to client with error
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
 * @query   redirectUri - Client redirect URI (required)
 */
app.get('/github', zValidator('query', initiateOAuthSchema), async (c) => {
  try {
    const { redirectUri } = c.req.valid('query');
    
    // Generate OAuth authorization URL
    const authUrl = await initiateGitHubOAuth(redirectUri);
    
    // Redirect user to GitHub
    return c.redirect(authUrl);
  } catch (error) {
    logger.error('GitHub OAuth initiation failed:', error);
    return c.json(
      {
        success: false,
        error: 'OAuthError',
        message: error instanceof Error ? error.message : 'Failed to initiate GitHub OAuth',
      },
      500
    );
  }
});

/**
 * @route   GET /oauth/github/callback
 * @desc    Handle GitHub OAuth callback
 * @access  Public
 * @query   code - Authorization code (required)
 * @query   state - OAuth state (required)
 */
app.get('/github/callback', zValidator('query', callbackSchema), async (c) => {
  try {
    const { code, state } = c.req.valid('query');
    
    // Handle OAuth callback
    const result = await handleGitHubCallback(code, state);
    
    // Generate JWT tokens
    const tokens = await generateTokens(
      result.user.id,
      result.user.email,
      result.user.role
    );
    
    // Redirect to client with tokens
    const redirectUrl = new URL(result.redirectUri);
    redirectUrl.searchParams.set('access_token', tokens.accessToken);
    redirectUrl.searchParams.set('refresh_token', tokens.refreshToken);
    redirectUrl.searchParams.set('is_new_user', result.isNewUser.toString());
    
    return c.redirect(redirectUrl.toString());
  } catch (error) {
    logger.error('GitHub OAuth callback failed:', error);
    
    // Redirect to client with error
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
      const userId = c.get('userId');
      
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
      logger.error('OAuth unlink failed:', error);
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
