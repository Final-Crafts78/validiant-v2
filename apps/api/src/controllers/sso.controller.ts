/**
 * SSO Controller (Phase 21)
 *
 * Provides endpoints for Enterprise Single Sign-On (SAML 2.0 / OIDC).
 * In a real-world scenario, this would integrate with Okta, Azure AD, or Auth0.
 *
 * This is a foundation/adapter implementation for Validiant v2.
 */

import { Context } from 'hono';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { sign } from 'hono/jwt';

// Interfaces for SSO Payloads
interface SSOProfile {
  email: string;
  firstName: string;
  lastName: string;
  provider: 'okta' | 'azure_ad' | 'google_workspace' | 'custom_saml';
  providerId: string;
}

/**
 * Helper to exchange SSO Profile for a JWT session
 */
async function createSSOSession(
  c: Context,
  profile: SSOProfile,
  orgDomain: string
) {
  // 1. Find the organization matching the domain
  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.domain, orgDomain))
    .limit(1);

  if (!org) {
    throw new Error(
      `SSO login failed: Unknown organization domain ${orgDomain}`
    );
  }

  if (!org.ssoEnabled) {
    throw new Error(
      `SSO login failed: Enterprise SSO is not enabled for ${org.name}`
    );
  }

  // 2. Find or create the user
  let [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, profile.email))
    .limit(1);

  if (!user) {
    // Auto-provision user (Just-In-Time Provisioning)
    [user] = await db
      .insert(schema.users)
      .values({
        organizationId: org.id,
        email: profile.email,
        fullName: `${profile.firstName} ${profile.lastName}`.trim(),
        role: 'Field Worker', // Default role for auto-provisioned SSO users
        authProvider: 'sso',
        ssoProviderId: profile.providerId,
        isEmailVerified: true, // We trust the IdP
      })
      .returning();
  } else {
    // Update existing user with latest info
    await db
      .update(schema.users)
      .set({
        authProvider: 'sso',
        ssoProviderId: profile.providerId,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));
  }

  // 3. Generate JWT
  const env = c.env as import('../app').Env;
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 86400; // 24 hours
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    exp,
    iat,
  };

  const token = await sign(payload, env.JWT_SECRET);
  return { user, token };
}

/**
 * POST /api/v1/sso/callback
 * Generic callback endpoint for SSO identity providers to POST tokens/assertions.
 */
export const ssoCallback = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { token, provider, domain } = body;

    // In a production app, here you would:
    // 1. Verify the SAML assertion signature or OIDC JWT using the provider's public keys.
    // 2. Extract the user's profile claims.

    // For this implementation, we simulate decoding a verified token payload:
    // (Replace this with actual library calls like @node-saml/node-saml when not on Edge)
    if (!token || !provider || !domain) {
      return c.json(
        { success: false, error: 'Missing required SSO parameters' },
        400
      );
    }

    // --- SIMULATED VERIFICATION FOR EDGE ---
    // Normally you'd decode `token`. Here we mock the extracted profile.
    const extractedProfile: SSOProfile = {
      email: body.email || 'sso.user@enterprise.com',
      firstName: body.firstName || 'SSO',
      lastName: body.lastName || 'User',
      provider: provider as SSOProfile['provider'],
      providerId: `sso_id_${new Date().getTime()}`,
    };

    const session = await createSSOSession(c, extractedProfile, domain);

    return c.json({
      success: true,
      data: {
        token: session.token,
        user: {
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.fullName,
          role: session.user.role,
          organizationId: session.user.organizationId,
        },
      },
    });
  } catch (error: unknown) {
    console.error('SSO Callback error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'SSO authentication failed';
    return c.json({ success: false, error: errorMessage }, 401);
  }
};

/**
 * GET /api/v1/sso/providers?domain=example.com
 * Look up the configured SSO provider and login URL for a specific domain.
 */
export const getSSOProviders = async (c: Context) => {
  try {
    const domain = c.req.query('domain');

    if (!domain) {
      return c.json({ success: false, error: 'Domain is required' }, 400);
    }

    const [org] = await db
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        ssoEnabled: schema.organizations.ssoEnabled,
      })
      .from(schema.organizations)
      .where(eq(schema.organizations.domain, domain))
      .limit(1);

    if (!org) {
      return c.json({ success: false, error: 'Domain not registered' }, 404);
    }

    if (!org.ssoEnabled) {
      return c.json({
        success: true,
        data: {
          ssoEnabled: false,
          message: 'SSO is not enabled for this organization',
        },
      });
    }

    // Return the specific IdP login URL for this tenant.
    // E.g., https://tenant-specific.okta.com/app/...
    return c.json({
      success: true,
      data: {
        ssoEnabled: true,
        organizationName: org.name,
        loginUrl: `https://sso.validiant.com/login?tenantId=${org.id}`, // Placeholder IDP redirect
        providerOptions: ['azure_ad', 'okta', 'google_workspace'],
      },
    });
  } catch (error) {
    console.error('Get SSO providers error:', error);
    return c.json(
      { success: false, error: 'Failed to lookup SSO configuration' },
      500
    );
  }
};
