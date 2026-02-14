/**
 * Authentication Middleware
 * 
 * Middleware to verify JWT tokens from HttpOnly cookies and protect routes.
 * Includes role-based access control (RBAC) and organization membership checks.
 * Checks Redis token denylist for revoked tokens.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { HTTP_STATUS, ERROR_CODES } from '@validiant/shared';
import { prisma } from '../lib/prisma';
import { cache } from '../config/redis.config';

/**
 * Extend Express Request to include user
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
    organizationId?: string;
  };
}

/**
 * User roles enum (matches Prisma schema)
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * Organization roles enum
 */
export enum OrganizationRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

/**
 * Authenticate middleware
 * Verifies JWT token from HttpOnly cookie (preferred) or Authorization header (fallback)
 * Checks Redis denylist for revoked tokens
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | null = null;

    // First, try to get token from cookie (secure, HttpOnly)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback: check Authorization header for mobile/API clients
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      sendError(res, 'No token provided', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    // Check if token is in denylist (revoked after logout)
    const isDenied = await cache.exists(`token:denylist:${token}`);
    if (isDenied) {
      sendError(res, 'Token has been revoked', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    // Verify token
    const payload = verifyToken(token);

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    sendError(
      res,
      ERROR_CODES.TOKEN_INVALID,
      HTTP_STATUS.UNAUTHORIZED
    );
  }
};

/**
 * Optional authentication
 * Attaches user if token exists, but doesn't fail if missing
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | null = null;

    // Try cookie first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback to header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (token) {
      // Check denylist
      const isDenied = await cache.exists(`token:denylist:${token}`);
      if (!isDenied) {
        const payload = verifyToken(token);
        req.user = {
          userId: payload.userId,
          email: payload.email,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Require specific user roles
 */
export const requireRoles = (...roles: string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      // Fetch user with role
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });

      if (!user) {
        sendError(res, 'User not found', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      // Check if user has required role
      if (!roles.includes(user.role || '')) {
        sendError(
          res,
          `Access denied. Required roles: ${roles.join(', ')}`,
          HTTP_STATUS.FORBIDDEN
        );
        return;
      }

      // Attach role to request
      req.user.role = user.role || undefined;

      next();
    } catch (error) {
      next(error);
    }
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
 * Require organization membership
 */
export const requireOrganization = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const organizationId = req.params.organizationId || req.params.id;

    if (!organizationId) {
      sendError(res, 'Organization ID required', HTTP_STATUS.BAD_REQUEST);
      return;
    }

    // Check if user is member of organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user.userId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!membership) {
      sendError(res, 'Not a member of this organization', HTTP_STATUS.FORBIDDEN);
      return;
    }

    // Attach organization context to request
    req.user.organizationId = organizationId;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require specific organization roles
 */
export const requireOrganizationRoles = (...roles: string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const organizationId = req.params.organizationId || req.params.id;

      if (!organizationId) {
        sendError(res, 'Organization ID required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      // Get user's role in organization
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: req.user.userId,
          organizationId,
          deletedAt: null,
        },
        select: { role: true },
      });

      if (!membership) {
        sendError(res, 'Not a member of this organization', HTTP_STATUS.FORBIDDEN);
        return;
      }

      if (!roles.includes(membership.role)) {
        sendError(
          res,
          `Insufficient organization permissions. Required: ${roles.join(', ')}`,
          HTTP_STATUS.FORBIDDEN
        );
        return;
      }

      req.user.organizationId = organizationId;

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
  resourceModel: string,
  resourceIdParam: string = 'id'
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      const resourceId = req.params[resourceIdParam];

      if (!resourceId) {
        sendError(res, 'Resource ID required', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      // Check ownership using Prisma
      // Note: This is a simplified version. In production, you'd need to handle different models
      const resource = await (prisma as any)[resourceModel].findFirst({
        where: {
          id: resourceId,
          userId: req.user.userId,
          deletedAt: null,
        },
      });

      if (!resource) {
        sendError(res, 'You do not own this resource', HTTP_STATUS.FORBIDDEN);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
