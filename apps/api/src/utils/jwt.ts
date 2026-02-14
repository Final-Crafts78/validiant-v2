/**
 * JWT Utilities
 * 
 * Functions for generating and verifying JWT tokens.
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiration,
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiration,
  });
};

/**
 * Verify access token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Decode token without verification
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};
