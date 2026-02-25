/**
 * Register Page
 *
 * Corporate Light Theme — Split-Panel Auth Layout
 * All existing auth logic (registerAction, registerSchema, useAuthStore,
 * zod, react-hook-form, validate.password) preserved verbatim.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerAction } from '@/actions/auth.actions';
import { useAuthStore } from '@/store/auth';
import { ROUTES, VALIDATION } from '@/lib/config';
import { validate } from '@/lib/utils';
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

// ---------------------------------------------------------------------------
// Validation schema — completely unchanged
// ---------------------------------------------------------------------------
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(
        VALIDATION.NAME.MIN_LENGTH,
        `First name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`
      )
      .max(
        VALIDATION.NAME.MAX_LENGTH,
        `First name must be no more than ${VALIDATION.NAME.MAX_LENGTH} characters`
      )
      .regex(
        /^[a-zA-Z\s'-]+$/,
        'First name can only contain letters, spaces, hyphens, and apostrophes'
      ),
    lastName: z
      .string()
      .min(
        VALIDATION.NAME.MIN_LENGTH,
        `Last name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`
      )
      .max(
        VALIDATION.NAME.MAX_LENGTH,
        `Last name must be no more than ${VALIDATION.NAME.MAX_LENGTH} characters`
      )
      .regex(
        /^[a-zA-Z\s'-]+$/,
        'Last name can only contain letters, spaces, hyphens, and apostrophes'
      ),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(
        VALIDATION.EMAIL.MAX_LENGTH,
        `Email must be no more than ${VALIDATION.EMAIL.MAX_LENGTH} characters`
      ),
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
    terms: z
      .boolean()
      .refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Shared input class builder — DRY helper
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
// Register Page Component
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form setup — unchanged
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  // Watch password for strength indicator — unchanged
  const password = watch('password');
  const passwordValidation = password ? validate.password(password) : null;

  // Handle form submission with Server Action — unchanged
  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);

    const fullName = `${data.firstName} ${data.lastName}`.trim();

    startTransition(async () => {
      try {
        const result = await registerAction(
          data.email,
          data.password,
          fullName,
          data.terms
        );

        if (!result.success) {
          setErrorMessage(result.message || 'Registration failed');
          return;
        }

        if (result.user) {
          setAuth({ user: result.user });
        }

        router.push(ROUTES.DASHBOARD);
        router.refresh();
      } catch (error) {
        console.error('Registration error:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    });
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

        {/* Geometric gradient overlays */}
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
            Create Your{' '}
            <span className="text-blue-300">Enterprise Workspace.</span>
          </h2>

          <p className="text-blue-200 text-base leading-relaxed">
            Join industry leaders using Validiant for precision workflow
            tracking, automated compliance, and immutable audit trails.
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
          RIGHT PANEL — Registration Form
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
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-lg p-8 sm:p-10">

          {/* Card Header */}
          <div className="mb-7">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create an account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                href={ROUTES.LOGIN}
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign in
              </Link>
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* First Name / Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1.5"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Jane"
                  disabled={isPending}
                  {...register('firstName')}
                  className={inputCls(!!errors.firstName)}
                />
                {errors.firstName && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1.5"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  disabled={isPending}
                  {...register('lastName')}
                  className={inputCls(!!errors.lastName)}
                />
                {errors.lastName && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Work Email */}
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
                placeholder="jane@company.com"
                disabled={isPending}
                {...register('email')}
                className={inputCls(!!errors.email)}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1.5"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  disabled={isPending}
                  {...register('password')}
                  className={inputCls(!!errors.password) + ' pr-11'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isPending}
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

              {/* Password strength indicator — unchanged logic */}
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
                  disabled={isPending}
                  {...register('confirmPassword')}
                  className={inputCls(!!errors.confirmPassword) + ' pr-11'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={isPending}
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

            {/* Terms Checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isPending}
                  {...register('terms')}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 focus:ring-offset-0 disabled:opacity-60"
                />
                <span className="text-sm text-slate-600 leading-snug">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.terms.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>

          </form>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-xs text-slate-400 text-center max-w-sm">
          By creating an account, you agree to our{' '}
          <a
            href="/terms"
            className="underline hover:text-slate-600 transition-colors"
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="underline hover:text-slate-600 transition-colors"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>

    </div>
  );
}
