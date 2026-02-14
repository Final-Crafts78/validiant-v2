/**
 * OAuth 2.0 Service Layer
 * 
 * Handles OAuth authentication flows for:
 * - Google OAuth 2.0
 * - GitHub OAuth 2.0
 * 
 * Features:
 * - Automatic user creation for new OAuth users
 * - Account linking (link OAuth to existing email)
 * - Profile data sync (name, avatar)
 * - Email verification via OAuth
 * - PKCE support (Google)
 * 
 * Edge-compatible using Arctic library
 */

import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull, or } from 'drizzle-orm';
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
import { BadRequestError, ConflictError, UnauthorizedError } from '../utils/errors';
import { UserRole, UserStatus } from '@validiant/shared';

/**
 * OAuth State Data (stored in Redis)
 */
interface OAuthState {
  provider: OAuthProvider;
  redirectUri: string;
  codeVerifier?: string; // For PKCE (Google)
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
    avatar?: string | null;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    createdAt: Date;
  };
  isNewUser: boolean;
}

/**
 * Generate OAuth state token and store in Redis
 * 
 * @param provider - OAuth provider
 * @param redirectUri - Client redirect URI
 * @param codeVerifier - PKCE code verifier (optional)
 * @returns State token
 */
const generateOAuthState = async (
  provider: OAuthProvider,
  redirectUri: string,
  codeVerifier?: string
): Promise<string> => {
  const state = uuidv4();
  
  const stateData: OAuthState = {
    provider,
    redirectUri,
    codeVerifier,
    createdAt: Date.now(),
  };
  
  // Store state for 10 minutes
  await cache.set(`oauth:state:${state}`, stateData, 600);
  
  return state;
};

/**
 * Validate OAuth state and retrieve data
 * 
 * @param state - State token
 * @returns OAuth state data
 */
const validateOAuthState = async (state: string): Promise<OAuthState> => {
  const stateData = await cache.get<OAuthState>(`oauth:state:${state}`);
  
  if (!stateData) {
    throw new UnauthorizedError('Invalid or expired OAuth state');
  }
  
  // Delete state after use (one-time use)
  await cache.del(`oauth:state:${state}`);
  
  return stateData;
};

/**
 * Generate PKCE code verifier and challenge
 * 
 * @returns Code verifier and challenge
 */
const generatePKCE = (): { verifier: string; challenge: string } => {
  // Generate random code verifier
  const verifier = uuidv4() + uuidv4(); // 72 characters
  
  // In production, you'd use SHA256 hash
  // For simplicity, Arctic handles this internally
  const challenge = verifier;
  
  return { verifier, challenge };
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
    // Update profile data (avatar, name) if changed
    if (existingUser.avatar !== profile.avatar || existingUser.fullName !== profile.name) {
      [existingUser] = await db
        .update(users)
        .set({
          avatar: profile.avatar,
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
      user: existingUser,
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
        avatar: profile.avatar || existingUser.avatar,
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
      user: existingUser,
      isNewUser: false,
    };
  }
  
  // Create new user
  const [newUser] = await db
    .insert(users)
    .values({
      email: profile.email.toLowerCase(),
      fullName: profile.name,
      avatar: profile.avatar,
      [providerIdField]: profile.id,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
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
    user: newUser,
    isNewUser: true,
  };
};

/**
 * Initiate Google OAuth flow
 * 
 * @param redirectUri - Client redirect URI
 * @returns Authorization URL
 */
export const initiateGoogleOAuth = async (redirectUri: string): Promise<string> => {
  if (!isOAuthProviderEnabled('google')) {
    throw new BadRequestError('Google OAuth is not configured');
  }
  
  // Generate PKCE code verifier
  const { verifier } = generatePKCE();
  
  // Generate and store state
  const state = await generateOAuthState('google', redirectUri, verifier);
  
  // Get authorization URL
  const authUrl = getGoogleAuthUrl(state, verifier);
  
  return authUrl;
};

/**
 * Initiate GitHub OAuth flow
 * 
 * @param redirectUri - Client redirect URI
 * @returns Authorization URL
 */
export const initiateGitHubOAuth = async (redirectUri: string): Promise<string> => {
  if (!isOAuthProviderEnabled('github')) {
    throw new BadRequestError('GitHub OAuth is not configured');
  }
  
  // Generate and store state
  const state = await generateOAuthState('github', redirectUri);
  
  // Get authorization URL
  const authUrl = getGitHubAuthUrl(state);
  
  return authUrl;
};

/**
 * Handle Google OAuth callback
 * 
 * @param code - Authorization code
 * @param state - State token
 * @returns OAuth result with user and redirect URI
 */
export const handleGoogleCallback = async (
  code: string,
  state: string
): Promise<OAuthResult & { redirectUri: string }> => {
  // Validate state
  const stateData = await validateOAuthState(state);
  
  if (stateData.provider !== 'google') {
    throw new BadRequestError('Invalid OAuth provider');
  }
  
  if (!stateData.codeVerifier) {
    throw new BadRequestError('Missing PKCE code verifier');
  }
  
  // Exchange code for tokens
  const tokens = await validateGoogleCallback(code, stateData.codeVerifier);
  
  // Fetch user profile
  const profile = await getGoogleProfile(tokens.accessToken);
  
  // Find or create user
  const result = await findOrCreateOAuthUser(profile, 'google');
  
  return {
    ...result,
    redirectUri: stateData.redirectUri,
  };
};

/**
 * Handle GitHub OAuth callback
 * 
 * @param code - Authorization code
 * @param state - State token
 * @returns OAuth result with user and redirect URI
 */
export const handleGitHubCallback = async (
  code: string,
  state: string
): Promise<OAuthResult & { redirectUri: string }> => {
  // Validate state
  const stateData = await validateOAuthState(state);
  
  if (stateData.provider !== 'github') {
    throw new BadRequestError('Invalid OAuth provider');
  }
  
  // Exchange code for token
  const accessToken = await validateGitHubCallback(code);
  
  // Fetch user profile
  const profile = await getGitHubProfile(accessToken);
  
  // Find or create user
  const result = await findOrCreateOAuthUser(profile, 'github');
  
  return {
    ...result,
    redirectUri: stateData.redirectUri,
  };
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
