/**
 * JWT Utilities
 * 
 * JWT token generation and verification.
 * Uses jose library for edge-compatible JWT operations.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../config/env';

/**
 * JWT payload structure
 */
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role?: string;
  organizationId?: string;
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
  expiresIn: string = '7d'
): Promise<string> => {
  const secret = getSecretKey();

  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn as string)
    .sign(secret);
};

/**
 * Verify JWT token
 */
export const verifyToken = async (token: string): Promise<TokenPayload> => {
  const secret = getSecretKey();

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
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
export const extractBearerToken = (authHeader: string | null): string | null => {
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
  return generateToken(payload, '30d');
};
