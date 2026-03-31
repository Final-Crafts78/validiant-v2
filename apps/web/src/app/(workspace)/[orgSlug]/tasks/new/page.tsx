import { redirect } from 'next/navigation';

/**
 * Ghost Route Redirect (Phase 41)
 * 
 * Handles legacy or "ghost" requests to /tasks/new by redirecting 
 * to the main tasks list and signaling for the modal to open.
 */
export default function TasksNewRedirect({ params }: { params: { orgSlug: string } }) {
  // Redirect to the main tasks page with a query param to trigger the create modal
  redirect(`/${params.orgSlug}/tasks?create=true`);
}
