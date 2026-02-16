/**
 * Forgot Password Page
 *
 * Request password reset link via email.
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
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

/**
 * Forgot password form validation schema
 */
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Forgot Password Page Component
 */
export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Form setup
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

  // Forgot password mutation
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

  // Handle form submission
  const onSubmit = (data: ForgotPasswordFormData) => {
    setErrorMessage(null);
    forgotPasswordMutation.mutate(data);
  };

  // Handle resend
  const handleResend = () => {
    if (submittedEmail) {
      setErrorMessage(null);
      forgotPasswordMutation.mutate({ email: submittedEmail });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Mail className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isSuccess ? 'Check Your Email' : 'Forgot Password?'}
          </h1>
          <p className="text-gray-600">
            {isSuccess
              ? "We've sent you a password reset link"
              : "No worries, we'll send you reset instructions"}
          </p>
        </div>

        {/* Content Card */}
        <div className="card">
          <div className="card-body">
            {/* Success View */}
            {isSuccess ? (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-success-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-success-800">
                        Email sent successfully!
                      </h3>
                      <div className="mt-2 text-sm text-success-700">
                        <p>
                          We've sent a password reset link to{' '}
                          <span className="font-medium">{submittedEmail}</span>.
                          Please check your inbox and follow the instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    <strong>Didn't receive the email?</strong>
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure the email address is correct</li>
                    <li>Wait a few minutes and try resending</li>
                  </ul>
                </div>

                {/* Resend Button */}
                <button
                  onClick={handleResend}
                  disabled={forgotPasswordMutation.isPending}
                  className="btn btn-outline btn-md w-full"
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>Resend Email</span>
                    </>
                  )}
                </button>

                {/* Back to Login */}
                <Link
                  href={ROUTES.LOGIN}
                  className="btn btn-ghost btn-md w-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            ) : (
              <>
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
                        <p className="text-sm text-danger-800">
                          {errorMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Forgot Password Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="label label-required">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      className={`input ${errors.email ? 'input-error' : ''}`}
                      placeholder="you@example.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="error-message">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={forgotPasswordMutation.isPending}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {forgotPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6">
                  <Link
                    href={ROUTES.LOGIN}
                    className="btn btn-ghost btn-md w-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Additional Help */}
        {!isSuccess && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link
                href={ROUTES.LOGIN}
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
