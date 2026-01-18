// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import logger from '../utils/logger';

export interface AuthUser {
  id: number;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  businessId: number;
  business_id: number;
  businessName: string;
  business_name: string;
  role: 'owner' | 'manager' | 'employee';
  permissions: {
    canViewReports: boolean;
    canManageInventory: boolean;
    canManageEmployees: boolean;
    canManageSettings: boolean;
  };
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      apiVersion?: string;
    }
  }
}

// JWT token verification middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const secret = process.env.JWT_SECRET || 'your-default-secret-key';
    const decoded = jwt.verify(token, secret) as any;

    const userType = decoded.userType || 'user';

    // Handle staff member authentication
    if (userType === 'staff') {
      const [staff] = await pool.execute<any[]>(
        `SELECT 
          s.id, s.email, s.phone_number as phone, s.name,
          s.business_id, s.role, s.is_active,
          b.business_name,
          GROUP_CONCAT(sp.permission_name) as permissions
        FROM staff_members s
        JOIN businesses b ON s.business_id = b.id
        LEFT JOIN staff_permissions sp ON s.id = sp.staff_id AND sp.is_granted = TRUE
        WHERE s.id = ? AND s.is_active = TRUE
        GROUP BY s.id`,
        [decoded.userId],
      );

      if (staff.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Staff member not found or inactive',
          path: req.originalUrl,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const staffMember = staff[0];
      const nameParts = staffMember.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const permissionsArray = staffMember.permissions
        ? staffMember.permissions.split(',')
        : [];

      // Map individual permissions to grouped permission categories
      const permissionsObj = {
        canViewReports: permissionsArray.some((p: string) =>
          [
            'view_reports',
            'view_dashboard',
            'view_sales',
            'view_expenses',
            'view_customers',
          ].includes(p),
        ),
        canManageInventory: permissionsArray.some((p: string) =>
          [
            'create_product',
            'edit_product',
            'delete_product',
            'view_products',
            'adjust_stock',
            'create_sale',
            'edit_sale',
            'delete_sale',
            'refund_sale',
            'create_customer',
            'edit_customer',
            'delete_customer',
            'create_expense',
            'edit_expense',
            'delete_expense',
          ].includes(p),
        ),
        canManageEmployees: permissionsArray.includes('manage_staff'),
        canManageSettings: permissionsArray.some((p: string) =>
          ['manage_subscription', 'view_settings', 'manage_business'].includes(
            p,
          ),
        ),
      };

      req.user = {
        id: staffMember.id,
        phone: staffMember.phone,
        email: staffMember.email,
        firstName,
        lastName,
        businessId: staffMember.business_id,
        business_id: staffMember.business_id,
        businessName: staffMember.business_name,
        business_name: staffMember.business_name,
        role: staffMember.role,
        permissions: permissionsObj,
      };

      next();
      return;
    }

    // Handle regular user authentication
    const [users] = await pool.execute<any[]>(
      `SELECT 
        u.id, u.phone, u.email, u.first_name, u.last_name,
        b.id as business_id, b.business_name,
        be.role, be.permissions, be.is_active as employee_active
      FROM users u
      JOIN business_employees be ON u.id = be.user_id
      JOIN businesses b ON be.business_id = b.id
      WHERE u.id = ? AND u.is_active = TRUE AND be.is_active = TRUE`,
      [decoded.userId],
    );

    if (users.length === 0) {
      res.status(403).json({
        success: false,
        message: 'User not found or inactive',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const user = users[0];
    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      businessId: user.business_id,
      business_id: user.business_id,
      businessName: user.business_name,
      business_name: user.business_name,
      role: user.role,
      permissions: user.permissions
        ? JSON.parse(user.permissions)
        : {
            canViewReports: false,
            canManageInventory: false,
            canManageEmployees: false,
            canManageSettings: false,
          },
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({
        success: false,
        message: 'Invalid token',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(403).json({
        success: false,
        message: 'Token expired',
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (
  permission: keyof AuthUser['permissions'],
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!req.user.permissions[permission]) {
      res.status(403).json({
        success: false,
        message: `Permission required: ${permission}`,
      });
      return;
    }

    next();
  };
};

// Business ownership middleware
export const requireBusinessAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Check if user has access to the business
    const businessId =
      req.params.businessId || req.body.businessId || req.user.businessId;

    if (req.user.businessId !== parseInt(businessId)) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this business',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Business access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};

// Generate JWT token
export const generateToken = (userId: number, businessId: number): string => {
  const secret = process.env.JWT_SECRET || 'your-default-secret-key';
  return jwt.sign(
    {
      userId,
      businessId,
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
    { expiresIn: '7d' },
  );
};

// Refresh token validation
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
      return;
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as any;

    // Generate new access token
    const newToken = generateToken(decoded.userId, decoded.businessId);

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};
