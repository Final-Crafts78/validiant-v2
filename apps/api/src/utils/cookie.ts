import { Context } from 'hono';
import { env } from 'hono/adapter';
import { setCookie } from 'hono/cookie';

/**
 * Dynamic cookie options factory.
 */
export const getCookieOptions = (c: Context, maxAge: number) => {
  const { FRONTEND_URL } = env<{ FRONTEND_URL?: string }>(c);
  // Strictly identify if we are on the production validiant.in domain
  const isProd = FRONTEND_URL && FRONTEND_URL.includes('validiant.in');

  return {
    httpOnly: true,
    secure: true,
    sameSite: isProd ? ('lax' as const) : ('none' as const),
    domain: isProd ? '.validiant.in' : undefined,
    path: '/',
    maxAge,
  };
};

/**
 * Public cookie for theme flash prevention (Mini-Phase 6)
 */
export const setUserPrefsCookie = (c: Context, prefs: any) => {
  const { FRONTEND_URL } = env<{ FRONTEND_URL?: string }>(c);
  const isProd = FRONTEND_URL && FRONTEND_URL.includes('validiant.in');

  setCookie(c, 'userPrefs', JSON.stringify(prefs), {
    httpOnly: false, // Must be readable by client-side script
    secure: true,
    sameSite: isProd ? ('lax' as const) : ('none' as const),
    domain: isProd ? '.validiant.in' : undefined,
    path: '/',
    maxAge: 31536000, // 1 year
  });
};
