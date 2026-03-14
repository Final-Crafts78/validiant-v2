/**
 * Storage Service
 *
 * Handles interactions with Supabase Storage for presigned URLs.
 */
import { env } from '../config/env.config';

/**
 * Creates a signed upload URL for a specific path in the storage bucket.
 *
 * @param path The relative path in the bucket (e.g. evidence/task_id/file_name)
 * @param expiresIn Time in seconds until the URL expires
 */
export const createSignedUploadUrl = async (
  path: string,
  expiresIn: number = 600
) => {
  // We use the REST API directly to avoid extra dependencies on the edge
  // Bucket is assumed to be 'evidence' as per Phase 20/21 architecture
  const bucket = 'evidence';
  const url = `${env.SUPABASE_STORAGE_URL}/object/upload/sign/${bucket}/${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn }),
  });

  if (!response.ok) {
    const error = (await response.json()) as {
      error?: string;
      message?: string;
    };
    throw new Error(
      `Supabase Storage Error: ${error.error || error.message || 'Failed to generate signed URL'}`
    );
  }

  const data = (await response.json()) as {
    url: string;
    token?: string;
  };

  // The API returns { url: "..." } where url is the signed path.
  // We need to construct the full upload URL if it's relative.
  const fullUrl = data.url.startsWith('http')
    ? data.url
    : `${env.SUPABASE_STORAGE_URL}/object/${bucket}/${path}`;

  // Also provide the public URL for record keeping
  const publicUrl = `${env.SUPABASE_STORAGE_URL}/object/public/${bucket}/${path}`;

  return {
    url: fullUrl,
    signedPath: data.url,
    publicUrl,
    token: data.token || null, // Some Supabase versions return a token
  };
};

/**
 * Deletes a file from storage.
 */
export const deleteFile = async (path: string) => {
  const bucket = 'evidence';
  const url = `${env.SUPABASE_STORAGE_URL}/object/${bucket}/${path}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    },
  });

  return response.ok;
};
