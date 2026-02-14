/**
 * Password Utilities
 * 
 * Functions for hashing and comparing passwords.
 * Uses bcryptjs (pure JS) instead of bcrypt (native) for edge compatibility.
 */

import bcrypt from 'bcryptjs';
import { env } from '../config/env.config';

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
