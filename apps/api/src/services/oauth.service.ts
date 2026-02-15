/**
 * OAuth 2.0 Service Layer - SECURITY HARDENED
 * 
 * Handles OAuth authentication flows for:
 * - Google OAuth 2.0
 * - GitHub OAuth 2.0
 * 
 * Security Enhancements:
 * - State management via HttpOnly cookies (routes layer)
 * - Automatic user creation for new OAuth users
 * - Account linking (link OAuth to existing email)
 * - Profile data sync (name, avatarUrl)
 * - Email verification via OAuth
 * - PKCE support (Google)
 * 
 * Edge-compatible using Arctic library
 */

import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { cache } from '../config/redis.config';
import {
  getGoogleAuthUrl,
  getGitHubAuthUrl,
  validateGoogleCallback,
  validateGitHubCallback,
  getGoogleProfile,
  getGitHubProfile,
  isOAuthProviderEnabled,
  type OAuthProvider,
  type OAuthProfile,
} from '../config/oauth.config';
import { logger } from '../utils/logger';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { UserRole, UserStatus } from '@validiant/shared';

/**
 * PKCE data stored in Redis (Google only)
 */
interface PKCEData {
  codeVerifier: string;
  createdAt: number;
}

/**
 * OAuth Result
 */
interface OAuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    createdAt: Date;
  };
  isNewUser: boolean;
}

/**
 * OAuth Initiation Result
 */
interface OAuthInitResult {
  authUrl: string;
  state: string;
}

/**
 * Generate PKCE code verifier
 * 
 * @returns Code verifier (72 characters)
 */
const generateCodeVerifier = (): string => {
  return uuidv4() + uuidv4(); // 72 characters
};

/**
 * Store PKCE data in Redis
 * 
 * @param state - OAuth state
 * @param codeVerifier - PKCE code verifier
 */
const storePKCEData = async (state: string, codeVerifier: string): Promise<void> => {
  const pkceData: PKCEData = {
    codeVerifier,
    createdAt: Date.now(),
  };
  
  // Store PKCE data for 10 minutes
  await cache.set(`oauth:pkce:${state}`, pkceData, 600);
};

/**
 * Retrieve PKCE data from Redis
 * 
 * @param state - OAuth state
 * @returns PKCE data
 */
const getPKCEData = async (state: string): Promise<PKCEData | null> => {
  const pkceData = await cache.get<PKCEData>(`oauth:pkce:${state}`);
  
  if (pkceData) {
    // Delete after retrieval (one-time use)
    await cache.del(`oauth:pkce:${state}`);
  }
  
  return pkceData;
};

/**
 * Find or create user from OAuth profile
 * 
 * @param profile - OAuth profile
 * @param provider - OAuth provider
 * @returns User and isNewUser flag
 */
const findOrCreateOAuthUser = async (
  profile: OAuthProfile,
  provider: OAuthProvider
): Promise<OAuthResult> => {
  // Check if user exists by OAuth provider ID
  const providerIdField = provider === 'google' ? 'googleId' : 'githubId';
  
  let [existingUser] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users[providerIdField], profile.id),
        isNull(users.deletedAt)
      )
    )
    .limit(1);
  
  if (existingUser) {
    // Update profile data (avatarUrl, name) if changed
    if (existingUser.avatarUrl !== profile.avatarUrl || existingUser.fullName !== profile.name) {
      [existingUser] = await db
        .update(users)
        .set({
          avatarUrl: profile.avatarUrl,
          fullName: profile.name,
          lastLoginAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
    } else {
      // Just update last login
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, existingUser.id));
    }
    
    logger.info('User logged in via OAuth', {
      userId: existingUser.id,
      provider,
      email: existingUser.email,
    });
    
    return {
      user: {
        ...existingUser,
        role: existingUser.role as UserRole,
        status: existingUser.status as UserStatus,
      },
      isNewUser: false,
    };
  }
  
  // Check if user exists by email (account linking)
  [existingUser] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, profile.email.toLowerCase()),
        isNull(users.deletedAt)
      )
    )
    .limit(1);
  
  if (existingUser) {
    // Link OAuth provider to existing account
    [existingUser] = await db
      .update(users)
      .set({
        [providerIdField]: profile.id,
        avatarUrl: profile.avatarUrl || existingUser.avatarUrl,
        emailVerified: profile.emailVerified || existingUser.emailVerified,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, existingUser.id))
      .returning();
    
    logger.info('OAuth provider linked to existing account', {
      userId: existingUser.id,
      provider,
      email: existingUser.email,
    });
    
    return {
      user: {
        ...existingUser,
        role: existingUser.role as UserRole,
        status: existingUser.status as UserStatus,
      },
      isNewUser: false,
    };
  }
  
  // Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      email: profile.email.toLowerCase(),
      fullName: profile.name,
      avatarUrl: profile.avatarUrl,
      [providerIdField]: profile.id,
      role: UserRole.USER as UserRole,
      status: UserStatus.ACTIVE as UserStatus,
      emailVerified: profile.emailVerified,
      passwordHash: null, // No password for OAuth users
      lastLoginAt: new Date(),
    })
    .returning();
  
  logger.info('New user created via OAuth', {
    userId: newUser.id,
    provider,
    email: newUser.email,
  });
  
  return {
    user: {
      ...newUser,
      role: newUser.role as UserRole,
      status: newUser.status as UserStatus,
    },
    isNewUser: true,
  };
};

/**
 * Initiate Google OAuth flow
 * 
 * @returns Authorization URL and state
 */
export const initiateGoogleOAuth = async (): Promise<OAuthInitResult> => {
  if (!isOAuthProviderEnabled('google')) {
    throw new BadRequestError('Google OAuth is not configured');
  }
  
  // Generate state
  const state = uuidv4();
  
  // Generate PKCE code verifier
  const codeVerifier = generateCodeVerifier();
  
  // Store PKCE data in Redis (state verification happens in routes via cookie)
  await storePKCEData(state, codeVerifier);
  
  // Get authorization URL
  const authUrl = getGoogleAuthUrl(state, codeVerifier);
  
  return { authUrl, state };
};

/**
 * Initiate GitHub OAuth flow
 * 
 * @returns Authorization URL and state
 */
export const initiateGitHubOAuth = async (): Promise<OAuthInitResult> => {
  if (!isOAuthProviderEnabled('github')) {
    throw new BadRequestError('GitHub OAuth is not configured');
  }
  
  // Generate state
  const state = uuidv4();
  
  // Get authorization URL
  const authUrl = getGitHubAuthUrl(state);
  
  return { authUrl, state };
};

/**
 * Handle Google OAuth callback
 * 
 * @param code - Authorization code
 * @param state - State token (already verified by routes layer)
 * @returns OAuth result with user
 */
export const handleGoogleCallback = async (
  code: string,
  state: string
): Promise<OAuthResult> => {
  // Retrieve PKCE data
  const pkceData = await getPKCEData(state);
  
  if (!pkceData) {
    throw new UnauthorizedError('Missing or expired PKCE data');
  }
  
  // Exchange code for tokens
  const tokens = await validateGoogleCallback(code, pkceData.codeVerifier);
  
  // Fetch user profile
  const profile = await getGoogleProfile(tokens.accessToken);
  
  // Find or create user
  const result = await findOrCreateOAuthUser(profile, 'google');
  
  return result;
};

/**
 * Handle GitHub OAuth callback
 * 
 * @param code - Authorization code
 * @param _state - State token (already verified by routes layer)
 * @returns OAuth result with user
 */
export const handleGitHubCallback = async (
  code: string,
  _state: string
): Promise<OAuthResult> => {
  // Exchange code for token
  const accessToken = await validateGitHubCallback(code);
  
  // Fetch user profile
  const profile = await getGitHubProfile(accessToken);
  
  // Find or create user
  const result = await findOrCreateOAuthUser(profile, 'github');
  
  return result;
};

/**
 * Unlink OAuth provider from user account
 * 
 * @param userId - User ID
 * @param provider - OAuth provider to unlink
 */
export const unlinkOAuthProvider = async (
  userId: string,
  provider: OAuthProvider
): Promise<void> => {
  const providerIdField = provider === 'google' ? 'googleId' : 'githubId';
  
  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);
  
  if (!user) {
    throw new BadRequestError('User not found');
  }
  
  // Check if user has password or other OAuth provider
  const hasPassword = !!user.passwordHash;
  const hasOtherProvider = provider === 'google' ? !!user.githubId : !!user.googleId;
  
  if (!hasPassword && !hasOtherProvider) {
    throw new BadRequestError(
      'Cannot unlink last authentication method. Set a password first.'
    );
  }
  
  // Unlink provider
  await db
    .update(users)
    .set({ [providerIdField]: null })
    .where(eq(users.id, userId));
  
  logger.info('OAuth provider unlinked', { userId, provider });
};
