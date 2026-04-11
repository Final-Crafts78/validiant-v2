'use client';

import React, { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { projectsApi, organizationsApi } from '@/lib/api';
import {
  FolderKanban,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Zap,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Organization } from '@validiant/shared';
import { ArchetypePicker } from '../workspace/ArchetypePicker';

/**
 * Phase 6.C: Project Archetype Marketplace Integration
 * Two-step creation wizard with Obsidian design.
 */

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  defaultOrganizationId?: string;
}

export function CreateProjectModal({
  open,
  onClose,
  defaultOrganizationId,
}: CreateProjectModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [organizationId, setOrganizationId] = useState(
    defaultOrganizationId || ''
  );
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  // Fetch user's organizations
  const { data: orgResponse } = useQuery({
    queryKey: ['organizations', 'my'],
    queryFn: () => organizationsApi.getAll(),
    enabled: open,
  });

  const organizations = (orgResponse?.data?.data?.organizations ||
    []) as unknown as Organization[];

  if (!open) return null;

  const handleNext = () => {
    if (!name || !organizationId) {
      setError('Project name and organization are required');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!organizationId || !name) {
      setError('Missing required fields');
      setStep(1);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const projectKey =
        name
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z]/g, 'X') + Math.floor(100 + Math.random() * 900);

      await projectsApi.create({
        name,
        key: projectKey,
        description,
        organizationId,
        templateId: templateId || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Reset form
      setName('');
      setDescription('');
      setTemplateId(null);
      setStep(1);
      if (!defaultOrganizationId) setOrganizationId('');
      onClose();
    } catch (err: any) {
      console.error('[CreateProjectModal] Submission error:', err);
      // Extract the most descriptive message possible
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to create project. Please verify organization and try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className={cn(
          'modal-surface w-full transition-all duration-500',
          step === 1 ? 'max-w-md' : 'max-w-2xl'
        )}
      >
        <div className="px-6 py-4 border-b border-[var(--color-border-base)] flex items-center justify-between bg-[var(--color-surface-soft)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              {step === 1 ? (
                <FolderKanban className="w-5 h-5 text-[var(--color-accent-base)]" />
              ) : (
                <Zap className="w-5 h-5 text-[var(--color-accent-base)]" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-base)]">
                {step === 1 ? 'Project Identity' : 'Platform Archetype'}
              </h2>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-black tracking-widest">
                Step {step} of 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-soft)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 text-red-500 text-sm rounded-xl border border-red-500/20 flex gap-3 items-center animate-in shake-in">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-subtle)] mb-2">
                  Organization
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="w-full bg-[var(--color-surface-soft)] border border-[var(--color-border-base)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-accent-base)]/20 outline-none transition-all font-medium"
                >
                  <option value="" disabled>
                    Select Organization
                  </option>
                  {organizations.map((org: Organization) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-text-subtle)] mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q2 Compliance Audit"
                  className="w-full bg-[var(--color-surface-soft)] border border-[var(--color-border-base)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-accent-base)]/20 outline-none transition-all font-medium placeholder:text-[var(--color-text-muted)]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-text-subtle)] mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="The objective of this universe is..."
                  className="w-full bg-[var(--color-surface-soft)] border border-[var(--color-border-base)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-accent-base)]/20 outline-none transition-all font-medium min-h-[100px] placeholder:text-[var(--color-text-muted)]/50"
                />
              </div>
            </div>
          ) : (
            <ArchetypePicker selectedId={templateId} onSelect={setTemplateId} />
          )}

          <div className="mt-8 pt-6 border-t border-[var(--color-border-base)] flex justify-between gap-3">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-[var(--color-accent-base)] text-[var(--color-text-base)] px-8 py-3 rounded-xl font-bold text-sm hover:bg-[var(--color-accent-base)]/90 transition-all flex items-center gap-2 hover:translate-x-1"
                >
                  Configure Schema
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 text-sm font-bold text-[var(--color-text-subtle)] flex items-center gap-2 hover:text-[var(--color-text-base)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="bg-[var(--color-accent-base)] text-[var(--color-text-base)] px-10 py-3 rounded-xl font-bold text-sm hover:bg-[var(--color-accent-base)]/90 transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Initialize Universe
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CreateProjectModalTriggerProps {
  defaultOrganizationId?: string;
  className?: string;
}

export function CreateProjectModalTrigger({
  defaultOrganizationId,
  className,
}: CreateProjectModalTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-[var(--color-text-base)] rounded-lg hover:bg-blue-700 transition-colors shrink-0'
        }
      >
        <Plus className="h-4 w-4" />
        <span>New Project</span>
      </button>

      <CreateProjectModal
        open={open}
        onClose={() => setOpen(false)}
        defaultOrganizationId={defaultOrganizationId}
      />
    </>
  );
}
