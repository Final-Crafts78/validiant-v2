import { Context } from 'hono';
import { env } from 'hono/adapter';
import { setCookie } from 'hono/cookie';

export const getCookieOptions = (c: Context, maxAge: number) => {
  const { COOKIE_DOMAIN } = env<{ COOKIE_DOMAIN?: string }>(c);

  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    domain: COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge,
  };
};

export const setUserPrefsCookie = (
  c: Context,
  prefs: Record<string, unknown>
) => {
  const { COOKIE_DOMAIN } = env<{ COOKIE_DOMAIN?: string }>(c);

  setCookie(c, 'userPrefs', JSON.stringify(prefs), {
    httpOnly: false,
    secure: true,
    sameSite: 'none' as const,
    domain: COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: 31536000,
  });
};
