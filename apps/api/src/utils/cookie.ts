import { Context } from 'hono';
import { env } from 'hono/adapter';
import { setCookie } from 'hono/cookie';
import { logger } from './logger';

export const getCookieOptions = (c: Context, maxAge: number) => {
  const { COOKIE_DOMAIN } = env<{ COOKIE_DOMAIN?: string }>(c);

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax' as const,
    domain: COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge,
  };

  logger.debug('[Cookie:Options] Generated options', options);

  return options;
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
