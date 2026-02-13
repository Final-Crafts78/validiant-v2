/**
 * Validation Utilities
 * 
 * Comprehensive validation functions for all data types.
 * Used across API, web, and mobile applications.
 */

import { VALIDATION } from '../constants';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (email.length < VALIDATION.EMAIL.MIN_LENGTH) {
    return { isValid: false, error: `Email must be at least ${VALIDATION.EMAIL.MIN_LENGTH} characters` };
  }
  
  if (email.length > VALIDATION.EMAIL.MAX_LENGTH) {
    return { isValid: false, error: `Email must not exceed ${VALIDATION.EMAIL.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION.EMAIL.REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
};

/**
 * Password validation
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < VALIDATION.PASSWORD.MIN_LENGTH) {
    return { isValid: false, error: `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters` };
  }
  
  if (password.length > VALIDATION.PASSWORD.MAX_LENGTH) {
    return { isValid: false, error: `Password must not exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters` };
  }
  
  if (VALIDATION.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (VALIDATION.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (VALIDATION.PASSWORD.REQUIRE_NUMBER && !/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  if (VALIDATION.PASSWORD.REQUIRE_SPECIAL && !/[@$!%*?&]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character (@$!%*?&)' };
  }
  
  return { isValid: true };
};

/**
 * Password strength calculator
 */
export const calculatePasswordStrength = (password: string): {
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
} => {
  let score = 0;
  
  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&]/.test(password)) score += 1;
  
  // Determine strength
  if (score <= 3) return { strength: 'weak', score };
  if (score <= 5) return { strength: 'fair', score };
  if (score <= 6) return { strength: 'good', score };
  return { strength: 'strong', score };
};

/**
 * Username validation
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < VALIDATION.USERNAME.MIN_LENGTH) {
    return { isValid: false, error: `Username must be at least ${VALIDATION.USERNAME.MIN_LENGTH} characters` };
  }
  
  if (username.length > VALIDATION.USERNAME.MAX_LENGTH) {
    return { isValid: false, error: `Username must not exceed ${VALIDATION.USERNAME.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION.USERNAME.REGEX.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { isValid: true };
};

/**
 * Full name validation
 */
export const validateFullName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION.FULL_NAME.MIN_LENGTH) {
    return { isValid: false, error: `Name must be at least ${VALIDATION.FULL_NAME.MIN_LENGTH} characters` };
  }
  
  if (trimmedName.length > VALIDATION.FULL_NAME.MAX_LENGTH) {
    return { isValid: false, error: `Name must not exceed ${VALIDATION.FULL_NAME.MAX_LENGTH} characters` };
  }
  
  return { isValid: true };
};

/**
 * Phone number validation
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  if (!VALIDATION.PHONE_NUMBER.REGEX.test(phone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  return { isValid: true };
};

/**
 * Project name validation
 */
export const validateProjectName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, error: 'Project name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION.PROJECT_NAME.MIN_LENGTH) {
    return { isValid: false, error: `Project name must be at least ${VALIDATION.PROJECT_NAME.MIN_LENGTH} characters` };
  }
  
  if (trimmedName.length > VALIDATION.PROJECT_NAME.MAX_LENGTH) {
    return { isValid: false, error: `Project name must not exceed ${VALIDATION.PROJECT_NAME.MAX_LENGTH} characters` };
  }
  
  return { isValid: true };
};

/**
 * Project key validation (e.g., "PROJ", "TASK")
 */
export const validateProjectKey = (key: string): ValidationResult => {
  if (!key) {
    return { isValid: false, error: 'Project key is required' };
  }
  
  if (key.length < VALIDATION.PROJECT_KEY.MIN_LENGTH) {
    return { isValid: false, error: `Project key must be at least ${VALIDATION.PROJECT_KEY.MIN_LENGTH} characters` };
  }
  
  if (key.length > VALIDATION.PROJECT_KEY.MAX_LENGTH) {
    return { isValid: false, error: `Project key must not exceed ${VALIDATION.PROJECT_KEY.MAX_LENGTH} characters` };
  }
  
  if (!VALIDATION.PROJECT_KEY.REGEX.test(key)) {
    return { isValid: false, error: 'Project key must start with a letter and contain only uppercase letters and numbers' };
  }
  
  return { isValid: true };
};

/**
 * Task title validation
 */
export const validateTaskTitle = (title: string): ValidationResult => {
  if (!title) {
    return { isValid: false, error: 'Task title is required' };
  }
  
  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length < VALIDATION.TASK_TITLE.MIN_LENGTH) {
    return { isValid: false, error: `Task title must be at least ${VALIDATION.TASK_TITLE.MIN_LENGTH} characters` };
  }
  
  if (trimmedTitle.length > VALIDATION.TASK_TITLE.MAX_LENGTH) {
    return { isValid: false, error: `Task title must not exceed ${VALIDATION.TASK_TITLE.MAX_LENGTH} characters` };
  }
  
  return { isValid: true };
};

/**
 * Description validation
 */
export const validateDescription = (description: string): ValidationResult => {
  if (!description) {
    return { isValid: true }; // Description is optional
  }
  
  if (description.length > VALIDATION.DESCRIPTION.MAX_LENGTH) {
    return { isValid: false, error: `Description must not exceed ${VALIDATION.DESCRIPTION.MAX_LENGTH} characters` };
  }
  
  return { isValid: true };
};

/**
 * URL validation
 */
export const validateUrl = (url: string): ValidationResult => {
  if (!url) {
    return { isValid: true }; // URL is optional
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Date validation (ensure it's a valid date)
 */
export const validateDate = (date: Date | string): ValidationResult => {
  if (!date) {
    return { isValid: false, error: 'Date is required' };
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  return { isValid: true };
};

/**
 * Date range validation (start date must be before end date)
 */
export const validateDateRange = (startDate: Date, endDate: Date): ValidationResult => {
  const startValidation = validateDate(startDate);
  if (!startValidation.isValid) {
    return startValidation;
  }
  
  const endValidation = validateDate(endDate);
  if (!endValidation.isValid) {
    return endValidation;
  }
  
  if (startDate >= endDate) {
    return { isValid: false, error: 'Start date must be before end date' };
  }
  
  return { isValid: true };
};

/**
 * Number validation (within range)
 */
export const validateNumberInRange = (
  value: number,
  min: number,
  max: number,
  fieldName = 'Value'
): ValidationResult => {
  if (typeof value !== 'number' || isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (value < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }
  
  if (value > max) {
    return { isValid: false, error: `${fieldName} must not exceed ${max}` };
  }
  
  return { isValid: true };
};

/**
 * Time entry validation
 */
export const validateTimeEntry = (startTime: Date, endTime?: Date): ValidationResult => {
  const startValidation = validateDate(startTime);
  if (!startValidation.isValid) {
    return startValidation;
  }
  
  if (endTime) {
    const endValidation = validateDate(endTime);
    if (!endValidation.isValid) {
      return endValidation;
    }
    
    if (startTime >= endTime) {
      return { isValid: false, error: 'Start time must be before end time' };
    }
    
    // Check if duration is reasonable (e.g., not more than 24 hours)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 24) {
      return { isValid: false, error: 'Time entry duration cannot exceed 24 hours' };
    }
  }
  
  return { isValid: true };
};

/**
 * File size validation
 */
export const validateFileSize = (size: number, maxSize: number): ValidationResult => {
  if (size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { isValid: false, error: `File size must not exceed ${maxSizeMB}MB` };
  }
  
  return { isValid: true };
};

/**
 * File type validation
 */
export const validateFileType = (mimeType: string, allowedTypes: string[]): ValidationResult => {
  if (!allowedTypes.includes(mimeType)) {
    return { isValid: false, error: 'File type is not supported' };
  }
  
  return { isValid: true };
};

/**
 * Array validation (non-empty)
 */
export const validateNonEmptyArray = <T>(array: T[], fieldName = 'Items'): ValidationResult => {
  if (!Array.isArray(array) || array.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }
  
  return { isValid: true };
};

/**
 * UUID validation
 */
export const validateUuid = (uuid: string): ValidationResult => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    return { isValid: false, error: 'Invalid UUID format' };
  }
  
  return { isValid: true };
};

/**
 * Hex color validation
 */
export const validateHexColor = (color: string): ValidationResult => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  
  if (!hexRegex.test(color)) {
    return { isValid: false, error: 'Invalid hex color format' };
  }
  
  return { isValid: true };
};

/**
 * JSON validation
 */
export const validateJson = (jsonString: string): ValidationResult => {
  try {
    JSON.parse(jsonString);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid JSON format' };
  }
};

/**
 * Credit card number validation (Luhn algorithm)
 */
export const validateCreditCard = (cardNumber: string): ValidationResult => {
  const cleaned = cardNumber.replace(/\s+/g, '');
  
  if (!/^\d{13,19}$/.test(cleaned)) {
    return { isValid: false, error: 'Invalid credit card number' };
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Invalid credit card number' };
  }
  
  return { isValid: true };
};

/**
 * Batch validation - validate multiple fields
 */
export const validateBatch = (
  validations: Record<string, ValidationResult>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;
  
  for (const [field, result] of Object.entries(validations)) {
    if (!result.isValid && result.error) {
      errors[field] = result.error;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

/**
 * Helper: Check if value is required and present
 */
export const validateRequired = (value: unknown, fieldName = 'Field'): ValidationResult => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
};
