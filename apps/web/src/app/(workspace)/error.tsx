'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Workspace Error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="card-surface max-w-md w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-critical-500/10 text-critical-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text-base tracking-tight">
            Something went wrong
          </h2>
          <p className="text-sm text-text-muted">
            We encountered an unexpected error while loading this workspace
            page.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="text-left bg-surface-muted p-4 rounded-lg overflow-auto max-h-48 text-xs font-mono text-text-muted">
            {error.message}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4 border-t border-border-base">
          <button
            onClick={() => reset()}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="btn btn-outline w-full text-text-muted hover:text-text-base transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
