/**
 * Reset Password Page
 *
 * Corporate Light Theme — Split-Panel Auth Layout
 * Completes the auth funnel with 1:1 visual parity to Login, Register,
 * and Forgot Password pages.
 *
 * Uses Suspense boundary around useSearchParams() per Next.js requirements.
 */

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api';
import { ROUTES, VALIDATION } from '@/lib/config';
import { validate } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Validation schema — mirrors Register page exactly
// ---------------------------------------------------------------------------
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        VALIDATION.PASSWORD.MIN_LENGTH,
        `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`
      )
      .max(
        VALIDATION.PASSWORD.MAX_LENGTH,
        `Password must be no more than ${VALIDATION.PASSWORD.MAX_LENGTH} characters`
      )
      .refine(
        (password) => validate.password(password).isValid,
        'Password must contain uppercase, lowercase, number, and special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// Shared input class builder
// ---------------------------------------------------------------------------
function inputCls(hasError: boolean): string {
  return [
    'w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg',
    'placeholder:text-slate-400 transition',
    'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent',
    'disabled:opacity-60',
    hasError ? 'border-red-400 focus:ring-red-400' : 'border-slate-300',
  ].join(' ');
}

// ---------------------------------------------------------------------------
// Inner component — uses useSearchParams (must be inside Suspense)
// ---------------------------------------------------------------------------
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Watch password for live strength indicator
  const password = watch('password');
  const passwordValidation = password ? validate.password(password) : null;

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordFormData) =>
      resetPassword({ token: token!, password: data.password }),
    onSuccess: () => {
      setIsSuccess(true);
      setErrorMessage(null);
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setErrorMessage(message);
    },
  });

  // Handle form submission
  const onSubmit = (data: ResetPasswordFormData) => {
    setErrorMessage(null);
    resetPasswordMutation.mutate(data);
  };

  // ---------------------------------------------------------------------------
  // Missing token — error state
  // ---------------------------------------------------------------------------
  if (!token) {
    return (
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8 sm:p-10">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Invalid Reset Link
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This password reset link is missing or invalid. Please request a
            new one.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md px-4 py-3">
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
          <span>
            No reset token found in the URL. The link may have expired or been
            used already.
          </span>
        </div>

        <Link
          href={ROUTES.FORGOT_PASSWORD}
          className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
        >
          Request New Reset Link
        </Link>

        <p className="mt-5 text-sm text-slate-500 text-center">
          Remember your password?{' '}
          <Link
            href={ROUTES.LOGIN}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Success view
  // ---------------------------------------------------------------------------
  if (isSuccess) {
    return (
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8 sm:p-10">
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Password Reset Complete
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your password has been updated successfully.
          </p>
        </div>

        {/* Success Banner */}
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Password updated!
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Your new password is active. You can now sign in to your
              enterprise workspace with your new credentials.
            </p>
          </div>
        </div>

        {/* Continue to Sign In */}
        <Link
          href={ROUTES.LOGIN}
          className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
        >
          Continue to Sign In
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Form view
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-8 sm:p-10">
      {/* Card Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Set New Password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Please enter your new password below.
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

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        {/* New Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1.5"
          >
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
              disabled={resetPasswordMutation.isPending}
              {...register('password')}
              className={inputCls(!!errors.password) + ' pr-11'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={resetPasswordMutation.isPending}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-60"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}

          {/* Live password strength indicator */}
          {password && passwordValidation && (
            <div className="mt-2 flex items-center gap-1.5">
              {passwordValidation.isValid ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
              )}
              <span
                className={`text-xs ${
                  passwordValidation.isValid
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                }`}
              >
                {passwordValidation.isValid
                  ? 'Strong password'
                  : 'Use uppercase, lowercase, number & special character'}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1.5"
          >
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              disabled={resetPasswordMutation.isPending}
              {...register('confirmPassword')}
              className={inputCls(!!errors.confirmPassword) + ' pr-11'}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              disabled={resetPasswordMutation.isPending}
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
              className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-60"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={resetPasswordMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-1"
        >
          {resetPasswordMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting…
            </>
          ) : (
            'Reset Password'
          )}
        </button>

      </form>

      {/* Back to login */}
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
  );
}

// ---------------------------------------------------------------------------
// Page export — wraps inner component in Suspense per Next.js requirements
// for useSearchParams() in Client Components
// ---------------------------------------------------------------------------
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">

      {/* =================================================================
          LEFT PANEL — Brand & Trust (desktop only)
      ================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-blue-900 flex-col items-center justify-center px-16 relative overflow-hidden">

        {/* Geometric gradient overlays — identical to auth funnel */}
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
            Secure{' '}
            <span className="text-blue-300">Password Reset.</span>
          </h2>

          <p className="text-blue-200 text-base leading-relaxed">
            Create a new strong password to regain access to your enterprise
            workspace. Your security is our absolute priority.
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

      {/* =================================================================
          RIGHT PANEL — Auth Form (with Suspense boundary)
      ================================================================= */}
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center px-6 py-12 sm:px-12">

        {/* Mobile-only brand mark */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">Validiant</span>
        </div>

        {/* Suspense wraps the inner component that calls useSearchParams */}
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>

    </div>
  );
}
