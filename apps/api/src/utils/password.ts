/**
 * Password Utilities (Edge-Native)
 *
 * Uses the native Web Crypto API (PBKDF2) instead of bcryptjs.
 * bcryptjs is forbidden on Cloudflare Workers (causes CPU time limit crashes).
 *
 * Storage format: "salt:hash" concatenated string in the passwordHash column.
 */

/**
 * Hash a password using Web Crypto API PBKDF2
 * Returns a "salt:hash" string suitable for database storage.
 */
export async function hashPassword(
  password: string,
  saltString?: string
): Promise<string> {
  const salt = saltString
    ? Uint8Array.from(atob(saltString), (c) => c.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  const saltBase64 = btoa(String.fromCharCode(...salt));

  // Return concatenated "salt:hash" format for single-column storage
  return `${saltBase64}:${hashBase64}`;
}

/**
 * Verify a password against a stored "salt:hash" string.
 */
export async function verifyPassword(
  password: string,
  storedPasswordHash: string
): Promise<boolean> {
  const [storedSalt, storedHash] = storedPasswordHash.split(':');
  if (!storedSalt || !storedHash) return false;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: Uint8Array.from(atob(storedSalt), (c) => c.charCodeAt(0)),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const computedHash = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return computedHash === storedHash;
}

/**
 * Check if a hash is in the legacy bcrypt format (starts with "$2a$" or "$2b$").
 * Used for migration: on login, detect bcrypt → re-hash with PBKDF2.
 */
export function isLegacyBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$');
}

// Legacy aliases for backward compatibility during migration
export const comparePassword = verifyPassword;
