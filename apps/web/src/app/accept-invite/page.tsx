'use client';
/**
 * Accept Invite Page
 *
 * Phase 23: Invite acceptance flow.
 * Reads ?token= from URL, validates it, and lets the user join the org.
 *
 * - If logged out → redirects to login with token preserved
 * - If logged in → shows org info + Accept button
 */

import { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useWorkspaceStore } from '@/store/workspace';
import { ROUTES } from '@/lib/config';
import { Building2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);

  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [orgInfo, setOrgInfo] = useState<{ name: string; role: string } | null>(
    null
  );

  // If no token, show error
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Invalid Invitation
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            The invitation link is missing a token. Please check the link and
            try again.
          </p>
          <Link
            href={ROUTES.DASHBOARD}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If logged out, redirect to login with token preserved
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-5">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            You&apos;ve Been Invited!
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Sign in or create an account to accept this invitation.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href={`${ROUTES.REGISTER}?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAccept = () => {
    startTransition(async () => {
      try {
        const { data } = await apiClient.post('/organizations/accept-invite', {
          token,
        });
        const result = data;

        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'You have joined the organization!');
          if (result.data?.organizationId) {
            setOrgInfo({
              name: result.data.organizationName || 'Organization',
              role: result.data.role || 'member',
            });
            setActiveOrg(result.data.organizationId);
          }
          // Auto-redirect after 2s
          setTimeout(() => {
            router.push(ROUTES.DASHBOARD);
            router.refresh();
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.message || 'Failed to accept invitation.');
        }
      } catch (err: unknown) {
        setStatus('error');
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Failed to accept invitation. The token may be invalid or expired.';
        setMessage(errorMessage);
      }
    });
  };

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Welcome to {orgInfo?.name}!
          </h1>
          <p className="text-slate-500 text-sm mb-2">{message}</p>
          <p className="text-xs text-slate-400">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Invitation Error
          </h1>
          <p className="text-slate-500 text-sm mb-6">{message}</p>
          <Link
            href={ROUTES.DASHBOARD}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Default: show accept button
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-5">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Organization Invitation
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          You&apos;ve been invited to join an organization on Validiant.
          <br />
          Signed in as <strong className="text-slate-700">{user.email}</strong>.
        </p>
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Accepting…
            </>
          ) : (
            'Accept Invitation'
          )}
        </button>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
