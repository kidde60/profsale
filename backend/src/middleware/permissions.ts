import { Request, Response, NextFunction } from 'express';

// Permission middleware - checks if user has specific permission or is owner
export const requirePermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // Business owners have all permissions
      if (user.role === 'owner') {
        next();
        return;
      }

      // Check if user has the required permission
      const userPermissions = user.permissions || {};

      // Map permission names to permission object keys
      const permissionMap: { [key: string]: string } = {
        // Sales
        create_sale: 'canManageInventory',
        view_sales: 'canViewReports',
        edit_sale: 'canManageInventory',
        delete_sale: 'canManageInventory',
        refund_sale: 'canManageInventory',

        // Products
        create_product: 'canManageInventory',
        view_products: 'canManageInventory',
        edit_product: 'canManageInventory',
        delete_product: 'canManageInventory',
        adjust_stock: 'canManageInventory',

        // Customers
        create_customer: 'canManageInventory',
        view_customers: 'canViewReports',
        edit_customer: 'canManageInventory',
        delete_customer: 'canManageInventory',

        // Expenses
        create_expense: 'canManageInventory',
        view_expenses: 'canViewReports',
        edit_expense: 'canManageInventory',
        delete_expense: 'canManageInventory',

        // Reports
        view_reports: 'canViewReports',
        view_dashboard: 'canViewReports',
        export_data: 'canViewReports',

        // Staff & Settings
        manage_staff: 'canManageEmployees',
        manage_subscription: 'canManageSettings',
        view_settings: 'canManageSettings',
        manage_business: 'canManageSettings',
      };

      const mappedPermission = permissionMap[permissionName];

      if (mappedPermission && userPermissions[mappedPermission]) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        message: `Permission denied. Required permission: ${permissionName}`,
      });
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
      });
    }
  };
};

// Check if user is owner or has manage_staff permission
export const requireOwnerOrManageStaff = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = (req as any).user;

    // Check if user role is 'owner' or has manage_staff permission
    if (user.role === 'owner' || user.permissions?.canManageEmployees) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message:
        'Only business owners or users with manage staff permission can perform this action',
    });
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};

// Require owner only (stricter - for sensitive operations)
export const requireOwner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userRole = (req as any).user.role;

    if (userRole !== 'owner') {
      res.status(403).json({
        success: false,
        message: 'Only business owners can perform this action',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Owner check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};
