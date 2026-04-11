import { useCallback } from 'react';
import { logger } from '@/lib/logger';

/**
 * Very basic toast hook for Phase 6 deployment.
 * In a real app, this would use a Radix/Shadcn Toast component.
 */

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = 'default' }: ToastOptions) => {
      // Simple console log and alert for now, can be upgraded to full UI later
      const icon =
        variant === 'destructive' ? '❌' : variant === 'success' ? '✅' : 'ℹ️';
      logger.log(`${icon} [${variant.toUpperCase()}] ${title}: ${description}`);

      // Using native alert as a fallback for the "premium" feel since I don't have the UI components yet
      // In a follow-up, I'll build a proper Toast UI component.
    },
    []
  );

  return { toast };
}
