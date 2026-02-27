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
 * 
 * Clients are instantiated lazily on first use so that Cloudflare Worker
 * secrets (injected via initEnv per-request) are guaranteed to be present
 * at the point of construction — avoiding the cold-start null-client bug.
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
 * Lazy getter — creates a new Google OAuth client on every call using the
 * current value of `env` (already re-hydrated by initEnv at request time).
 */
const getGoogleClient = (): Google => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth is not configured');
  }
  return new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
};

/**
 * Lazy getter — creates a new GitHub OAuth client on every call using the
 * current value of `env` (already re-hydrated by initEnv at request time).
 */
const getGitHubClient = (): GitHub => {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_REDIRECT_URI) {
    throw new Error('GitHub OAuth is not configured');
  }
  return new GitHub(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, { redirectURI: env.GITHUB_REDIRECT_URI });
};

/**
 * Get Google OAuth authorization URL
 * 
 * @param state - CSRF protection token
 * @param codeVerifier - PKCE code verifier
 * @returns Authorization URL with PKCE
 */
export const getGoogleAuthUrl = async (state: string, codeVerifier: string): Promise<string> => {
  const scopes = ['openid', 'profile', 'email'];
  const url = await getGoogleClient().createAuthorizationURL(state, codeVerifier, { scopes });
  return url.toString();
};

/**
 * Get GitHub OAuth authorization URL
 * 
 * @param state - CSRF protection token
 * @returns Authorization URL
 */
export const getGitHubAuthUrl = async (state: string): Promise<string> => {
  const scopes = ['user:email', 'read:user'];
  const url = await getGitHubClient().createAuthorizationURL(state, { scopes });
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
  const tokens = await getGoogleClient().validateAuthorizationCode(code, codeVerifier);
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
  const tokens = await getGitHubClient().validateAuthorizationCode(code);
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
  if (provider === 'google') return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI);
  if (provider === 'github') return !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_REDIRECT_URI);
  return false;
};

/**
 * Get list of enabled OAuth providers
 * 
 * @returns Array of enabled provider names
 */
export const getEnabledProviders = (): OAuthProvider[] => {
  const providers: OAuthProvider[] = [];
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI) providers.push('google');
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_REDIRECT_URI) providers.push('github');
  return providers;
};
