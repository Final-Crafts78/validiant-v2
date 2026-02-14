/**
 * WebAuthn / FIDO2 Configuration
 * 
 * Configuration for passkey (WebAuthn) authentication using SimpleWebAuthn library.
 * 
 * WebAuthn Terms:
 * - RP (Relying Party): The application/website (us)
 * - Authenticator: Hardware/software that creates and stores credentials (YubiKey, Touch ID, etc.)
 * - Credential: Public/private key pair used for authentication
 * - Challenge: Random string to prevent replay attacks
 * - Origin: The website URL where WebAuthn is initiated
 * 
 * Security Features:
 * - Challenge stored in HttpOnly cookie (not trusted from client)
 * - User verification (PIN, biometric) required
 * - Counter-based replay attack prevention
 * - Platform authenticator support (Face ID, Touch ID, Windows Hello)
 * - Roaming authenticator support (YubiKey, security keys)
 */

import { env } from './env.config';

/**
 * Relying Party (RP) Information
 * 
 * This identifies your application to the authenticator.
 */
export const rpName = 'Validiant';
export const rpID = new URL(env.WEB_APP_URL).hostname; // e.g., "validiant.com" or "localhost"

/**
 * Expected Origin
 * 
 * The full URL where WebAuthn ceremonies are initiated.
 * Must match the page URL exactly.
 */
export const expectedOrigin = env.WEB_APP_URL; // e.g., "https://validiant.com" or "http://localhost:3000"

/**
 * Timeout for WebAuthn Ceremonies (milliseconds)
 * 
 * How long the user has to interact with their authenticator.
 */
export const timeout = 60000; // 60 seconds

/**
 * User Verification Requirement
 * 
 * - "required": Always require PIN/biometric (most secure)
 * - "preferred": Request verification but allow fallback
 * - "discouraged": Don't request verification
 * 
 * For high-security applications, use "required".
 */
export const userVerification: 'required' | 'preferred' | 'discouraged' = 'preferred';

/**
 * Attestation Conveyance Preference
 * 
 * Controls what attestation data (authenticator info) is returned:
 * - "none": No attestation (fastest, most privacy-friendly)
 * - "indirect": Anonymized attestation
 * - "direct": Full attestation with authenticator details
 * - "enterprise": Managed attestation (enterprise devices)
 * 
 * For most use cases, "none" is recommended.
 */
export const attestation: 'none' | 'indirect' | 'direct' | 'enterprise' = 'none';

/**
 * Authenticator Selection Criteria
 * 
 * Controls which types of authenticators are allowed.
 */
export const authenticatorSelection = {
  /**
   * Authenticator Attachment
   * - "platform": Built-in authenticators only (Face ID, Touch ID, Windows Hello)
   * - "cross-platform": External authenticators only (YubiKey, USB keys)
   * - undefined: Allow both types
   */
  authenticatorAttachment: undefined as 'platform' | 'cross-platform' | undefined,
  
  /**
   * Require Resident Key (Discoverable Credential)
   * 
   * - true: Credential stored on authenticator (usernameless login)
   * - false: Credential ID must be provided by server
   * 
   * For passkeys, use true (enables "Sign in with passkey" button).
   */
  requireResidentKey: true,
  
  /**
   * User Verification
   * 
   * Same as global userVerification setting.
   */
  userVerification,
};

/**
 * Supported Algorithms
 * 
 * Public key algorithms supported for credential creation.
 * Order matters - first is preferred.
 * 
 * - -7: ES256 (ECDSA with SHA-256)
 * - -257: RS256 (RSASSA-PKCS1-v1_5 with SHA-256)
 * 
 * ES256 is preferred for its smaller signature size and wide support.
 */
export const supportedAlgorithms: number[] = [
  -7,   // ES256 (ECDSA with P-256 and SHA-256)
  -257, // RS256 (RSASSA-PKCS1-v1_5 with SHA-256)
];

/**
 * Challenge Storage Configuration
 * 
 * Challenges are stored in HttpOnly cookies for CSRF protection.
 * This configuration defines cookie settings.
 */
export const challengeCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'Lax' as const,
  maxAge: 300, // 5 minutes
  path: '/',
};

/**
 * WebAuthn Error Messages
 */
export const ErrorMessages = {
  CHALLENGE_MISMATCH: 'Challenge verification failed - possible tampering detected',
  CHALLENGE_MISSING: 'No challenge found - please restart registration/authentication',
  CREDENTIAL_EXISTS: 'This authenticator is already registered',
  CREDENTIAL_NOT_FOUND: 'Passkey not found - please register first',
  ORIGIN_MISMATCH: 'Origin verification failed - invalid request source',
  RP_ID_MISMATCH: 'Relying Party ID mismatch',
  VERIFICATION_FAILED: 'Signature verification failed - invalid credential',
  COUNTER_MISMATCH: 'Counter mismatch - possible cloned authenticator detected',
  USER_NOT_FOUND: 'User not found',
};

/**
 * Get RP ID with fallback for local development
 * 
 * In local development, rpID might be "localhost" which is valid.
 */
export const getRpId = (): string => {
  return rpID;
};

/**
 * Get expected origin with validation
 */
export const getExpectedOrigin = (): string => {
  return expectedOrigin;
};

/**
 * Validate WebAuthn is properly configured
 */
export const validateWebAuthnConfig = (): void => {
  if (!rpName || rpName.length === 0) {
    throw new Error('WebAuthn RP name is not configured');
  }
  
  if (!rpID || rpID.length === 0) {
    throw new Error('WebAuthn RP ID is not configured');
  }
  
  if (!expectedOrigin || !expectedOrigin.startsWith('http')) {
    throw new Error('WebAuthn expected origin is invalid');
  }
};

// Validate configuration on load
validateWebAuthnConfig();
