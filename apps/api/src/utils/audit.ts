/**
 * Audit Utilities (Edge-Native)
 *
 * Implements cryptographic hash chaining for forensic integrity.
 */

/**
 * Calculate the SHA-256 hash of a log entry content, prepended with the previous hash.
 * This creates a verifiable hash chain.
 */
export async function calculateActivityHash(
  prevHash: string | null | undefined,
  content: string
): Promise<string> {
  const encoder = new TextEncoder();

  // Hash chain philosophy: SHA-256(prevHash + currentContent)
  // If no prevHash (start of chain), use a seed or empty string
  const input = (prevHash || '0'.repeat(64)) + content;
  const data = encoder.encode(input);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * Serialize row content for hashing
 */
export function serializeRowForAudit(row: Record<string, any>): string {
  // Exclude fields that might change or are part of the chain metadata itself
  const {
    id: _id,
    prevHash: _prevHash,
    contentHash: _contentHash,
    createdAt: _createdAt,
    ...rest
  } = row;
  return JSON.stringify(rest, Object.keys(rest).sort());
}
