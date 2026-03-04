/**
 * Didit KYC Service (Phase 17)
 *
 * Creates KYC/Background Verification sessions via the Didit API.
 * Edge-compatible — uses native fetch().
 */

interface DiditEnv {
  DIDIT_API_KEY: string;
}

interface DiditSession {
  sessionId: string;
  url: string;
}

/**
 * Create a Didit KYC verification session.
 * Returns the session ID and verification URL.
 */
export async function createDiditSession(
  env: DiditEnv,
  _candidateName: string,
  candidateEmail: string,
  taskId: string
): Promise<DiditSession | null> {
  try {
    if (!env.DIDIT_API_KEY) {
      console.error('[didit] DIDIT_API_KEY is not configured');
      return null;
    }

    const response = await fetch('https://apx.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DIDIT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendor_data: taskId,
        callback: candidateEmail,
        features: 'OCR',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[didit] API error:', errorText);
      return null;
    }

    const data = (await response.json()) as {
      session_id: string;
      url: string;
    };

    return {
      sessionId: data.session_id,
      url: data.url,
    };
  } catch (error) {
    console.error('[didit] Create session failed:', error);
    return null;
  }
}
