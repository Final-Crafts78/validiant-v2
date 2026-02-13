/**
 * Authentication Middleware
 * 
 * JWT-based authentication and role-based access control.
 * Handles token verification, user extraction, and permission checking.
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { db } from '../config/database.config';
import { cache } from '../config/redis.config';
import { AuthRequest } from './index';
import {
  UnauthorizedError,
  ForbiddenError,
  TokenError,
  PermissionError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { UserRole, OrganizationRole } from '@validiant/shared';

/**
 * JWT payload interface
 */
interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}

/**
 * Cached user data interface
 */
interface CachedUser {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  emailVerified: boolean;
  organizationId?: string;
  organizationRole?: OrganizationRole;
}

/**
 * Extract token from Authorization header
 */
const extractToken = (req: AuthRequest): string | null => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Bearer token format: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new TokenError('Invalid authorization header format. Use: Bearer <token>');
  }
  
  return parts[1];
};

/**
 * Verify JWT token
 */
const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenError('Invalid token');
    }
    throw new TokenError('Token verification failed');
  }
};

/**
 * Get user from cache or database
 */
const getUser = async (userId: string): Promise<CachedUser> => {
  // Try cache first
  const cacheKey = `user:${userId}`;
  const cached = await cache.get<CachedUser>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const user = await db.one<CachedUser>(
    `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u.email_verified as "emailVerified",
        om.organization_id as "organizationId",
        om.role as "organizationRole"
      FROM users u
      LEFT JOIN organization_members om ON u.id = om.user_id AND om.deleted_at IS NULL
      WHERE u.id = $1 AND u.deleted_at IS NULL
    `,
    [userId]
  );
  
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  
  // Cache for 5 minutes
  await cache.set(cacheKey, user, 300);
  
  return user;
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token
    const token = extractToken(req);
    
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }
    
    // Verify token
    const payload = verifyToken(token);
    
    // Check if session is valid
    const sessionKey = `session:${payload.sessionId}`;
    const sessionExists = await cache.exists(sessionKey);
    
    if (!sessionExists) {
      throw new TokenError('Session has expired or is invalid');
    }
    
    // Get user
    const user = await getUser(payload.userId);
    
    // Check if user is active
    if (user.status !== 'active') {
      throw new ForbiddenError(`Account is ${user.status}`);
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
    
    // Extend session TTL
    await cache.expire(sessionKey, 86400); // 24 hours
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if not
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next();
    }
    
    const payload = verifyToken(token);
    const user = await getUser(payload.userId);
    
    if (user.status === 'active') {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      };
    }
    
    next();
  } catch (error) {
    // Fail silently for optional auth
    next();
  }
};

/**
 * Require specific user roles
 */
export const requireRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    if (!roles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${roles.join(', ')}`,
        { userRole: req.user.role, requiredRoles: roles }
      );
    }
    
    next();
  };
};

/**
 * Require admin role
 */
export const requireAdmin = requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

/**
 * Require super admin role
 */
export const requireSuperAdmin = requireRoles(UserRole.SUPER_ADMIN);

/**
 * Require email verification
 */
export const requireEmailVerified = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const user = await getUser(req.user.id);
    
    if (!user.emailVerified) {
      throw new ForbiddenError('Email verification required');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require organization membership
 */
export const requireOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const organizationId = req.params.organizationId || req.user.organizationId;
    
    if (!organizationId) {
      throw new ForbiddenError('Organization membership required');
    }
    
    // Check if user is member of organization
    const isMember = await db.exists(
      `
        SELECT 1 FROM organization_members
        WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL
      `,
      [req.user.id, organizationId]
    );
    
    if (!isMember) {
      throw new ForbiddenError('Not a member of this organization');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require specific organization roles
 */
export const requireOrganizationRoles = (...roles: OrganizationRole[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      const organizationId = req.params.organizationId || req.user.organizationId;
      
      if (!organizationId) {
        throw new ForbiddenError('Organization context required');
      }
      
      // Get user's role in organization
      const member = await db.one<{ role: OrganizationRole }>(
        `
          SELECT role FROM organization_members
          WHERE user_id = $1 AND organization_id = $2 AND deleted_at IS NULL
        `,
        [req.user.id, organizationId]
      );
      
      if (!member) {
        throw new ForbiddenError('Not a member of this organization');
      }
      
      if (!roles.includes(member.role)) {
        throw new PermissionError(
          `Insufficient organization permissions. Required: ${roles.join(', ')}`,
          { userRole: member.role, requiredRoles: roles }
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require organization owner or admin
 */
export const requireOrganizationAdmin = requireOrganizationRoles(
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN
);

/**
 * Check if user owns resource
 */
export const requireResourceOwnership = (
  resourceTable: string,
  resourceIdParam: string = 'id',
  ownerField: string = 'user_id'
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        throw new ForbiddenError('Resource ID required');
      }
      
      // Check ownership
      const isOwner = await db.exists(
        `
          SELECT 1 FROM ${resourceTable}
          WHERE id = $1 AND ${ownerField} = $2 AND deleted_at IS NULL
        `,
        [resourceId, req.user.id]
      );
      
      if (!isOwner) {
        throw new ForbiddenError('You do not own this resource');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limit by user ID
 */
export const userRateLimit = (
  maxRequests: number = 100,
  windowMs: number = 900000 // 15 minutes
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        return next();
      }
      
      const key = `user_ratelimit:${req.user.id}`;
      const { rateLimit } = await import('../config/redis.config');
      const result = await rateLimit.check(key, maxRequests, windowMs);
      
      if (!result.allowed) {
        throw new ForbiddenError(
          'User rate limit exceeded',
          { retryAfter: Math.ceil((result.reset - Date.now()) / 1000) }
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
