'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/lib/api';
import { LogIn, X } from 'lucide-react';

interface JoinOrganizationModalProps {
  open: boolean;
  onClose: () => void;
}

export function JoinOrganizationModal({
  open,
  onClose,
}: JoinOrganizationModalProps) {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setError('');
    setIsSubmitting(true);

    try {
      await organizationsApi.acceptInvite(token);

      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setToken('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to join organization');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <LogIn className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Join Organization
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Invite Token or Link <span className="text-red-500">*</span>
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="input w-full"
              placeholder="Paste your token here"
            />
            <p className="text-xs text-gray-500 mt-2">
              If you got an invite link (e.g., validiant.in/invite/abc), just
              paste the "abc" token part here.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
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
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
              disabled={isSubmitting || !token.trim()}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>Join</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
