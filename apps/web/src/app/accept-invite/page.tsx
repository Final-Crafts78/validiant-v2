'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { organizationsApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace';
import { CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react';

type State = 'loading' | 'accepting' | 'success' | 'error' | 'unauthenticated';

function InvitationHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const qc = useQueryClient();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);

  const [state, setState] = useState<State>('loading');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError(
        'No invite token found in the link. Please use the full link from your email.'
      );
      setState('error');
      return;
    }

    if (!isAuth) {
      setState('unauthenticated');
      return;
    }

    setState('accepting');

    organizationsApi
      .acceptInvite(token)
      .then((res) => {
        const org = res.data?.data;
        if (org?.name) setOrgName(org.name);
        if (org?.id) setActiveOrg(org.id);

        qc.invalidateQueries({ queryKey: ['organizations', 'my'] });
        setState('success');

        setTimeout(() => router.push('/dashboard'), 2000);
      })
      .catch((err) => {
        setError(
          err?.message === 'Not Found'
            ? 'This invite link has expired or has already been used.'
            : (err?.message ?? 'Failed to accept the invite. Please try again.')
        );
        setState('error');
      });
  }, [token, isAuth, qc, router, setActiveOrg]);

  if (state === 'loading' || state === 'accepting') {
    return (
      <Shell>
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
        <p className="text-base font-semibold text-slate-700 mt-4">
          {state === 'loading' ? 'Verifying invite…' : 'Accepting invite…'}
        </p>
      </Shell>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <Shell>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-4">
          You've been invited
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto text-center">
          Create an account or sign in to accept this invite and join the
          organization.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-xs mx-auto">
          <button
            onClick={() =>
              router.push(`/auth/register?from=/accept-invite?token=${token}`)
            }
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Account
          </button>
          <button
            onClick={() =>
              router.push(`/auth/login?from=/accept-invite?token=${token}`)
            }
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Sign In
          </button>
        </div>
      </Shell>
    );
  }

  if (state === 'success') {
    return (
      <Shell>
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900 mt-4">
          You're in{orgName ? ` — ${orgName}` : '!'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Taking you to your dashboard…
        </p>
        <div className="mt-4 h-1 w-48 mx-auto bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-grow" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <XCircle className="w-12 h-12 text-red-400 mx-auto" />
      <h1 className="text-xl font-bold text-slate-900 mt-4">Invite Failed</h1>
      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto text-center">
        {error}
      </p>
      <button
        onClick={() => router.push('/dashboard')}
        className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </Shell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-base font-semibold text-slate-700 mt-4">
            Loading...
          </p>
        </Shell>
      }
    >
      <InvitationHandler />
    </Suspense>
  );
}

// ── Shared centered layout wrapper ────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 w-full max-w-sm text-center">
        {children}
      </div>
    </div>
  );
}
