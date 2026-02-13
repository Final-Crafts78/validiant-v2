/**
 * Password Utilities
 * 
 * Functions for hashing and comparing passwords.
 */

import bcrypt from 'bcrypt';
import { config } from '../config';

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.bcrypt.rounds);
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
