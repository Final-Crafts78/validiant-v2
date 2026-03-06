'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { post } from '@/lib/api';
import { API_CONFIG, ROUTES } from '@/lib/config';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid invite link — no token found.');
      return;
    }

    post(API_CONFIG.ENDPOINTS.ORGANIZATIONS.ACCEPT_INVITE, { token })
      .then(() => {
        setStatus('success');
        // Redirect to dashboard after 2s
        setTimeout(() => router.push(ROUTES.DASHBOARD), 2000);
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(
          err?.response?.data?.message ?? 'Invite link expired or invalid.'
        );
      });
  }, [token, router]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
      {status === 'loading' && (
        <>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-sm">Accepting your invite…</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">You're in!</h2>
          <p className="text-slate-500 text-sm">
            Redirecting to your dashboard…
          </p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Invite Failed
          </h2>
          <p className="text-slate-500 text-sm mb-4">{message}</p>
          <button
            onClick={() => router.push(ROUTES.LOGIN)}
            className="text-sm text-blue-600 hover:underline"
          >
            Go to Login
          </button>
        </>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
        <AcceptInviteContent />
      </Suspense>
    </div>
  );
}
