import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes with clsx and tailwind-merge.
 * Critical for dynamic component styling and CVA integration.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
