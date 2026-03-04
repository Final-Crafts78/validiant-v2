/**
 * Expo Push Notification Utility (Phase 15)
 *
 * Edge-compatible push notification sender using Expo Push API.
 * Uses native fetch() — no Expo SDK required on the server.
 */

import { eq } from 'drizzle-orm';
import { db, schema } from '../db';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
}

/**
 * Send Expo push notifications via HTTP API.
 * Accepts an array of messages and batches them.
 */
export async function sendExpoPush(messages: PushMessage[]): Promise<boolean> {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error('[push] Expo API error:', await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('[push] Send failed:', error);
    return false;
  }
}

/**
 * Send a push notification to a specific user.
 * Looks up their device tokens from the pushTokens table.
 */
export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  try {
    const tokens = await db
      .select()
      .from(schema.pushTokens)
      .where(eq(schema.pushTokens.userId, userId));

    if (tokens.length === 0) return false;

    const messages: PushMessage[] = tokens.map((t: { token: string }) => ({
      to: t.token,
      title,
      body,
      data,
      sound: 'default',
    }));

    return sendExpoPush(messages);
  } catch (error) {
    console.error('[push] notifyUser failed:', error);
    return false;
  }
}
