/**
 * Passkey (WebAuthn) Routes (Hono) - SECURITY HARDENED
 * 
 * Provides passkey authentication endpoints using WebAuthn/FIDO2.
 * 
 * Security Features:
 * - HttpOnly cookies for challenges (CSRF protection)
 * - HttpOnly cookies for JWT tokens (no URL exposure)
 * - Challenge verification prevents tampering
 * - One-time use challenges
 * - Counter-based replay protection
 * 
 * Supported Flows:
 * 1. Passkey Registration (authenticated users)
 * 2. Passkey Authentication (passwordless login)
 * 3. Passkey Management (list, delete, rename)
 * 
 * Edge-compatible using Hono and SimpleWebAuthn
 */

import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
  getUserPasskeys,
  deletePasskey,
  updatePasskeyDeviceName,
} from '../services/passkey.service';
import { generateTokens } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { env } from '../config/env.config';
import { challengeCookieOptions } from '../config/webauthn.config';

const app = new Hono();

/**
 * Validation Schemas
 */
const registrationOptionsSchema = z.object({
  deviceName: z.string().optional(),
});

const registrationVerifySchema = z.object({
  response: z.any(), // WebAuthn registration response (complex object)
  deviceName: z.string().optional(),
});

const authenticationOptionsSchema = z.object({
  email: z.string().email().optional(),
});

const authenticationVerifySchema = z.object({
  response: z.any(), // WebAuthn authentication response (complex object)
});

const updateDeviceNameSchema = z.object({
  deviceName: z.string().min(1).max(100),
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

// ============================================================================
// PASSKEY REGISTRATION (Authenticated Users)
// ============================================================================

/**
 * @route   POST /passkey/register/options
 * @desc    Generate passkey registration options
 * @access  Protected
 * @security Sets passkey_challenge cookie for verification
 */
app.post(
  '/register/options',
  authenticate,
  zValidator('json', registrationOptionsSchema),
  async (c) => {
    try {
      const userId = c.get('userId');
      const userEmail = c.get('userEmail');
      const userName = c.get('userName');
      
      if (!userId || !userEmail) {
        return c.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'User not authenticated',
          },
          401
        );
      }
      
      // Generate registration options
      const { options, challenge } = await generatePasskeyRegistrationOptions(
        userId,
        userEmail,
        userName || userEmail
      );
      
      // Store challenge in HttpOnly cookie (CSRF protection)
      setCookie(c, 'passkey_challenge', challenge, challengeCookieOptions);
      
      logger.info('Passkey registration options generated', { userId });
      
      return c.json({
        success: true,
        options,
      });
    } catch (error) {
      logger.error('Passkey registration options failed:', error as Error);
      return c.json(
        {
          success: false,
          error: 'PasskeyError',
          message: error instanceof Error ? error.message : 'Failed to generate registration options',
        },
        500
      );
    }
  }
);

/**
 * @route   POST /passkey/register/verify
 * @desc    Verify passkey registration and store credential
 * @access  Protected
 * @security Verifies passkey_challenge cookie
 */
app.post(
  '/register/verify',
  authenticate,
  zValidator('json', registrationVerifySchema),
  async (c) => {
    try {
      const userId = c.get('userId');
      const { response, deviceName } = c.req.valid('json');
      
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
      
      // Retrieve challenge from cookie (CSRF protection)
      const challenge = getCookie(c, 'passkey_challenge');
      
      if (!challenge) {
        return c.json(
          {
            success: false,
            error: 'ChallengeError',
            message: 'Missing challenge - please restart registration',
          },
          400
        );
      }
      
      // Verify registration
      const result = await verifyPasskeyRegistration(userId, response, challenge, deviceName);
      
      // Delete challenge cookie after use (one-time use)
      deleteCookie(c, 'passkey_challenge');
      
      logger.info('Passkey registered successfully', {
        userId,
        credentialID: result.credentialID,
      });
      
      return c.json({
        success: true,
        credential: result,
        message: 'Passkey registered successfully',
      });
    } catch (error) {
      // Delete challenge cookie on error
      deleteCookie(c, 'passkey_challenge');
      
      logger.error('Passkey registration verification failed:', error as Error);
      return c.json(
        {
          success: false,
          error: 'VerificationError',
          message: error instanceof Error ? error.message : 'Registration verification failed',
        },
        400
      );
    }
  }
);

// ============================================================================
// PASSKEY AUTHENTICATION (Passwordless Login)
// ============================================================================

/**
 * @route   POST /passkey/authenticate/options
 * @desc    Generate passkey authentication options
 * @access  Public
 * @security Sets passkey_challenge cookie for verification
 */
app.post(
  '/authenticate/options',
  zValidator('json', authenticationOptionsSchema),
  async (c) => {
    try {
      const { email } = c.req.valid('json');
      
      // Generate authentication options
      const { options, challenge } = await generatePasskeyAuthenticationOptions(email);
      
      // Store challenge in HttpOnly cookie (CSRF protection)
      setCookie(c, 'passkey_challenge', challenge, challengeCookieOptions);
      
      logger.info('Passkey authentication options generated', { email });
      
      return c.json({
        success: true,
        options,
      });
    } catch (error) {
      logger.error('Passkey authentication options failed:', error as Error);
      return c.json(
        {
          success: false,
          error: 'PasskeyError',
          message: error instanceof Error ? error.message : 'Failed to generate authentication options',
        },
        500
      );
    }
  }
);

/**
 * @route   POST /passkey/authenticate/verify
 * @desc    Verify passkey authentication and login user
 * @access  Public
 * @security Verifies passkey_challenge cookie, sets JWT cookies
 */
app.post(
  '/authenticate/verify',
  zValidator('json', authenticationVerifySchema),
  async (c) => {
    try {
      const { response } = c.req.valid('json');
      
      // Retrieve challenge from cookie (CSRF protection)
      const challenge = getCookie(c, 'passkey_challenge');
      
      if (!challenge) {
        return c.json(
          {
            success: false,
            error: 'ChallengeError',
            message: 'Missing challenge - please restart authentication',
          },
          400
        );
      }
      
      // Verify authentication
      const result = await verifyPasskeyAuthentication(response, challenge);
      
      // Delete challenge cookie after use (one-time use)
      deleteCookie(c, 'passkey_challenge');
      
      // Generate JWT tokens
      const tokens = await generateTokens(
        result.user.id,
        result.user.email,
        result.user.role
      );
      
      // Set tokens as HttpOnly cookies (SECURE - same as OAuth)
      setCookie(c, 'access_token', tokens.accessToken, accessTokenCookieOptions);
      setCookie(c, 'refresh_token', tokens.refreshToken, refreshTokenCookieOptions);
      
      // Set user metadata cookie (NOT HttpOnly - accessible by frontend)
      setCookie(c, 'user_id', result.user.id, {
        secure: isProduction,
        sameSite: 'Lax' as const,
        maxAge: 3600,
        path: '/',
      });
      
      logger.info('Passkey authentication successful', {
        userId: result.user.id,
        credentialID: result.credentialID,
      });
      
      return c.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          avatar: result.user.avatar,
          role: result.user.role,
        },
        message: 'Authentication successful',
      });
    } catch (error) {
      // Delete challenge cookie on error
      deleteCookie(c, 'passkey_challenge');
      
      logger.error('Passkey authentication verification failed:', error as Error);
      return c.json(
        {
          success: false,
          error: 'AuthenticationError',
          message: error instanceof Error ? error.message : 'Authentication failed',
        },
        401
      );
    }
  }
);

// ============================================================================
// PASSKEY MANAGEMENT
// ============================================================================

/**
 * @route   GET /passkey/list
 * @desc    Get user's passkeys
 * @access  Protected
 */
app.get('/list', authenticate, async (c) => {
  try {
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
    
    const passkeys = await getUserPasskeys(userId);
    
    return c.json({
      success: true,
      passkeys,
    });
  } catch (error) {
    logger.error('Get passkeys failed:', error as Error);
    return c.json(
      {
        success: false,
        error: 'PasskeyError',
        message: error instanceof Error ? error.message : 'Failed to get passkeys',
      },
      500
    );
  }
});

/**
 * @route   DELETE /passkey/:credentialID
 * @desc    Delete a passkey
 * @access  Protected
 */
app.delete('/:credentialID', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const credentialID = c.req.param('credentialID');
    
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
    
    await deletePasskey(userId, credentialID);
    
    return c.json({
      success: true,
      message: 'Passkey deleted successfully',
    });
  } catch (error) {
    logger.error('Delete passkey failed:', error as Error);
    return c.json(
      {
        success: false,
        error: 'PasskeyError',
        message: error instanceof Error ? error.message : 'Failed to delete passkey',
      },
      error instanceof Error && error.message.includes('Cannot delete') ? 400 : 500
    );
  }
});

/**
 * @route   PATCH /passkey/:credentialID/name
 * @desc    Update passkey device name
 * @access  Protected
 */
app.patch(
  '/:credentialID/name',
  authenticate,
  zValidator('json', updateDeviceNameSchema),
  async (c) => {
    try {
      const userId = c.get('userId');
      const credentialID = c.req.param('credentialID');
      const { deviceName } = c.req.valid('json');
      
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
      
      await updatePasskeyDeviceName(userId, credentialID, deviceName);
      
      return c.json({
        success: true,
        message: 'Device name updated successfully',
      });
    } catch (error) {
      logger.error('Update passkey device name failed:', error as Error);
      return c.json(
        {
          success: false,
          error: 'PasskeyError',
          message: error instanceof Error ? error.message : 'Failed to update device name',
        },
        500
      );
    }
  }
);

export default app;
