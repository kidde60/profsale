import { Request } from 'express';
import { AuthUser } from '../middleware/auth';

// Base interfaces
export interface BaseEntity {
  id: number;
  created_at: Date;
  updated_at: Date;
}

// User interfaces
export interface User extends BaseEntity {
  phone: string;
  email?: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  profile_image?: string;
  is_verified: boolean;
  is_active: boolean;
  last_login?: Date;
}

export interface UserPermissions {
  can_view_reports?: boolean;
  can_manage_inventory?: boolean;
  can_manage_customers?: boolean;
  can_manage_employees?: boolean;
  can_manage_settings?: boolean;
  can_process_sales?: boolean;
  can_manage_expenses?: boolean;
}

export type UserRole = 'owner' | 'manager' | 'employee';

// Extended Request interface with user
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  apiVersion?: string;
}

// Business interfaces
export interface Business extends BaseEntity {
  owner_id: number;
  business_name: string;
  business_type?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  timezone: string;
  tax_rate: number;
  logo_url?: string;
  receipt_footer?: string;
  is_active: boolean;
}

export interface BusinessUser extends BaseEntity {
  business_id: number;
  user_id: number;
  role: UserRole;
  permissions?: UserPermissions;
  is_active: boolean;
  invited_at: Date;
  joined_at?: Date;
}

// Product interfaces
export interface Product extends BaseEntity {
  business_id: number;
  category_id?: number;
  name: string;
  description?: string;
  barcode?: string;
  buying_price: number;
  selling_price: number;
  current_stock: number;
  min_stock_level: number;
  max_stock_level?: number;
  unit: string;
  product_image?: string;
  tax_rate?: number;
  is_active: boolean;
  created_by: number;
  category_name?: string;
  stock_status?: 'normal' | 'low_stock' | 'out_of_stock';
  profit_margin?: number;
}

export interface Category extends BaseEntity {
  business_id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  stock_status?: 'low' | 'out' | 'normal';
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

// Customer interfaces
export interface Customer extends BaseEntity {
  business_id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_type: 'regular' | 'vip' | 'wholesale';
  total_purchases: number;
  total_orders: number;
  last_purchase_date?: Date;
  is_active: boolean;
}

// Sales interfaces
export interface Sale extends BaseEntity {
  business_id: number;
  employee_id: number;
  customer_id?: number;
  sale_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
  payment_reference?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  sale_date: Date;
  cancelled_at?: Date;
  cancellation_reason?: string;
  customer_name?: string;
  employee_name?: string;
  items?: SaleItem[];
}

export interface SaleItem extends BaseEntity {
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  discount_amount: number;
}

export interface CreateSaleRequest {
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
  }[];
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'credit';
  discount_amount?: number;
  tax_rate?: number;
  notes?: string;
}

// Expense interfaces
export interface Expense extends BaseEntity {
  business_id: number;
  description: string;
  amount: number;
  category: string;
  expense_date: Date;
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'cheque';
  payment_reference?: string;
  receipt_url?: string;
  notes?: string;
  created_by: number;
}

// Inventory interfaces
export interface InventoryMovement extends BaseEntity {
  business_id: number;
  product_id: number;
  movement_type:
    | 'sale'
    | 'purchase'
    | 'adjustment'
    | 'return'
    | 'damage'
    | 'transfer';
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  reference_id?: number;
  reference_type?: string;
  notes?: string;
  movement_date: Date;
  created_by: number;
}

// Subscription interfaces
export interface Subscription extends BaseEntity {
  business_id: number;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  started_at: Date;
  expires_at: Date;
  cancelled_at?: Date;
  auto_renew: boolean;
  payment_method?: string;
  last_payment_date?: Date;
  next_payment_date?: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  limits: {
    products?: number | null;
    sales_per_month?: number | null;
    employees?: number | null;
    storage_gb?: number | null;
  };
}

// Notification interfaces
export interface Notification extends BaseEntity {
  business_id: number;
  user_id?: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  read_at?: Date;
  expires_at?: Date;
}

// Sync interfaces
export interface SyncLog extends BaseEntity {
  business_id: number;
  user_id: number;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  local_id?: string;
  server_id?: number;
  data?: any;
  status: 'pending' | 'synced' | 'conflict' | 'failed';
  conflict_data?: any;
  error_message?: string;
  sync_timestamp: Date;
}

// Receipt interfaces
export interface ReceiptTemplate extends BaseEntity {
  business_id: number;
  template_name: string;
  header_text?: string;
  footer_text?: string;
  show_business_info: boolean;
  show_tax_info: boolean;
  show_barcode: boolean;
  custom_fields?: any;
  is_default: boolean;
  is_active: boolean;
}

// Dashboard interfaces
export interface DashboardData {
  today: {
    date: string;
    total_transactions: number;
    total_revenue: number;
    average_transaction: number;
    unique_customers: number;
    top_products: Array<{
      product_name: string;
      total_sold: number;
      revenue: number;
    }>;
    payment_methods: Array<{
      payment_method: string;
      transaction_count: number;
      total_amount: number;
      percentage: number;
    }>;
  };
  month: {
    start_date: string;
    total_transactions: number;
    total_revenue: number;
    total_profit: number;
  };
  inventory: {
    out_of_stock: number;
    low_stock: number;
    total_products: number;
  };
  customers: {
    total_customers: number;
    active_customers: number;
    vip_customers: number;
  };
  recent_sales: Sale[];
}

// Analytics interfaces
export interface BusinessInsights {
  period_days: number;
  insights: {
    overall_health: 'excellent' | 'good' | 'average' | 'poor';
    key_findings: string[];
    recommendations: string[];
    alerts: string[];
  };
  metrics: {
    revenue_growth_rate: number;
    inventory_health: {
      low_stock_count: number;
      out_of_stock_count: number;
      avg_stock_level: number;
      inventory_value: number;
    };
    customer_metrics: {
      active_customers: number;
      avg_customer_spend: number;
      avg_purchases_per_customer: number;
    };
  };
}

// Pagination interfaces
export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  path?: string;
  timestamp: string;
}

// Error interfaces
export interface ApiError extends Error {
  status?: number;
  field?: string;
  value?: any;
}

// Validation interfaces
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// File upload interfaces
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Query builder interfaces
export interface QueryFilters {
  [key: string]: any;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  include?: string[];
}

// Database interfaces
export interface DatabaseConnection {
  execute<T = any>(query: string, params?: any[]): Promise<[T, any]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

// Constants
export const STOCK_STATUS = {
  NORMAL: 'normal',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export const USER_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT: 'credit',
} as const;

export const SALE_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;
