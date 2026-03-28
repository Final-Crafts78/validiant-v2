'use client';
/**
 * Onboarding Page
 *
 * Phase 22: First-login experience.
 * Shown when a user has no organizations.
 * Collects Company Name + Industry Type → creates their first org.
 */

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { useWorkspaceStore } from '@/store/workspace';
import { useAuthStore } from '@/store/auth';
import { ROUTES } from '@/lib/config';
import { Building2, Rocket, ArrowRight, Sparkles } from 'lucide-react';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance & Banking',
  'Manufacturing',
  'Retail & E-Commerce',
  'Construction & Real Estate',
  'Education',
  'Legal & Compliance',
  'Logistics & Supply Chain',
  'Government & Public Sector',
  'Energy & Utilities',
  'Media & Entertainment',
  'Agriculture',
  'Consulting',
  'Other',
];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setActiveOrg = useWorkspaceStore((s) => s.setActiveOrg);
  const user = useAuthStore((s) => s.user);
  const [isPending, startTransition] = useTransition();

  console.debug('[Onboarding:Page] Render state', {
    hasUser: !!user,
    email: user?.email,
    id: user?.id,
    timestamp: new Date().toISOString(),
  });

  const [error, setError] = useState('');

  // Track state transitions to catch the exact moment auth is lost
  useEffect(() => {
    console.debug('[Onboarding:Watch] Auth state monitored', {
      hasUser: !!user,
      email: user?.email,
      timestamp: new Date().toISOString(),
    });

    if (!user) {
      console.warn('[Onboarding:Watch] AUTH LOST! Current context:', {
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
        cookieNames: typeof document !== 'undefined' ? document.cookie.split(';').map(c => c.split('=')[0]?.trim() || 'UNKNOWN') : [],
        timestamp: new Date().toISOString(),
      });
    }
  }, [user]);

  useState(() => {
    // One-time mount log
    console.debug('[Onboarding:Mount] Initializing page component', {
      isAuthenticated: !!user,
      cookieNames:
        typeof document !== 'undefined'
          ? document.cookie.split(';').map((c) => c.split('=')[0]?.trim() || 'UNKNOWN')
          : 'N/A',
      timestamp: new Date().toISOString(),
    });
  });

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required');
      return;
    }
    setError('');

    startTransition(async () => {
      try {
        const { data } = await apiClient.post('/organizations', {
          name: name.trim(),
          industryType: industry || undefined,
        });

        const org = data?.data;
        if (org?.id) {
          // Set this new org as active workspace
          setActiveOrg(org.id, org.slug);
          // Invalidate orgs query so the switcher picks it up
          queryClient.invalidateQueries({ queryKey: ['organizations', 'my'] });
          // Navigate to dashboard
          router.push(ROUTES.DASHBOARD(org.slug));
          router.refresh();
        }
      } catch (err: any) {
        console.error('[Onboarding] Error creating org:', err);
        setError(
          err?.message || 'Failed to create organization. Please try again.'
        );
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-5">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {firstName}!{' '}
            <Sparkles className="inline w-5 h-5 text-amber-400" />
          </h1>
          <p className="mt-2 text-slate-500 text-sm max-w-sm mx-auto">
            Let&apos;s set up your organization to get started with Validiant.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Company Name */}
            <div>
              <label
                htmlFor="company-name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Company Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="company-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  autoFocus
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Industry Type */}
            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Industry Type
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-700"
                disabled={isPending}
              >
                <option value="">Select an industry (optional)</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating your workspace…
                </>
              ) : (
                <>
                  Create Organization
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-slate-400 mt-4">
          You can always add more organizations later from the dashboard.
        </p>
      </div>
    </div>
  );
}
