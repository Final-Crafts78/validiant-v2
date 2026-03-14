'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace';
import {
  useOrganization,
  useUpdateOrganization,
} from '@/hooks/useOrganizations';

const generalSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  slug: z
    .string()
    .min(2, 'Slug is too short')
    .regex(
      /^[a-z0-9-]+$/,
      'Subdomain must be lowercase alphanumeric and hyphens only'
    ),
  industry: z.string().optional(),
  website: z.string().url('Invalid URL format').optional().or(z.literal('')),
  description: z.string().max(500).optional(),
});

type GeneralFormValues = z.infer<typeof generalSchema>;

export default function GeneralSettings() {
  const activeOrgId = useWorkspaceStore((state) => state.activeOrgId);
  const { data: org, isLoading: isLoadingOrg } = useOrganization(activeOrgId);
  const updateMutation = useUpdateOrganization(activeOrgId || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
  });

  useEffect(() => {
    if (org) {
      reset({
        name: org.name,
        slug: org.slug,
        industry: org.industry || '',
        website: org.website || '',
        description: org.description || '',
      });
    }
  }, [org, reset]);

  // Unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (values: GeneralFormValues) => {
    try {
      if (!activeOrgId) return;
      await updateMutation.mutateAsync(values);
      reset(values); // Mark as not dirty after successful save
    } catch (error) {
      console.error('Update failed', error);
    }
  };

  if (isLoadingOrg) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          General Settings
        </h1>
        <p className="text-slate-500 text-sm">
          Update your organization's basic information and public identity.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Organization Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Organization Name
            </label>
            <input
              {...register('name')}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none',
                errors.name &&
                  'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              )}
              placeholder="Acme Corp"
            />
            {errors.name && (
              <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.name.message}
              </p>
            )}
          </div>

          {/* Org Slug */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Organization Subdomain
            </label>
            <div className="relative">
              <input
                {...register('slug')}
                className={cn(
                  'w-full pl-4 pr-32 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none',
                  errors.slug &&
                    'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                )}
                placeholder="acme"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                .validiant.com
              </div>
            </div>
            {errors.slug && (
              <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.slug.message}
              </p>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Industry
            </label>
            <select
              {...register('industry')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none bg-white"
            >
              <option value="">Select industry...</option>
              <option value="legal">Legal Services</option>
              <option value="finance">Banking & Finance</option>
              <option value="hr">Human Resources</option>
              <option value="security">Private Security</option>
              <option value="government">Government</option>
            </select>
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              Website
            </label>
            <input
              {...register('website')}
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none',
                errors.website &&
                  'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              )}
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.website.message}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            About the Organization
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
            placeholder="Describe your organization's mission and scope..."
          />
        </div>

        {/* Sticky Actions Bar (if dirty) */}
        {isDirty && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-4xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-8 duration-300 z-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Unsaved Changes
                </p>
                <p className="text-xs text-slate-500">
                  You have modified organization settings.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-200 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Standard Submit Button (Backup) */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-200 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Update Organization
          </button>
        </div>
      </form>
    </div>
  );
}

import { cn } from '@/lib/utils';
