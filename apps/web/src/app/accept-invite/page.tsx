'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { acceptInvite } from '@/services/organization.service';
import { ROUTES } from '@/lib/config';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const user = useAuthStore((state) => state.user);

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorHeader, setErrorHeader] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [inviteData, setInviteData] = useState<{
    organizationName: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorHeader('Missing Token');
      setErrorMessage('The invitation link is invalid or has expired.');
      return;
    }

    if (!user) {
      setStatus('error');
      setErrorHeader('Authentication Required');
      setErrorMessage(
        'Please sign in or create an account to accept this invitation.'
      );
      return;
    }
  }, [token, user]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus('loading');
    try {
      const data = await acceptInvite(token);
      setInviteData({
        organizationName: data.organizationName,
        role: data.role,
      });
      setStatus('success');

      setTimeout(() => {
        router.push(ROUTES.DASHBOARD_ROOT);
      }, 2000);
    } catch (err: unknown) {
      setStatus('error');
      setErrorHeader('Invitation Error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'The invitation is invalid, expired, or already used.'
      );
    }
  };

  return (
    <div className="p-8 md:p-10 space-y-8 text-left">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center rotate-3 border border-primary-100 shadow-sm">
          <ShieldCheck className="w-10 h-10 text-primary-600" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {status === 'success' ? 'Welcome Aboard!' : 'Organization Invite'}
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          You've been invited to join an organization on Validiant.
        </p>
      </div>

      {status === 'idle' && (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Invited to
              </p>
              <p className="text-lg font-bold text-slate-900">
                Validating Organization...
              </p>
            </div>
          </div>

          <button
            onClick={handleAccept}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-200 transition-all flex items-center justify-center gap-2 group"
          >
            Join Organization
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center py-12 space-y-4">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          <p className="text-sm font-bold text-slate-400 animate-pulse">
            SETTING UP YOUR ACCESS...
          </p>
        </div>
      )}

      {status === 'success' && inviteData && (
        <div className="space-y-6 text-center animate-in slide-in-from-bottom-4">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-slate-900">Success!</p>
            <p className="text-slate-500 text-sm">
              You are now a{' '}
              <span className="text-primary-600 font-bold">
                {inviteData.role}
              </span>{' '}
              of{' '}
              <span className="font-bold text-slate-700">
                {inviteData.organizationName}
              </span>
              .
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Redirecting to Dashboard...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6 text-center animate-in slide-in-from-bottom-4">
          <div className="flex justify-center">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-slate-900">{errorHeader}</p>
            <p className="text-slate-500 text-sm">{errorMessage}</p>
          </div>

          {!user && errorHeader === 'Authentication Required' && (
            <button
              onClick={() =>
                router.push(
                  `${ROUTES.LOGIN}?redirect=/accept-invite?token=${token}`
                )
              }
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all"
            >
              Sign In to Continue
            </button>
          )}

          <button
            onClick={() => router.push(ROUTES.HOME)}
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all"
          >
            Return Home
          </button>
        </div>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="h-3 bg-primary-600" />
        <React.Suspense
          fallback={
            <div className="p-10 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                VERIFYING INVITATION...
              </p>
            </div>
          }
        >
          <AcceptInviteContent />
        </React.Suspense>
      </div>

      <div className="mt-8 flex items-center gap-2 text-slate-400">
        <UserCheck className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">
          Secure Verification Link
        </span>
      </div>
    </div>
  );
}
