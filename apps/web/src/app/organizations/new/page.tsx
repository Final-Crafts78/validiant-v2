import { redirect } from 'next/navigation';

/**
 * Ghost Route Redirect for Organizations (Phase 41)
 * 
 * Handles legacy root requests to /organizations/new by 
 * sending the user to the onboarding flow.
 */
export default function OrganizationsNewRedirect() {
  redirect('/dashboard/onboarding');
}
