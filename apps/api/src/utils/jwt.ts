/**
 * JWT Utilities
 *
 * JWT token generation and verification.
 * Uses jose library for edge-compatible JWT operations.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../config/env.config';

/**
 * JWT payload structure
 */
export interface TokenPayload extends JWTPayload {
  sub: string;
  userId: string;
  email: string;
  role?: string;
  organizationId?: string;
  permissions?: string[]; // Mini-Phase 5: Custom Role Permissions
  permissionsVersion?: number; // Mini-Phase 1 compliance
  exp?: number;
}

/**
 * Secret key for JWT signing
 */
const getSecretKey = (): Uint8Array => {
  const secret = env.JWT_SECRET;
  return new TextEncoder().encode(secret);
};

/**
 * Generate JWT token
 */
export const generateToken = async (
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  expiresIn: string = '15m'
): Promise<string> => {
  const secret = getSecretKey();

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn as string)
    .sign(secret);
};

/**
 * Get secret fingerprint for parity checking without exposing the actual secret (Finding 42)
 */
export const getSecretFingerprint = async (): Promise<string> => {
  try {
    const secret = env.JWT_SECRET;
    if (!secret) return 'MISSING';

    // Edge-compatible fingerprinting
    const msgBuffer = new TextEncoder().encode(secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return hashHex.substring(0, 8); // 8 chars is enough for parity check
  } catch (e) {
    // Fallback if crypto/subtle is unavailable in specific environment
    const secret = env.JWT_SECRET || '';
    return `fallback-${secret.length}-${secret.substring(0, 2)}`;
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = async (token: string): Promise<TokenPayload> => {
  const secret = getSecretKey();

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as TokenPayload;
  } catch (error: any) {
    const fingerprint = await getSecretFingerprint();
    // We append the fingerprint to the error message so the middleware logger captures it
    throw new Error(`Invalid or expired token [FP:${fingerprint}]`);
  }
};

/**
 * Decode JWT token without verification (use carefully)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return payload as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  return Date.now() >= payload.exp * 1000;
};

/**
 * Extract token from Authorization header
 */
export const extractBearerToken = (
  authHeader: string | undefined | null
): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = async (
  payload: Omit<TokenPayload, 'iat' | 'exp'>
): Promise<string> => {
  return generateToken(payload, '7d');
};
