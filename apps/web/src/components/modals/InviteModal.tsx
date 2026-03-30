'use client';

import { useState } from 'react';
import { organizationsApi } from '@/lib/api';
import { UserPlus, Copy, X, CheckCircle } from 'lucide-react';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
}

export function InviteModal({
  open,
  onClose,
  organizationId,
}: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !role) return;

    setError('');
    setIsSubmitting(true);

    try {
      const response = await organizationsApi.invite(organizationId, {
        email,
        role,
      });

      if (response.data?.data?.inviteUrl) {
        setInviteUrl(response.data.data.inviteUrl);
      } else {
        setError('Successfully invited, but no URL was returned.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to send invite');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAndClose = () => {
    setEmail('');
    setRole('member');
    setInviteUrl('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="modal-surface w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-primary-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-text-base">
              Invite Members
            </h2>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 text-text-muted hover:text-text-base hover:bg-surface-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {inviteUrl ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
                </div>
                <h3 className="text-lg font-medium text-text-base">
                  Invite Generated
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  Share this unique link to grant access.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-subtle mb-1">
                  Invitation Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="input w-full bg-surface-subtle text-text-muted font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn btn-outline p-2 min-h-0 h-[42px] shrink-0"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="btn btn-primary w-full"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-subtle mb-1"
                >
                  Email Address <span className="text-danger-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input w-full"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-text-subtle mb-1"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input w-full bg-[var(--color-surface-base)]"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-text-muted mt-1.5">
                  {role === 'admin'
                    ? 'Admins can invite others, edit org settings, and manage projects.'
                    : 'Members can access and contribute to assigned projects.'}
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Generate Invite</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
