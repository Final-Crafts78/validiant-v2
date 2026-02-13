/**
 * Date Utilities
 * 
 * Helper functions for date and time operations.
 * Uses date-fns for reliable date manipulation.
 */

import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addHours,
  addMinutes,
  subDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  parseISO,
} from 'date-fns';

import { DATE_FORMATS } from '../constants';

/**
 * Format date for API requests (YYYY-MM-DD)
 */
export const formatDateForApi = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Format date and time for API requests (YYYY-MM-DD HH:mm:ss)
 */
export const formatDateTimeForApi = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd HH:mm:ss');
};

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM d, yyyy');
};

/**
 * Format date and time for display (e.g., "Jan 15, 2026 3:30 PM")
 */
export const formatDateTimeForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM d, yyyy h:mm a');
};

/**
 * Format time for display (e.g., "3:30 PM")
 */
export const formatTimeForDisplay = (date: Date | string, use24Hour = false): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, use24Hour ? 'HH:mm' : 'h:mm a');
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Get smart date label based on date
 * Returns "Today", "Yesterday", "Tomorrow", or formatted date
 */
export const getSmartDateLabel = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) return 'Today';
  if (isYesterday(dateObj)) return 'Yesterday';
  if (isTomorrow(dateObj)) return 'Tomorrow';
  
  if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE'); // Day name
  }
  
  if (isThisMonth(dateObj)) {
    return format(dateObj, 'MMM d');
  }
  
  return format(dateObj, 'MMM d, yyyy');
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
};

/**
 * Check if a date is due soon (within 24 hours)
 */
export const isDueSoon = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const hoursDiff = differenceInHours(dateObj, now);
  return hoursDiff > 0 && hoursDiff <= 24;
};

/**
 * Check if a date is overdue
 */
export const isOverdue = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
};

/**
 * Get date range for current day
 */
export const getTodayRange = (): { start: Date; end: Date } => {
  const now = new Date();
  return {
    start: startOfDay(now),
    end: endOfDay(now),
  };
};

/**
 * Get date range for current week
 */
export const getThisWeekRange = (weekStartsOn: 0 | 1 | 6 = 1): { start: Date; end: Date } => {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn }),
    end: endOfWeek(now, { weekStartsOn }),
  };
};

/**
 * Get date range for current month
 */
export const getThisMonthRange = (): { start: Date; end: Date } => {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
};

/**
 * Get date range for last N days
 */
export const getLastNDaysRange = (days: number): { start: Date; end: Date } => {
  const now = new Date();
  return {
    start: startOfDay(subDays(now, days)),
    end: endOfDay(now),
  };
};

/**
 * Add business days to a date (skips weekends)
 */
export const addBusinessDays = (date: Date, days: number): Date => {
  let result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result = addDays(result, 1);
    const dayOfWeek = result.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  
  return result;
};

/**
 * Calculate business days between two dates
 */
export const getBusinessDaysBetween = (startDate: Date, endDate: Date): number => {
  let count = 0;
  let current = new Date(startDate);
  
  while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current = addDays(current, 1);
  }
  
  return count;
};

/**
 * Parse date string to Date object
 */
export const parseDate = (dateString: string): Date => {
  return parseISO(dateString);
};

/**
 * Convert date to ISO string
 */
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Get time ago in words (e.g., "2 hours ago")
 */
export const getTimeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const seconds = differenceInSeconds(new Date(), dateObj);
  
  if (seconds < 60) {
    return 'just now';
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

/**
 * Get duration between two dates in human-readable format
 */
export const getDurationBetween = (startDate: Date, endDate: Date): string => {
  const days = differenceInDays(endDate, startDate);
  const hours = differenceInHours(endDate, startDate) % 24;
  const minutes = differenceInMinutes(endDate, startDate) % 60;
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  if (minutes > 0 && days === 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  
  if (parts.length === 0) {
    return 'less than a minute';
  }
  
  return parts.join(', ');
};

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Get current timestamp
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * Convert timestamp to Date
 */
export const timestampToDate = (timestamp: number): Date => {
  return new Date(timestamp);
};

/**
 * Get start of today
 */
export const getStartOfToday = (): Date => {
  return startOfDay(new Date());
};

/**
 * Get end of today
 */
export const getEndOfToday = (): Date => {
  return endOfDay(new Date());
};
