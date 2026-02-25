/**
 * Forgot Password Page
 *
 * Corporate Light Theme — Split-Panel Auth Layout
 * All existing logic (useMutation, forgotPasswordSchema, onSubmit,
 * handleResend, isSuccess/errorMessage/submittedEmail) preserved verbatim.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPassword } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api';
import { ROUTES } from '@/lib/config';
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Validation schema — unchanged
// ---------------------------------------------------------------------------
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------
// Forgot Password Page Component
// ---------------------------------------------------------------------------
export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Form setup — unchanged
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Forgot password mutation — unchanged
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (_, variables) => {
      setIsSuccess(true);
      setSubmittedEmail(variables.email);
      setErrorMessage(null);
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setIsSuccess(false);
    },
  });

  // Handle form submission — unchanged
  const onSubmit = (data: ForgotPasswordFormData) => {
    setErrorMessage(null);
    forgotPasswordMutation.mutate(data);
  };

  // Handle resend — unchanged
  const handleResend = () => {
    if (submittedEmail) {
      setErrorMessage(null);
      forgotPasswordMutation.mutate({ email: submittedEmail });
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex">

      {/* ===================================================================
          LEFT PANEL — Brand & Trust (desktop only)
      =================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-blue-900 flex-col items-center justify-center px-16 relative overflow-hidden">

        {/* Geometric gradient overlays — identical to login/register */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(59,130,246,0.20) 0%, transparent 55%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-blue-700 opacity-20 rounded-full"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600 opacity-20 rounded-full"
        />

        {/* Brand content */}
        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Validiant
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-snug mb-5">
            Account Recovery.{' '}
            <span className="text-blue-300">Secure &amp; Verified.</span>
          </h2>

          <p className="text-blue-200 text-base leading-relaxed">
            Regain access to your enterprise workspace quickly. We ensure all
            password resets meet strict compliance protocols and maintain a
            full audit trail.
          </p>

          {/* Trust badges */}
          <div className="mt-12 flex flex-col gap-3 text-left">
            {[
              'SOC 2 Type II Certified',
              'ISO 27001 Aligned',
              'GDPR & Data Privacy Ready',
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-400/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                  <svg
                    className="w-3 h-3 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm text-blue-200">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================
          RIGHT PANEL — Auth Form
      =================================================================== */}
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center px-6 py-12 sm:px-12">

        {/* Mobile-only brand mark */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">Validiant</span>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8 sm:p-10">

          {/* ================================================================
              SUCCESS VIEW
          ================================================================ */}
          {isSuccess ? (
            <div className="space-y-6">
              {/* Card Header */}
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Check Your Email
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Follow the instructions in the email to reset your password.
                </p>
              </div>

              {/* Success Banner */}
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Email sent successfully!
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    We&apos;ve sent a password reset link to{' '}
                    <span className="font-semibold">{submittedEmail}</span>.
                    Please check your inbox.
                  </p>
                </div>
              </div>

              {/* Helpful hints */}
              <ul className="space-y-2">
                {[
                  'Check your spam or junk folder',
                  'Make sure the email address is correct',
                  'Wait a few minutes and try resending',
                ].map((hint) => (
                  <li key={hint} className="flex items-start gap-2 text-sm text-slate-500">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    {hint}
                  </li>
                ))}
              </ul>

              {/* Resend Button */}
              <button
                type="button"
                onClick={handleResend}
                disabled={forgotPasswordMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Resend Email
                  </>
                )}
              </button>

              {/* Back to Sign In */}
              <Link
                href={ROUTES.LOGIN}
                className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* ================================================================
                FORM VIEW
            ================================================================ */
            <div>
              {/* Card Header */}
              <div className="mb-7">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Forgot Password?
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  No worries, we&apos;ll send you reset instructions.
                </p>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md px-4 py-3">
                  <svg
                    className="h-4 w-4 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Forgot Password Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1.5"
                  >
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="jane@company.com"
                    {...register('email')}
                    className={[
                      'w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg',
                      'placeholder:text-slate-400 transition',
                      'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent',
                      errors.email
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-slate-300',
                    ].join(' ')}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <p className="mt-6 text-sm text-slate-500 text-center">
                Remember your password?{' '}
                <Link
                  href={ROUTES.LOGIN}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
