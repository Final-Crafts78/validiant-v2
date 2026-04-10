/**
 * Auth Server Actions (BFF Pattern)
 *
 * Backend-For-Frontend pattern to solve cross-domain cookie issues.
 * Next.js Server Actions proxy the Cloudflare API and set cookies
 * on the same domain (Vercel), making them readable by middleware.
 */

'use server';

// 🔍 BFF MODULE INITIALIZATION TRACE
// eslint-disable-next-line no-console
console.log(`[BFF:Module] [${Date.now()}] EP-0.1: Module loading started`);

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
// @ts-ignore - 'cache' is available in React 18 for RSC but may not be recognized by all environments/types
import { cache } from 'react';
/* eslint-enable @typescript-eslint/prefer-ts-expect-error */
import { getBaseCookieOptions } from '@/lib/auth-utils';
import type {
  AuthUser,
  LoginActionResult,
  RegisterActionResult,
  LogoutActionResult,
  GetCurrentUserActionResult,
  UpdateProfileActionResult,
  Organization,
} from '@/types/auth.types';

// eslint-disable-next-line no-console
console.log(`[BFF:Module] [${Date.now()}] EP-0.2: Configuring API_BASE_URL`);

const raw = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
).replace(/\/+$/, '');
const API_BASE_URL = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;

// eslint-disable-next-line no-console
console.debug('[BFF:Init] API Configuration', {
  raw: process.env.NEXT_PUBLIC_API_URL || 'MISSING',
  normalized: API_BASE_URL,
  isProduction: API_BASE_URL.includes('validiant.in'),
  timestamp: new Date().toISOString(),
});

const COOKIE_OPTIONS = getBaseCookieOptions();
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function clearAuthCookies() {
  const cookieStore = cookies();
  const beforeCount = cookieStore.getAll().length;
  const beforeNames = cookieStore.getAll().map((c) => c.name);

  // eslint-disable-next-line no-console
  console.warn('[BFF:ClearCookies] DOMAIN CHECK', {
    domain: (COOKIE_OPTIONS as any).domain || 'UNDEFINED (Host-only)',
    path: COOKIE_OPTIONS.path,
    beforeNames,
    beforeCount,
  });

  cookieStore.set({
    name: 'accessToken',
    value: '',
    expires: new Date(0),
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  cookieStore.set({
    name: 'refreshToken',
    value: '',
    expires: new Date(0),
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  cookieStore.delete({
    name: 'accessToken',
    ...COOKIE_OPTIONS,
  });
  cookieStore.delete({
    name: 'refreshToken',
    ...COOKIE_OPTIONS,
  });

  const afterCount = cookieStore.getAll().length;
  const afterNames = cookieStore.getAll().map((c) => c.name);

  // eslint-disable-next-line no-console
  console.debug('[BFF:ClearCookies] STATE AFTER DELETE', {
    afterNames,
    afterCount,
    domainUsed: (COOKIE_OPTIONS as any).domain || 'HOST_ONLY',
    timestamp: new Date().toISOString(),
  });
}

export async function loginAction(
  email: string,
  password: string
): Promise<LoginActionResult> {
  try {
    // eslint-disable-next-line no-console
    console.log(`[BFF:Login] [${Date.now()}] EP-L1: Start for ${email}`);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    // eslint-disable-next-line no-console
    console.log(`[BFF:Login] [${Date.now()}] EP-L2: Status=${response.status}`);

    const data = await response.json();

    if (!response.ok || !data.success) {
      // eslint-disable-next-line no-console
      console.warn(
        `[BFF:Login] [${Date.now()}] EP-L2.ERROR: Fail, msg=${data.message}`
      );
      return {
        success: false,
        error: data.error || 'Login failed',
        message: data.message || 'Invalid email or password',
      };
    }

    const { accessToken, refreshToken, user } = data.data;

    if (!accessToken || !refreshToken || !user) {
      // eslint-disable-next-line no-console
      console.error(
        `[BFF:Login] [${Date.now()}] EP-L2.CRITICAL: Missing tokens`
      );
      return {
        success: false,
        error: 'Invalid response',
        message: 'Authentication data is incomplete',
      };
    }

    const cookieStore = cookies();
    const domain = (COOKIE_OPTIONS as any).domain || 'HOST_ONLY';

    // eslint-disable-next-line no-console
    console.log(
      `[BFF:Login] [${Date.now()}] EP-L3: Setting cookies, domain=${domain}`
    );

    cookieStore.set('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    cookieStore.set('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // eslint-disable-next-line no-console
    console.log(`[BFF:Login] [${Date.now()}] EP-L4: SUCCESS for ${user.email}`);

    return {
      success: true,
      user: user as AuthUser,
      accessToken,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[BFF:Login] [${Date.now()}] EP-L.ERROR: CRASH`, error);
    return {
      success: false,
      error: 'NetworkError',
      message: 'Unable to connect to authentication server',
    };
  }
}

export async function registerAction(
  email: string,
  password: string,
  fullName: string,
  acceptedTerms: boolean
): Promise<RegisterActionResult> {
  try {
    // eslint-disable-next-line no-console
    console.log(`[BFF:Reg] [${Date.now()}] EP-R1: Start for ${email}`);

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, acceptedTerms }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Registration failed',
        message: data.message || 'Unable to create account',
      };
    }

    const { accessToken, refreshToken, user } = data.data;
    const cookieStore = cookies();

    cookieStore.set('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    cookieStore.set('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // eslint-disable-next-line no-console
    console.log(`[BFF:Reg] [${Date.now()}] EP-R2: SUCCESS for ${user.email}`);

    return {
      success: true,
      user: user as AuthUser,
      accessToken,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[BFF:Reg] [${Date.now()}] EP-R.ERROR: CRASH`, error);
    return {
      success: false,
      error: 'NetworkError',
      message: 'Unable to connect to authentication server',
    };
  }
}

export async function updateProfileAction(payload: {
  fullName: string;
  displayName?: string;
  bio?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}): Promise<UpdateProfileActionResult> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  // eslint-disable-next-line no-console
  console.log(`[BFF:UpdateProfile] [${Date.now()}] EP-P1: Start`, {
    payloadKeys: Object.keys(payload),
    hasToken: !!accessToken,
    timestamp: new Date().toISOString(),
  });

  if (!accessToken) {
    // eslint-disable-next-line no-console
    console.error(`[BFF:UpdateProfile] [${Date.now()}] EP-P1.ERROR: No token`);
    return {
      success: false,
      error: 'Unauthenticated',
      message: 'No access token found',
    };
  }

  try {
    // ELITE: Clean payload - remove empty strings and poison markers ("$undefined", "null")
    const cleanPayload: any = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (
        value !== '' &&
        value !== undefined &&
        value !== null &&
        value !== '$undefined' &&
        value !== 'null'
      ) {
        cleanPayload[key] = value;
      }
    });

    // eslint-disable-next-line no-console
    console.log(
      `[BFF:UpdateProfile] [${Date.now()}] EP-P2: Fetching /users/me`,
      {
        url: `${API_BASE_URL}/users/me`,
        originalKeys: Object.keys(payload),
        cleanKeys: Object.keys(cleanPayload),
        payloadPreview: JSON.stringify(cleanPayload).substring(0, 100),
      }
    );

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(cleanPayload),
      cache: 'no-store',
    });

    // eslint-disable-next-line no-console
    console.log(
      `[BFF:UpdateProfile] [${Date.now()}] EP-P3: Status=${response.status}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      // eslint-disable-next-line no-console
      console.warn(`[BFF:UpdateProfile] [${Date.now()}] EP-P3.ERROR: Fail`, {
        status: response.status,
        error: data.error,
        message: data.message,
      });
      return {
        success: false,
        error: data.error || 'UpdateFailed',
        message: data.message || 'Unable to update profile',
      };
    }

    // eslint-disable-next-line no-console
    console.log(`[BFF:UpdateProfile] [${Date.now()}] EP-P4: SUCCESS`, {
      userId: data.data.user?.id,
      email: data.data.user?.email,
      updatedFields: Object.keys(cleanPayload),
    });

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard', 'layout');

    return {
      success: true,
      user: data.data.user as AuthUser,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `[BFF:UpdateProfile] [${Date.now()}] EP-P.ERROR: CRASH`,
      error
    );
    return {
      success: false,
      error: 'NetworkError',
      message: 'Unable to connect to server',
    };
  }
}

export async function logoutAction(): Promise<LogoutActionResult> {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (accessToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[BFF:Logout] API call failed:', err);
      }
    }

    clearAuthCookies();
    return { success: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[BFF:Logout] ERROR:', error);
    clearAuthCookies();
    return { success: true };
  }
}

export const getCurrentUserAction = cache(
  async (): Promise<GetCurrentUserActionResult> => {
    const cookieStore = cookies();

    try {
      const accessToken = cookieStore.get('accessToken')?.value;

      // eslint-disable-next-line no-console
      console.log(
        `[BFF:GetUser] [${Date.now()}] EP-U1: Access token=${!!accessToken}`
      );

      if (!accessToken) {
        return {
          success: false,
          error: 'Unauthenticated',
          message: 'No access token found',
        };
      }

      // eslint-disable-next-line no-console
      console.log(`[BFF:GetUser] [${Date.now()}] EP-U2: Fetching /auth/me from ${API_BASE_URL}`);

      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      });

      const duration = Date.now() - startTime;
      // eslint-disable-next-line no-console
      console.log(
        `[BFF:GetUser] [${Date.now()}] EP-U3: Response status=${response.status}, took ${duration}ms`
      );

      if (response.status === 401 || response.status === 403) {
        // eslint-disable-next-line no-console
        console.warn(
          `[BFF:GetUser] [${Date.now()}] EP-U3.WARN: Auth failure, status=${response.status}`
        );
        return {
          success: false,
          error: 'TokenInvalid',
          message: 'Authentication token is invalid or expired',
        };
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // eslint-disable-next-line no-console
        console.error(
          `[BFF:GetUser] [${Date.now()}] EP-U3.ERROR: JSON parse fail`
        );
        return {
          success: false,
          error: 'InvalidResponse',
          message: 'Server returned invalid response',
        };
      }

      if (!response.ok || !data.success) {
        // eslint-disable-next-line no-console
        console.warn(
          `[BFF:GetUser] [${Date.now()}] EP-U3.ERROR: API error, msg=${data.message}`
        );
        return {
          success: false,
          error: data.error || 'Failed to fetch user',
          message: data.message || 'Unable to load user data',
        };
      }

      if (!data.data || !data.data.user) {
        // eslint-disable-next-line no-console
        console.error(
          `[BFF:GetUser] [${Date.now()}] EP-U3.ERROR: User data missing`
        );
        return {
          success: false,
          error: 'InvalidResponse',
          message: 'User data not found in response',
        };
      }

      // eslint-disable-next-line no-console
      console.log(
        `[BFF:GetUser] [${Date.now()}] EP-U4: SUCCESS for ${data.data.user.email}`
      );

      return {
        success: true,
        user: data.data.user as AuthUser,
        accessToken,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `[BFF:GetUser] [${Date.now()}] EP-U.ERROR: CRITICAL`,
        error
      );
      return {
        success: false,
        error: 'NetworkError',
        message: 'Unable to connect to authentication server',
      };
    }
  }
);

export const getUserOrganizationsAction = cache(
  async (accessToken: string): Promise<Organization[]> => {
    try {
      // eslint-disable-next-line no-console
      console.log(`[BFF:GetOrgs] [${Date.now()}] EP-O1: Fetching orgs from ${API_BASE_URL}`);
      const startTime = Date.now();
      const response = await fetch(`${API_BASE_URL}/organizations/my`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error(
          `[BFF:GetOrgs] [${Date.now()}] EP-O2.ERROR: Status ${response.status}`
        );
        return [];
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      const orgCount = data?.data?.organizations?.length || 0;
      // eslint-disable-next-line no-console
      console.log(
        `[BFF:GetOrgs] [${Date.now()}] EP-O3: SUCCESS, count=${orgCount}, took ${duration}ms`
      );
      return data?.data?.organizations ?? [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `[BFF:GetOrgs] [${Date.now()}] EP-O.ERROR: CRITICAL`,
        error
      );
      return [];
    }
  }
);
