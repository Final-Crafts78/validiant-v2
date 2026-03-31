import { redirect } from 'next/navigation';

/**
 * Ghost Route Redirect for Infra (Phase 41)
 * 
 * Handles legacy requests to /infra/new.
 */
export default function InfraNewRedirect({ params }: { params: { orgSlug: string } }) {
  redirect(`/${params.orgSlug}/infra?create=true`);
}
