/**
 * Encryption Utilities (Cloudflare-friendly using Web Crypto API)
 *
 * Provides AES-256-GCM encryption/decryption for sensitive API keys
 * and HMAC-SHA256 signing for webhook security.
 */

/**
 * Encrypts a string using AES-256-GCM
 * Requires ENCRYPTION_SECRET environment variable (32 bytes base64)
 */
export async function encryptSecrets(
  text: string,
  secretBase64: string
): Promise<string> {
  const enc = new TextEncoder();
  const keyData = Buffer.from(secretBase64, 'base64');
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );

  const encryptedBuffer = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedBuffer.length);
  combined.set(iv);
  combined.set(encryptedBuffer, iv.length);

  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypts a string using AES-256-GCM
 */
export async function decryptSecrets(
  combinedBase64: string,
  secretBase64: string
): Promise<string> {
  const combined = Buffer.from(combinedBase64, 'base64');
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const keyData = Buffer.from(secretBase64, 'base64');
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Generates HMAC-SHA256 signature for personal verification
 */
export async function generateHmac(
  payload: string,
  secret: string
): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload));

  return Buffer.from(signature).toString('hex');
}

/**
 * Verifies HMAC-SHA256 signature
 */
export async function verifyHmac(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await generateHmac(payload, secret);
  return expected === signature;
}
