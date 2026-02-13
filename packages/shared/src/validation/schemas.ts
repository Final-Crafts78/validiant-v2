/**
 * Validation Schemas
 * 
 * Zod schemas for validating input data.
 */

import { z } from 'zod';

/**
 * Constants for validation
 */
export const VALIDATION = {
  EMAIL: {
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
  },
} as const;

/**
 * Auth validation schemas
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(VALIDATION.EMAIL.MAX_LENGTH, `Email must be at most ${VALIDATION.EMAIL.MAX_LENGTH} characters`),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(VALIDATION.EMAIL.MAX_LENGTH, `Email must be at most ${VALIDATION.EMAIL.MAX_LENGTH} characters`),
  password: z
    .string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `Password must be at most ${VALIDATION.PASSWORD.MAX_LENGTH} characters`)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  firstName: z
    .string()
    .min(VALIDATION.NAME.MIN_LENGTH, `First name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`)
    .max(VALIDATION.NAME.MAX_LENGTH, `First name must be at most ${VALIDATION.NAME.MAX_LENGTH} characters`)
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(VALIDATION.NAME.MIN_LENGTH, `Last name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`)
    .max(VALIDATION.NAME.MAX_LENGTH, `Last name must be at most ${VALIDATION.NAME.MAX_LENGTH} characters`)
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(VALIDATION.EMAIL.MAX_LENGTH, `Email must be at most ${VALIDATION.EMAIL.MAX_LENGTH} characters`),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `Password must be at most ${VALIDATION.PASSWORD.MAX_LENGTH} characters`)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
});

/**
 * Project validation schemas
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.TITLE.MIN_LENGTH, `Name must be at least ${VALIDATION.TITLE.MIN_LENGTH} characters`)
    .max(VALIDATION.TITLE.MAX_LENGTH, `Name must be at most ${VALIDATION.TITLE.MAX_LENGTH} characters`),
  description: z
    .string()
    .min(VALIDATION.DESCRIPTION.MIN_LENGTH, `Description must be at least ${VALIDATION.DESCRIPTION.MIN_LENGTH} characters`)
    .max(VALIDATION.DESCRIPTION.MAX_LENGTH, `Description must be at most ${VALIDATION.DESCRIPTION.MAX_LENGTH} characters`),
  organizationId: z.string().uuid('Invalid organization ID'),
  dueDate: z.string().datetime().optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.TITLE.MIN_LENGTH, `Name must be at least ${VALIDATION.TITLE.MIN_LENGTH} characters`)
    .max(VALIDATION.TITLE.MAX_LENGTH, `Name must be at most ${VALIDATION.TITLE.MAX_LENGTH} characters`)
    .optional(),
  description: z
    .string()
    .min(VALIDATION.DESCRIPTION.MIN_LENGTH, `Description must be at least ${VALIDATION.DESCRIPTION.MIN_LENGTH} characters`)
    .max(VALIDATION.DESCRIPTION.MAX_LENGTH, `Description must be at most ${VALIDATION.DESCRIPTION.MAX_LENGTH} characters`)
    .optional(),
  status: z.enum(['active', 'completed', 'on-hold', 'planning']).optional(),
  progress: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional(),
});

/**
 * Task validation schemas
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE.MIN_LENGTH, `Title must be at least ${VALIDATION.TITLE.MIN_LENGTH} characters`)
    .max(VALIDATION.TITLE.MAX_LENGTH, `Title must be at most ${VALIDATION.TITLE.MAX_LENGTH} characters`),
  description: z
    .string()
    .min(VALIDATION.DESCRIPTION.MIN_LENGTH, `Description must be at least ${VALIDATION.DESCRIPTION.MIN_LENGTH} characters`)
    .max(VALIDATION.DESCRIPTION.MAX_LENGTH, `Description must be at most ${VALIDATION.DESCRIPTION.MAX_LENGTH} characters`),
  projectId: z.string().uuid('Invalid project ID'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().uuid('Invalid assignee ID').optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE.MIN_LENGTH, `Title must be at least ${VALIDATION.TITLE.MIN_LENGTH} characters`)
    .max(VALIDATION.TITLE.MAX_LENGTH, `Title must be at most ${VALIDATION.TITLE.MAX_LENGTH} characters`)
    .optional(),
  description: z
    .string()
    .min(VALIDATION.DESCRIPTION.MIN_LENGTH, `Description must be at least ${VALIDATION.DESCRIPTION.MIN_LENGTH} characters`)
    .max(VALIDATION.DESCRIPTION.MAX_LENGTH, `Description must be at most ${VALIDATION.DESCRIPTION.MAX_LENGTH} characters`)
    .optional(),
  status: z.enum(['todo', 'in-progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().uuid('Invalid assignee ID').nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

/**
 * Organization validation schemas
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.TITLE.MIN_LENGTH, `Name must be at least ${VALIDATION.TITLE.MIN_LENGTH} characters`)
    .max(VALIDATION.TITLE.MAX_LENGTH, `Name must be at most ${VALIDATION.TITLE.MAX_LENGTH} characters`),
  description: z
    .string()
    .min(VALIDATION.DESCRIPTION.MIN_LENGTH, `Description must be at least ${VALIDATION.DESCRIPTION.MIN_LENGTH} characters`)
    .max(VALIDATION.DESCRIPTION.MAX_LENGTH, `Description must be at most ${VALIDATION.DESCRIPTION.MAX_LENGTH} characters`),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.TITLE.MIN_LENGTH, `Name must be at least ${VALIDATION.TITLE.MIN_LENGTH} characters`)
    .max(VALIDATION.TITLE.MAX_LENGTH, `Name must be at most ${VALIDATION.TITLE.MAX_LENGTH} characters`)
    .optional(),
  description: z
    .string()
    .min(VALIDATION.DESCRIPTION.MIN_LENGTH, `Description must be at least ${VALIDATION.DESCRIPTION.MIN_LENGTH} characters`)
    .max(VALIDATION.DESCRIPTION.MAX_LENGTH, `Description must be at most ${VALIDATION.DESCRIPTION.MAX_LENGTH} characters`)
    .optional(),
});

/**
 * Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
