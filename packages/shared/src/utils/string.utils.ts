/**
 * String Utilities
 * 
 * Helper functions for string manipulation, formatting, and validation.
 */

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Convert string to lowercase
 */
export const lowercase = (str: string): string => {
  return str.toLowerCase();
};

/**
 * Convert string to uppercase
 */
export const uppercase = (str: string): string => {
  return str.toUpperCase();
};

/**
 * Truncate string to specified length with ellipsis
 */
export const truncate = (str: string, length: number, suffix = '...'): string => {
  if (!str || str.length <= length) return str;
  return str.slice(0, length).trim() + suffix;
};

/**
 * Truncate string to specified number of words
 */
export const truncateWords = (str: string, wordCount: number, suffix = '...'): string => {
  if (!str) return '';
  const words = str.split(/\s+/);
  if (words.length <= wordCount) return str;
  return words.slice(0, wordCount).join(' ') + suffix;
};

/**
 * Generate URL-friendly slug from string
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate unique slug by appending number if needed
 */
export const generateUniqueSlug = (str: string, existingSlugs: string[]): string => {
  let slug = slugify(str);
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${slugify(str)}-${counter}`;
    counter++;
  }
  
  return slug;
};

/**
 * Convert camelCase to snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Convert snake_case to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase to kebab-case
 */
export const camelToKebab = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
};

/**
 * Convert kebab-case to camelCase
 */
export const kebabToCamel = (str: string): string => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Remove extra whitespace from string
 */
export const removeExtraSpaces = (str: string): string => {
  return str.replace(/\s+/g, ' ').trim();
};

/**
 * Check if string is empty or only whitespace
 */
export const isEmptyOrWhitespace = (str: string): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * Count words in a string
 */
export const countWords = (str: string): number => {
  if (!str) return 0;
  return str.trim().split(/\s+/).length;
};

/**
 * Count characters in a string (excluding whitespace)
 */
export const countCharacters = (str: string, includeSpaces = true): number => {
  if (!str) return 0;
  return includeSpaces ? str.length : str.replace(/\s/g, '').length;
};

/**
 * Extract initials from name (e.g., "John Doe" -> "JD")
 */
export const getInitials = (name: string, maxLength = 2): string => {
  if (!name) return '';
  
  const words = name.trim().split(/\s+/);
  const initials = words
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  return initials.slice(0, maxLength);
};

/**
 * Mask email address (e.g., "john@example.com" -> "j***@example.com")
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '***';
  return `${maskedUsername}@${domain}`;
};

/**
 * Mask phone number (e.g., "+1234567890" -> "+1****7890")
 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  
  const lastFour = phone.slice(-4);
  const prefix = phone.slice(0, 2);
  return `${prefix}${'*'.repeat(phone.length - 6)}${lastFour}`;
};

/**
 * Highlight search term in text
 */
export const highlightText = (text: string, searchTerm: string, highlightClass = 'highlight'): string => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
};

/**
 * Escape special regex characters
 */
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Escape HTML special characters
 */
export const escapeHtml = (str: string): string => {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return str.replace(/[&<>"']/g, char => htmlEscapeMap[char]);
};

/**
 * Unescape HTML special characters
 */
export const unescapeHtml = (str: string): string => {
  const htmlUnescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };
  
  return str.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => htmlUnescapeMap[entity]);
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number, charset = 'alphanumeric'): string => {
  const charsets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    numeric: '0123456789',
    hex: '0123456789abcdef',
  };
  
  const chars = charsets[charset as keyof typeof charsets] || charsets.alphanumeric;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  };
  
  return result;
};

/**
 * Check if string contains only letters
 */
export const isAlpha = (str: string): boolean => {
  return /^[a-zA-Z]+$/.test(str);
};

/**
 * Check if string contains only numbers
 */
export const isNumeric = (str: string): boolean => {
  return /^[0-9]+$/.test(str);
};

/**
 * Check if string contains only letters and numbers
 */
export const isAlphanumeric = (str: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * Compare two strings for equality (case-insensitive)
 */
export const equalsIgnoreCase = (str1: string, str2: string): boolean => {
  return str1.toLowerCase() === str2.toLowerCase();
};

/**
 * Check if string contains substring (case-insensitive)
 */
export const containsIgnoreCase = (str: string, searchTerm: string): boolean => {
  return str.toLowerCase().includes(searchTerm.toLowerCase());
};

/**
 * Reverse a string
 */
export const reverse = (str: string): string => {
  return str.split('').reverse().join('');
};

/**
 * Pad string to specified length
 */
export const pad = (str: string, length: number, padChar = ' ', padLeft = true): string => {
  if (str.length >= length) return str;
  
  const padding = padChar.repeat(length - str.length);
  return padLeft ? padding + str : str + padding;
};

/**
 * Remove specified characters from start and end of string
 */
export const trim = (str: string, chars = ' '): string => {
  const pattern = new RegExp(`^[${escapeRegex(chars)}]+|[${escapeRegex(chars)}]+$`, 'g');
  return str.replace(pattern, '');
};

/**
 * Split string into chunks of specified size
 */
export const chunkString = (str: string, size: number): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
};

/**
 * Calculate similarity between two strings (0-1)
 * Uses Levenshtein distance
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (num: number, separator = ','): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

/**
 * Pluralize word based on count
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};

/**
 * Format count with word (e.g., "1 task", "5 tasks")
 */
export const formatCount = (count: number, singular: string, plural?: string): string => {
  return `${count} ${pluralize(count, singular, plural)}`;
};
