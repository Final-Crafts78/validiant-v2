'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/lib/api';
import { Building2, X, Save, Palette } from 'lucide-react';
import Link from 'next/link';
import { UpdateOrganizationData } from '@validiant/shared';

interface OrgForSettings {
  id: string;
  name: string;
  description?: string | null;
  industry?: string | null;
  slug?: string;
}

interface OrgSettingsModalProps {
  open: boolean;
  onClose: () => void;
  organization: OrgForSettings;
}

export function OrgSettingsModal({
  open,
  onClose,
  organization,
}: OrgSettingsModalProps) {
  const [name, setName] = useState(organization?.name || '');
  const [description, setDescription] = useState(
    organization?.description || ''
  );
  const [industry, setIndustry] = useState(organization?.industry || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setName(organization?.name || '');
      setDescription(organization?.description || '');
      setIndustry(organization?.industry || '');
      setError('');
    }
  }, [open, organization]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    setIsSubmitting(true);

    try {
      await organizationsApi.update(organization.id, {
        name,
        description,
        industry,
      } as UpdateOrganizationData);

      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to update organization');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="modal-surface w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-text-base">
              Organization Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-base hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-subtle mb-1"
              >
                Organization Name <span className="text-danger-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input w-full"
              />
            </div>

            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-text-subtle mb-1"
              >
                Industry
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="input w-full"
                placeholder="e.g. Technology, Healthcare, etc."
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-text-subtle mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full min-h-[100px] py-2"
              />
            </div>
            
            {organization.slug && (
              <div className="pt-4 border-t border-border-base mt-4">
                <Link
                  href={`/${organization.slug}/settings/branding`}
                  onClick={onClose}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-border-base bg-surface-muted hover:bg-surface-soft hover:border-primary-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-600">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-text-base group-hover:text-primary-600 transition-colors">Theme & Branding</p>
                      <p className="text-xs text-text-muted">Customize colors, logo, and identity</p>
                    </div>
                  </div>
                  <span className="text-text-muted group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
