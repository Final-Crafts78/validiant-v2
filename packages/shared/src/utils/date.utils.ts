/**
 * Date Utilities
 *
 * Helper functions for date and time operations.
 * Uses native Date API — no external dependencies.
 */

/**
 * Format date for API requests (YYYY-MM-DD)
 */
export const formatDateForApi = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Format date and time for API requests (YYYY-MM-DD HH:mm:ss)
 */
export const formatDateTimeForApi = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().replace('T', ' ').slice(0, 19);
};

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format date and time for display (e.g., "Jan 15, 2026 3:30 PM")
 */
export const formatDateTimeForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format time for display (e.g., "3:30 PM")
 */
export const formatTimeForDisplay = (
  date: Date | string,
  use24Hour = false
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  });
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.round((Date.now() - dateObj.getTime()) / 1000);
  const absSeconds = Math.abs(seconds);
  const isFuture = seconds < 0;

  if (absSeconds < 60) return isFuture ? 'in a few seconds' : 'just now';
  const minutes = Math.floor(absSeconds / 60);
  if (minutes < 60)
    return isFuture ? `in ${minutes} minute(s)` : `${minutes} minute(s) ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return isFuture ? `in ${hours} hour(s)` : `${hours} hour(s) ago`;
  const days = Math.floor(hours / 24);
  return isFuture ? `in ${days} day(s)` : `${days} day(s) ago`;
};

/**
 * Get smart date label
 */
export const getSmartDateLabel = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  if (diff > 0 && diff < 7)
    return dateObj.toLocaleDateString('en-US', { weekday: 'long' });

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > Date.now();
};

/**
 * Check if due within 24 hours
 */
export const isDueSoon = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const hours = (dateObj.getTime() - Date.now()) / (1000 * 60 * 60);
  return hours > 0 && hours <= 24;
};

/**
 * Check if overdue
 */
export const isOverdue = (date: Date | string): boolean => isPastDate(date);

/**
 * Get today's date range
 */
export const getTodayRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  return { start, end };
};

/**
 * Get this week's date range
 */
export const getThisWeekRange = (
  weekStartsOn: 0 | 1 | 6 = 1
): { start: Date; end: Date } => {
  const now = new Date();
  const day = now.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Get this month's date range
 */
export const getThisMonthRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  return { start, end };
};

/**
 * Get last N days range
 */
export const getLastNDaysRange = (days: number): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Add business days (skips weekends)
 */
export const addBusinessDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
};

/**
 * Count business days between two dates
 */
export const getBusinessDaysBetween = (
  startDate: Date,
  endDate: Date
): number => {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

/**
 * Parse ISO date string
 */
export const parseDate = (dateString: string): Date => new Date(dateString);

/**
 * Convert to ISO string
 */
export const toISOString = (date: Date): string => date.toISOString();

/**
 * Get time ago in words
 */
export const getTimeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

/**
 * Duration between two dates in human-readable format
 */
export const getDurationBetween = (startDate: Date, endDate: Date): string => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  if (minutes > 0 && days === 0)
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  return parts.length === 0 ? 'less than a minute' : parts.join(', ');
};

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (
  date1: Date | string,
  date2: Date | string
): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/** Get current timestamp */
export const getCurrentTimestamp = (): number => Date.now();

/** Convert timestamp to Date */
export const timestampToDate = (timestamp: number): Date => new Date(timestamp);

/** Get start of today */
export const getStartOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** Get end of today */
export const getEndOfToday = (): Date => {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
};
