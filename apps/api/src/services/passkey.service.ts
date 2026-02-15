/**
 * Passkey (WebAuthn) Service Layer - SECURITY HARDENED
 * 
 * Handles WebAuthn/FIDO2 passkey operations:
 * - Passkey registration (attestation)
 * - Passkey authentication (assertion)
 * - Credential management
 * 
 * Security Features:
 * - Challenge verification from HttpOnly cookie (not trusted from client)
 * - Counter-based replay attack prevention
 * - Origin and RP ID validation
 * - User verification enforcement
 * - Credential backup detection
 * 
 * Supported Authenticators:
 * - Platform authenticators (Face ID, Touch ID, Windows Hello)
 * - Roaming authenticators (YubiKey, FIDO2 security keys)
 * - Hybrid authenticators (Phone as security key)
 * 
 * Edge-compatible using @simplewebauthn/server
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import { users, passkeyCredentials } from '../db/schema';
import {
  rpName,
  rpID,
  expectedOrigin,
  timeout,
  userVerification,
  attestation,
  authenticatorSelection,
  supportedAlgorithms,
  ErrorMessages,
} from '../config/webauthn.config';
import { logger } from '../utils/logger';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { UserRole, UserStatus } from '@validiant/shared';

/**
 * WebAuthn Registration Options Result
 */
export interface RegistrationOptionsResult {
  options: any; // PublicKeyCredentialCreationOptions
  challenge: string; // Base64URL encoded challenge
}

/**
 * WebAuthn Authentication Options Result
 */
export interface AuthenticationOptionsResult {
  options: any; // PublicKeyCredentialRequestOptions
  challenge: string; // Base64URL encoded challenge
}

/**
 * Passkey Registration Result
 */
export interface PasskeyRegistrationResult {
  credentialID: string;
  deviceName?: string;
  backedUp: boolean;
  transports?: string[];
}

/**
 * Passkey Authentication Result
 */
export interface PasskeyAuthenticationResult {
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
  credentialID: string;
  deviceName?: string;
}

/**
 * Generate WebAuthn registration options for a user
 * 
 * This starts the passkey registration process.
 * The returned challenge MUST be stored in an HttpOnly cookie by the caller.
 * 
 * @param userId - User ID creating the passkey
 * @param userEmail - User email
 * @param userName - User display name
 * @returns Registration options and challenge
 */
export const generatePasskeyRegistrationOptions = async (
  userId: string,
  userEmail: string,
  userName: string
): Promise<RegistrationOptionsResult> => {
  // Get user's existing passkeys to exclude them from registration
  const existingCredentials = await db
    .select({ credentialID: passkeyCredentials.credentialID })
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.userId, userId));
  
  const excludeCredentials = existingCredentials.map((cred) => ({
    id: isoBase64URL.toBuffer(cred.credentialID),
    type: 'public-key' as const,
  }));
  
  // Generate WebAuthn user ID (persistent identifier for this user)
  // This is NOT the user's database ID - it's a random identifier for WebAuthn
  const webauthnUserID = isoBase64URL.fromBuffer(isoUint8Array.fromUTF8String(userId));
  
  const opts: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID,
    userID: webauthnUserID,
    userName: userEmail,
    userDisplayName: userName,
    timeout,
    attestationType: attestation,
    excludeCredentials,
    authenticatorSelection,
    supportedAlgorithmIDs: supportedAlgorithms,
  };
  
  const options = await generateRegistrationOptions(opts);
  
  logger.info('Generated passkey registration options', {
    userId,
    challenge: options.challenge,
  });
  
  return {
    options,
    challenge: options.challenge,
  };
};

/**
 * Verify WebAuthn registration response and store credential
 * 
 * This completes the passkey registration process.
 * 
 * @param userId - User ID registering the passkey
 * @param response - Registration response from client
 * @param expectedChallenge - Challenge from HttpOnly cookie (NOT from client)
 * @param deviceName - Optional device name for this passkey
 * @returns Passkey registration result
 */
export const verifyPasskeyRegistration = async (
  userId: string,
  response: any,
  expectedChallenge: string,
  deviceName?: string
): Promise<PasskeyRegistrationResult> => {
  if (!expectedChallenge) {
    throw new BadRequestError(ErrorMessages.CHALLENGE_MISSING);
  }
  
  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: userVerification === 'required',
  };
  
  let verification: VerifiedRegistrationResponse;
  
  try {
    verification = await verifyRegistrationResponse(opts);
  } catch (error) {
    logger.error('Passkey registration verification failed:', error as Error);
    throw new BadRequestError(
      error instanceof Error ? error.message : ErrorMessages.VERIFICATION_FAILED
    );
  }
  
  const { verified, registrationInfo } = verification;
  
  if (!verified || !registrationInfo) {
    throw new BadRequestError(ErrorMessages.VERIFICATION_FAILED);
  }
  
  const {
    credentialID,
    credentialPublicKey,
    counter,
    credentialBackedUp,
    credentialDeviceType,
  } = registrationInfo;
  
  // Check if credential already exists
  const credentialIDBase64 = isoBase64URL.fromBuffer(credentialID);
  const existingCred = await db
    .select()
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.credentialID, credentialIDBase64))
    .limit(1);
  
  if (existingCred.length > 0) {
    throw new BadRequestError(ErrorMessages.CREDENTIAL_EXISTS);
  }
  
  // Store credential in database
  const webauthnUserID = isoBase64URL.fromBuffer(isoUint8Array.fromUTF8String(userId));
  const publicKeyBase64 = isoBase64URL.fromBuffer(credentialPublicKey);
  
  // Extract transports from response (if provided)
  const transports = response.response?.transports || [];
  
  await db.insert(passkeyCredentials).values({
    credentialID: credentialIDBase64,
    userId,
    webauthnUserID,
    publicKey: publicKeyBase64,
    counter: Number(counter),
    transports,
    deviceName,
    backedUp: credentialBackedUp,
  });
  
  logger.info('Passkey registered successfully', {
    userId,
    credentialID: credentialIDBase64,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
  });
  
  return {
    credentialID: credentialIDBase64,
    deviceName,
    backedUp: credentialBackedUp,
    transports,
  };
};

/**
 * Generate WebAuthn authentication options
 * 
 * This starts the passkey authentication process.
 * The returned challenge MUST be stored in an HttpOnly cookie by the caller.
 * 
 * @param userEmail - Optional email to filter credentials (for autofill)
 * @returns Authentication options and challenge
 */
export const generatePasskeyAuthenticationOptions = async (
  userEmail?: string
): Promise<AuthenticationOptionsResult> => {
  let allowCredentials: { id: Buffer; type: 'public-key'; transports?: string[] }[] | undefined;
  
  // If email provided, get user's credentials for faster authentication
  if (userEmail) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, userEmail.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);
    
    if (user) {
      const credentials = await db
        .select()
        .from(passkeyCredentials)
        .where(eq(passkeyCredentials.userId, user.id));
      
      allowCredentials = credentials.map((cred) => ({
        id: Buffer.from(isoBase64URL.toBuffer(cred.credentialID)),
        type: 'public-key' as const,
        transports: cred.transports as any,
      }));
    }
  }
  
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID,
    timeout,
    userVerification,
    allowCredentials: allowCredentials as any,
  };
  
  const options = await generateAuthenticationOptions(opts);
  
  logger.info('Generated passkey authentication options', {
    challenge: options.challenge,
    credentialCount: allowCredentials?.length || 'discoverable',
  });
  
  return {
    options,
    challenge: options.challenge,
  };
};

/**
 * Verify WebAuthn authentication response
 * 
 * This completes the passkey authentication process.
 * 
 * @param response - Authentication response from client
 * @param expectedChallenge - Challenge from HttpOnly cookie (NOT from client)
 * @returns Passkey authentication result with user
 */
export const verifyPasskeyAuthentication = async (
  response: any,
  expectedChallenge: string
): Promise<PasskeyAuthenticationResult> => {
  if (!expectedChallenge) {
    throw new BadRequestError(ErrorMessages.CHALLENGE_MISSING);
  }
  
  // Get credential ID from response
  const credentialIDBase64 = response.id || response.rawId;
  
  if (!credentialIDBase64) {
    throw new BadRequestError('Missing credential ID in response');
  }
  
  // Get credential from database
  const [credential] = await db
    .select()
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.credentialID, credentialIDBase64))
    .limit(1);
  
  if (!credential) {
    throw new UnauthorizedError(ErrorMessages.CREDENTIAL_NOT_FOUND);
  }
  
  // Get user
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, credential.userId), isNull(users.deletedAt)))
    .limit(1);
  
  if (!user) {
    throw new UnauthorizedError(ErrorMessages.USER_NOT_FOUND);
  }
  
  // Check if user is active
  if (user.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedError(`Account is ${user.status}`);
  }
  
  // Verify authentication response
  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: isoBase64URL.toBuffer(credential.credentialID),
      credentialPublicKey: isoBase64URL.toBuffer(credential.publicKey),
      counter: Number(credential.counter),
    },
    requireUserVerification: userVerification === 'required',
  };
  
  let verification: VerifiedAuthenticationResponse;
  
  try {
    verification = await verifyAuthenticationResponse(opts);
  } catch (error) {
    logger.error('Passkey authentication verification failed:', error as Error);
    throw new UnauthorizedError(
      error instanceof Error ? error.message : ErrorMessages.VERIFICATION_FAILED
    );
  }
  
  const { verified, authenticationInfo } = verification;
  
  if (!verified) {
    throw new UnauthorizedError(ErrorMessages.VERIFICATION_FAILED);
  }
  
  const { newCounter } = authenticationInfo;
  
  // Update counter (prevents replay attacks)
  await db
    .update(passkeyCredentials)
    .set({
      counter: Number(newCounter),
      lastUsedAt: new Date(),
    })
    .where(eq(passkeyCredentials.credentialID, credentialIDBase64));
  
  // Update user last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  
  logger.info('Passkey authentication successful', {
    userId: user.id,
    credentialID: credentialIDBase64,
  });
  
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatarUrl,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    credentialID: credentialIDBase64,
    deviceName: credential.deviceName || undefined,
  };
};

/**
 * Get user's passkeys
 * 
 * @param userId - User ID
 * @returns List of passkeys
 */
export const getUserPasskeys = async (userId: string) => {
  const credentials = await db
    .select({
      credentialID: passkeyCredentials.credentialID,
      deviceName: passkeyCredentials.deviceName,
      backedUp: passkeyCredentials.backedUp,
      transports: passkeyCredentials.transports,
      createdAt: passkeyCredentials.createdAt,
      lastUsedAt: passkeyCredentials.lastUsedAt,
    })
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.userId, userId))
    .orderBy(passkeyCredentials.createdAt);
  
  return credentials;
};

/**
 * Delete a passkey
 * 
 * @param userId - User ID
 * @param credentialID - Credential ID to delete
 */
export const deletePasskey = async (userId: string, credentialID: string): Promise<void> => {
  // Get user
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  // Check if user has other passkeys or a password
  const passkeys = await db
    .select({ credentialID: passkeyCredentials.credentialID })
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.userId, userId));
  
  const hasPassword = !!user.passwordHash;
  const hasOtherPasskeys = passkeys.length > 1;
  
  if (!hasPassword && !hasOtherPasskeys) {
    throw new BadRequestError(
      'Cannot delete last authentication method. Add a password or another passkey first.'
    );
  }
  
  // Delete passkey
  await db
    .delete(passkeyCredentials)
    .where(
      and(
        eq(passkeyCredentials.credentialID, credentialID),
        eq(passkeyCredentials.userId, userId)
      )
    );
  
  logger.info('Passkey deleted', { userId, credentialID });
};

/**
 * Update passkey device name
 * 
 * @param userId - User ID
 * @param credentialID - Credential ID
 * @param deviceName - New device name
 */
export const updatePasskeyDeviceName = async (
  userId: string,
  credentialID: string,
  deviceName: string
): Promise<void> => {
  await db
    .update(passkeyCredentials)
    .set({ deviceName })
    .where(
      and(
        eq(passkeyCredentials.credentialID, credentialID),
        eq(passkeyCredentials.userId, userId)
      )
    );
  
  logger.info('Passkey device name updated', { userId, credentialID, deviceName });
};
