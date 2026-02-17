/**
 * Register Page (BFF Pattern)
 * 
 * User registration page using Next.js Server Actions.
 * Cookies are now set by Next.js (same domain) instead of Cloudflare API.
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
import { Eye, EyeOff, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Register form validation schema
 */
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(VALIDATION.NAME.MIN_LENGTH, `First name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`)
      .max(VALIDATION.NAME.MAX_LENGTH, `First name must be no more than ${VALIDATION.NAME.MAX_LENGTH} characters`)
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
    lastName: z
      .string()
      .min(VALIDATION.NAME.MIN_LENGTH, `Last name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`)
      .max(VALIDATION.NAME.MAX_LENGTH, `Last name must be no more than ${VALIDATION.NAME.MAX_LENGTH} characters`)
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(VALIDATION.EMAIL.MAX_LENGTH, `Email must be no more than ${VALIDATION.EMAIL.MAX_LENGTH} characters`),
    password: z
      .string()
      .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
      .max(VALIDATION.PASSWORD.MAX_LENGTH, `Password must be no more than ${VALIDATION.PASSWORD.MAX_LENGTH} characters`)
      .refine(
        (password) => validate.password(password).isValid,
        'Password must contain uppercase, lowercase, number, and special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    terms: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Register Page Component
 */
export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form setup
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

  // Watch password for strength indicator
  const password = watch('password');
  const passwordValidation = password ? validate.password(password) : null;

  // Handle form submission with Server Action
  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    
    // Transform firstName and lastName into fullName
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    
    startTransition(async () => {
      try {
        // Call server action (runs on server, sets cookies)
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

        // Update Zustand store with user data
        if (result.user) {
          setAuth({
            user: result.user,
          });
        }

        // Redirect to dashboard
        // Middleware will now detect the cookie and allow access
        router.push(ROUTES.DASHBOARD);
        router.refresh(); // Refresh to trigger middleware check
      } catch (error) {
        console.error('Registration error:', error);
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join us and start managing your projects
          </p>
        </div>

        {/* Register Card */}
        <div className="card">
          <div className="card-body">
            {/* Error Alert */}
            {errorMessage && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-danger-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-danger-800">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="label label-required">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    className={`input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="John"
                    disabled={isPending}
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p className="error-message">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="label label-required">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    className={`input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Doe"
                    disabled={isPending}
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p className="error-message">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="label label-required">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@example.com"
                  disabled={isPending}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="error-message">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="label label-required">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a strong password"
                    disabled={isPending}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="error-message">{errors.password.message}</p>
                )}

                {/* Password Strength Indicator */}
                {password && passwordValidation && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs">
                      {passwordValidation.isValid ? (
                        <CheckCircle2 className="h-3 w-3 text-success-600" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={passwordValidation.isValid ? 'text-success-600' : 'text-gray-500'}>
                        Strong password
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="label label-required">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Re-enter your password"
                    disabled={isPending}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isPending}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="error-message">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={isPending}
                    {...register('terms')}
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="font-medium text-primary-600 hover:text-primary-700">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="font-medium text-primary-600 hover:text-primary-700">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.terms && (
                  <p className="error-message">{errors.terms.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary btn-lg w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href={ROUTES.LOGIN}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}