/**
 * OAuth 2.0 Configuration (Edge-Compatible)
 * 
 * Uses Arctic library for edge-compatible OAuth flows.
 * Arctic provides:
 * - Zero Node.js dependencies
 * - Cloudflare Workers compatibility
 * - Built-in PKCE support
 * - Type-safe OAuth providers
 * 
 * Supported providers: Google, GitHub
 */

import { Google, GitHub } from 'arctic';
import { env } from './env.config';
import { logger } from '../utils/logger';

/**
 * OAuth Provider Types
 */
export type OAuthProvider = 'google' | 'github';

/**
 * OAuth User Profile (normalized across providers)
 */
export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

/**
 * Google OAuth Client
 * 
 * Scopes:
 * - openid: Required for OAuth 2.0
 * - profile: Access to user's name and avatar
 * - email: Access to user's email
 */
let googleClient: Google | null = null;

try {
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI) {
    googleClient = new Google(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );
    logger.info('✅ Google OAuth configured');
  } else {
    logger.warn('⚠️  Google OAuth not configured (missing credentials)');
  }
} catch (error) {
  logger.error('❌ Failed to initialize Google OAuth:', error);
}

/**
 * GitHub OAuth Client
 * 
 * Scopes:
 * - user:email: Access to user's email addresses
 * - read:user: Access to user's profile information
 */
let githubClient: GitHub | null = null;

try {
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_REDIRECT_URI) {
    githubClient = new GitHub(
      env.GITHUB_CLIENT_ID,
      env.GITHUB_CLIENT_SECRET,
      { redirectURI: env.GITHUB_REDIRECT_URI }
    );
    logger.info('✅ GitHub OAuth configured');
  } else {
    logger.warn('⚠️  GitHub OAuth not configured (missing credentials)');
  }
} catch (error) {
  logger.error('❌ Failed to initialize GitHub OAuth:', error);
}

/**
 * Get Google OAuth authorization URL
 * 
 * @param state - CSRF protection token
 * @param codeVerifier - PKCE code verifier
 * @returns Authorization URL with PKCE
 */
export const getGoogleAuthUrl = (state: string, codeVerifier: string): string => {
  if (!googleClient) {
    throw new Error('Google OAuth is not configured');
  }

  const scopes = ['openid', 'profile', 'email'];
  const url = googleClient.createAuthorizationURL(state, codeVerifier, { scopes });
  
  return url.toString();
};

/**
 * Get GitHub OAuth authorization URL
 * 
 * @param state - CSRF protection token
 * @returns Authorization URL
 */
export const getGitHubAuthUrl = (state: string): string => {
  if (!githubClient) {
    throw new Error('GitHub OAuth is not configured');
  }

  const scopes = ['user:email', 'read:user'];
  const url = githubClient.createAuthorizationURL(state, { scopes });
  
  return url.toString();
};

/**
 * Validate Google OAuth callback
 * 
 * @param code - Authorization code from Google
 * @param codeVerifier - PKCE code verifier
 * @returns Access tokens
 */
export const validateGoogleCallback = async (
  code: string,
  codeVerifier: string
): Promise<{ accessToken: string; refreshToken: string | null; idToken: string }> => {
  if (!googleClient) {
    throw new Error('Google OAuth is not configured');
  }

  const tokens = await googleClient.validateAuthorizationCode(code, codeVerifier);
  
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? null,
    idToken: tokens.idToken,
  };
};

/**
 * Validate GitHub OAuth callback
 * 
 * @param code - Authorization code from GitHub
 * @returns Access token
 */
export const validateGitHubCallback = async (code: string): Promise<string> => {
  if (!githubClient) {
    throw new Error('GitHub OAuth is not configured');
  }

  const tokens = await githubClient.validateAuthorizationCode(code);
  
  return tokens.accessToken;
};

/**
 * Fetch Google user profile
 * 
 * @param accessToken - Google access token
 * @returns Normalized user profile
 */
export const getGoogleProfile = async (accessToken: string): Promise<OAuthProfile> => {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google user profile');
  }

  const data = await response.json() as {
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email: boolean;
  };

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.picture,
    emailVerified: data.verified_email,
  };
};

/**
 * Fetch GitHub user profile
 * 
 * @param accessToken - GitHub access token
 * @returns Normalized user profile
 */
export const getGitHubProfile = async (accessToken: string): Promise<OAuthProfile> => {
  // Fetch user profile
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Validiant-API',
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub user profile');
  }

  const userData = await userResponse.json() as {
    id: number;
    login: string;
    name: string | null;
    avatar_url?: string;
  };

  // Fetch primary email
  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Validiant-API',
    },
  });

  if (!emailResponse.ok) {
    throw new Error('Failed to fetch GitHub user emails');
  }

  const emails = await emailResponse.json() as Array<{
    email: string;
    primary: boolean;
    verified: boolean;
  }>;

  const primaryEmail = emails.find((e) => e.primary) || emails[0];

  if (!primaryEmail) {
    throw new Error('No email found for GitHub user');
  }

  return {
    id: userData.id.toString(),
    email: primaryEmail.email,
    name: userData.name || userData.login,
    avatarUrl: userData.avatar_url,
    emailVerified: primaryEmail.verified,
  };
};

/**
 * Check if OAuth provider is enabled
 * 
 * @param provider - OAuth provider name
 * @returns true if provider is configured and enabled
 */
export const isOAuthProviderEnabled = (provider: OAuthProvider): boolean => {
  switch (provider) {
    case 'google':
      return googleClient !== null;
    case 'github':
      return githubClient !== null;
    default:
      return false;
  }
};

/**
 * Get list of enabled OAuth providers
 * 
 * @returns Array of enabled provider names
 */
export const getEnabledProviders = (): OAuthProvider[] => {
  const providers: OAuthProvider[] = [];
  
  if (googleClient) providers.push('google');
  if (githubClient) providers.push('github');
  
  return providers;
};
