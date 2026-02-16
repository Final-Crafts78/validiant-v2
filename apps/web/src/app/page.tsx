/**
 * Home/Landing Page
 *
 * Landing page with redirect logic for authenticated users.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { ROUTES } from '@/lib/config';
import { ArrowRight, CheckCircle, Users, Zap, Shield } from 'lucide-react';

/**
 * Home Page Component
 */
export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner spinner-lg text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="container-custom py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Validiant</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.LOGIN} className="btn btn-ghost btn-md">
              Sign In
            </Link>
            <Link href={ROUTES.REGISTER} className="btn btn-primary btn-md">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-custom py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Manage Projects,{' '}
            <span className="gradient-text">Empower Teams</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            The modern project management platform that helps teams collaborate
            effectively, track progress, and deliver results faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={ROUTES.REGISTER} className="btn btn-primary btn-lg">
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href={ROUTES.LOGIN} className="btn btn-outline btn-lg">
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container-custom py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to streamline your workflow and boost
            productivity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Task Management
              </h3>
              <p className="text-gray-600">
                Create, assign, and track tasks with ease. Stay organized and
                never miss a deadline.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Team Collaboration
              </h3>
              <p className="text-gray-600">
                Work together seamlessly with real-time updates and shared
                workspaces.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Powerful Automation
              </h3>
              <p className="text-gray-600">
                Automate repetitive tasks and workflows to save time and reduce
                errors.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-danger-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Enterprise Security
              </h3>
              <p className="text-gray-600">
                Keep your data safe with enterprise-grade security and
                compliance features.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-secondary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analytics & Insights
              </h3>
              <p className="text-gray-600">
                Make data-driven decisions with powerful analytics and reporting
                tools.
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Mobile Access
              </h3>
              <p className="text-gray-600">
                Stay productive on the go with our mobile app for iOS and
                Android.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-custom py-20">
        <div className="card bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="card-body text-center py-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of teams already using Validiant to manage their
              projects better.
            </p>
            <Link
              href={ROUTES.REGISTER}
              className="btn bg-white text-primary-600 hover:bg-gray-50 btn-lg"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container-custom py-12 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p className="text-sm">© 2026 Validiant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
