// Permission utility functions
interface Permissions {
  canViewReports: boolean;
  canManageInventory: boolean;
  canManageEmployees: boolean;
  canManageSettings: boolean;
}

export const hasPermission = (
  role: string,
  permissions: Permissions | undefined,
  requiredPermission: keyof Permissions,
): boolean => {
  // Owners have all permissions
  if (role === 'owner') return true;

  // Check specific permission
  return permissions?.[requiredPermission] || false;
};

export const canAccessFeature = (
  role: string,
  permissions: Permissions | undefined,
  feature: string,
): boolean => {
  // Owners have access to everything
  if (role === 'owner') return true;

  if (!permissions) return false;

  const featurePermissionMap: { [key: string]: boolean } = {
    // Dashboard & Reports
    dashboard: permissions.canViewReports,
    reports: permissions.canViewReports,

    // Products & Inventory
    products: permissions.canManageInventory,
    view_products: permissions.canManageInventory,
    create_product: permissions.canManageInventory,
    edit_product: permissions.canManageInventory,
    delete_product: permissions.canManageInventory,

    // Sales & POS
    pos: permissions.canManageInventory,
    sales: permissions.canViewReports,
    create_sale: permissions.canManageInventory,
    view_sales: permissions.canViewReports,
    refund_sale: permissions.canManageInventory,

    // Customers
    customers: permissions.canViewReports || permissions.canManageInventory,
    create_customer: permissions.canManageInventory,
    edit_customer: permissions.canManageInventory,
    delete_customer: permissions.canManageInventory,

    // Expenses
    expenses: permissions.canViewReports || permissions.canManageInventory,
    create_expense: permissions.canManageInventory,
    edit_expense: permissions.canManageInventory,
    delete_expense: permissions.canManageInventory,

    // Staff Management
    staff: permissions.canManageEmployees,
    create_staff: permissions.canManageEmployees,
    edit_staff: permissions.canManageEmployees,
    delete_staff: permissions.canManageEmployees,

    // Settings & Business
    settings: permissions.canManageSettings,
    business_settings: permissions.canManageSettings,
    subscription: permissions.canManageSettings,
  };

  return featurePermissionMap[feature] || false;
};

// Get role display name
export const getRoleDisplayName = (role: string): string => {
  const roleNames: { [key: string]: string } = {
    owner: 'Business Owner',
    manager: 'Manager',
    cashier: 'Cashier',
    inventory_clerk: 'Inventory Clerk',
    accountant: 'Accountant',
    custom: 'Custom Role',
  };

  return roleNames[role] || role;
};

// Get permission description
export const getPermissionDescription = (
  permission: keyof Permissions,
): string => {
  const descriptions: { [key in keyof Permissions]: string } = {
    canViewReports: 'View sales reports, dashboard, and analytics',
    canManageInventory: 'Manage products, sales, and inventory',
    canManageEmployees: 'Manage staff members and permissions',
    canManageSettings: 'Manage business settings and subscriptions',
  };

  return descriptions[permission];
};
