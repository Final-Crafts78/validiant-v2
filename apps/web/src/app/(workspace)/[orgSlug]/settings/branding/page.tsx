'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Palette,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Loader2,
  Save,
  ImageIcon,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';
import {
  useOrganization,
  useUpdateOrganization,
} from '@/hooks/useOrganizations';

// Helper for contrast calculation
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result && result[1] && result[2] && result[3]
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null;
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }) {
  const transform = (v: number) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * transform(rgb.r) +
    0.7152 * transform(rgb.g) +
    0.0722 * transform(rgb.b)
  );
}

function getContrastRatio(lux1: number, lux2: number) {
  return (Math.max(lux1, lux2) + 0.05) / (Math.min(lux1, lux2) + 0.05);
}

const brandingSchema = z.object({
  displayName: z.string().min(2).max(50),
  subtext: z.string().max(100).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format'),
  logoUrl: z.string().optional(),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export default function BrandingSettings() {
  const activeOrgId = useWorkspaceStore((state) => state.activeOrgId);
  const { data: org, isLoading: isLoadingOrg } = useOrganization(activeOrgId);
  const updateMutation = useUpdateOrganization(activeOrgId || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
  });

  const accentColor = watch('accentColor') || '#2563eb';
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (org) {
      const config = (org.settings?.brandConfig as any) || {};
      reset({
        displayName: config.displayName || org.name,
        subtext: config.subtext || 'Verification Excellence',
        accentColor: config.accentColor || '#2563eb',
        logoUrl: config.logoUrl || org.logoUrl || '',
      });
      setLogoPreview(config.logoUrl || org.logoUrl || null);
    }
  }, [org, reset]);

  // Contrast Validation
  const contrastResults = useMemo(() => {
    const rgb = hexToRgb(accentColor);
    if (!rgb) return null;

    const accentLux = getRelativeLuminance(rgb);
    const lightLux = getRelativeLuminance({ r: 1, g: 1, b: 1 }); // #FFFFFF
    const darkLux = getRelativeLuminance({
      r: 15 / 255,
      g: 23 / 255,
      b: 42 / 255,
    }); // #0F172A

    const lightRatio = getContrastRatio(accentLux, lightLux);
    const darkRatio = getContrastRatio(accentLux, darkLux);

    return {
      light: {
        ratio: lightRatio.toFixed(1),
        passed: lightRatio >= 4.5,
      },
      dark: {
        ratio: darkRatio.toFixed(1),
        passed: darkRatio >= 4.5,
      },
    };
  }, [accentColor]);

  const onSubmit = async (values: BrandingFormValues) => {
    try {
      if (!activeOrgId || !org) return;

      const newSettings = {
        ...org.settings,
        brandConfig: {
          ...values,
          updatedAt: new Date().toISOString(),
        },
      };

      await updateMutation.mutateAsync({ settings: newSettings });
      reset(values);
    } catch (error) {
      console.error('Branding update failed', error);
    }
  };

  const handleResetBranding = () => {
    if (!org) return;
    reset({
      displayName: org.name,
      subtext: 'Verification Excellence',
      accentColor: '#2563eb',
      logoUrl: '',
    });
    setLogoPreview(null);
  };

  if (isLoadingOrg) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-base)] tracking-tight">
            Whitelabel Branding
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Customize the application look and feel for your clients.
          </p>
        </div>
        <button
          onClick={handleResetBranding}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] rounded-xl transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
          Reset to Default
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="card-surface p-6 space-y-8"
          >
            {/* Display Identity */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text-base)] uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[var(--color-accent-base)]" />{' '}
                Identity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-muted)]">
                    Brand Display Name
                  </label>
                  <input
                    {...register('displayName')}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-base)] text-[var(--color-text-base)] border border-[var(--color-border-base)] focus:ring-2 focus:ring-primary-500/20 focus:border-[var(--color-accent-base)] outline-none"
                    placeholder="e.g. Acme Verification"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-muted)]">
                    Tagline / Subtext
                  </label>
                  <input
                    {...register('subtext')}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-base)] text-[var(--color-text-base)] border border-[var(--color-border-base)] focus:ring-2 focus:ring-primary-500/20 focus:border-[var(--color-accent-base)] outline-none"
                    placeholder="Verification Excellence"
                  />
                </div>
              </div>
            </div>

            {/* Logo Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text-base)] uppercase tracking-widest flex items-center gap-2">
                <Upload className="w-4 h-4 text-[var(--color-accent-base)]" />{' '}
                Organization Logo
              </h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-[var(--color-surface-muted)] rounded-2xl border-2 border-dashed border-[var(--color-border-base)] flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-[var(--color-text-muted)]" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-[var(--color-surface-soft)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-base)] text-xs font-bold rounded-lg transition-all"
                    >
                      Upload New Logo
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview(null);
                          setValue('logoUrl', '');
                        }}
                        className="px-4 py-2 text-[var(--color-critical-base)] hover:bg-[var(--color-critical-base)]/10 text-xs font-bold rounded-lg transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
                    Recommended: SVG or Transparent PNG, 512x512px
                  </p>
                </div>
              </div>
            </div>

            {/* Colors Section */}
            <div className="space-y-4 pt-4 border-t border-[var(--color-border-base)]">
              <h3 className="text-sm font-bold text-[var(--color-text-base)] uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-[var(--color-accent-base)]" />{' '}
                Color System
              </h3>
              <div className="flex flex-wrap items-end gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--color-text-muted)]">
                    Accent Color (Theme)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      {...register('accentColor')}
                      className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) =>
                        setValue('accentColor', e.target.value, {
                          shouldDirty: true,
                        })
                      }
                      className="w-24 px-3 py-2 text-sm font-mono bg-[var(--color-surface-soft)] border border-[var(--color-border-base)] rounded-lg outline-none text-[var(--color-text-base)]"
                    />
                  </div>
                </div>

                {/* WCAG Badges */}
                <div className="flex gap-2 pb-2">
                  {contrastResults && (
                    <>
                      <div
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all',
                          contrastResults.light.passed
                            ? 'bg-success-500/10 text-success-600 border-success-500/20'
                            : 'bg-critical-500/10 text-critical-600 border-critical-500/20'
                        )}
                      >
                        {contrastResults.light.passed ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        LIGHT MODE ✓ {contrastResults.light.ratio}:1
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all',
                          contrastResults.dark.passed
                            ? 'bg-success-500/10 text-success-600 border-success-500/20'
                            : 'bg-critical-500/10 text-critical-600 border-critical-500/20'
                        )}
                      >
                        {contrastResults.dark.passed ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        DARK MODE ✓ {contrastResults.dark.ratio}:1
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] italic flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> WCAG AA compliance requires
                at least 4.5:1 contrast against background surfaces.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end pt-4 border-t border-[var(--color-border-base)]">
              <button
                type="submit"
                disabled={!isDirty || isSubmitting}
                className="btn btn-primary px-8 py-3 shadow-lg shadow-[var(--color-accent-base)]/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Apply Branding
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-4">
              Live Preview
            </h3>

            {/* Card Preview */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
              <div
                className="h-40 bg-gradient-to-br p-6 flex flex-col justify-between transition-all"
                style={{ backgroundColor: accentColor }}
              >
                <div className="w-10 h-10 bg-white shadow-xl rounded-xl flex items-center justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-white font-bold text-xl drop-shadow-sm">
                    {watch('displayName')}
                  </h4>
                  <p className="text-white/80 text-xs font-medium">
                    {watch('subtext')}
                  </p>
                </div>
              </div>
              <div className="p-6 bg-[#0F172A] space-y-4">
                <div className="space-y-2">
                  <div className="h-2 w-32 bg-white/10 rounded-full" />
                  <div className="h-2 w-full bg-white/5 rounded-full" />
                  <div className="h-2 w-3/4 bg-white/5 rounded-full" />
                </div>
                <div className="pt-2">
                  <div
                    className="h-10 w-full rounded-xl transition-all"
                    style={{ backgroundColor: accentColor }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Sidebar Preview */}
            <div className="mt-8 card-surface p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[var(--color-text-base)] text-sm">
                  Sidebar Icon
                </span>
              </div>
              <div
                className="h-10 w-full rounded-xl flex items-center px-4 gap-3 transition-colors"
                style={{
                  backgroundColor: `${accentColor}15`,
                  color: accentColor,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Active State
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
