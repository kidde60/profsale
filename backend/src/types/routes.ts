// types/routes.ts
// Route-specific types to help with MySQL type issues

import { RowDataPacket, OkPacket } from 'mysql2';

// =====================
// DATABASE RESULT TYPES
// =====================

// Base database row type
export interface DbRow extends RowDataPacket {
  id: number;
  created_at: Date;
  updated_at: Date;
}

// User database result
export interface UserRow extends DbRow {
  phone: string;
  email?: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  profile_image?: string;
  is_verified: boolean;
  is_active: boolean;
}

// Business database result
export interface BusinessRow extends DbRow {
  owner_id: number;
  business_name: string;
  business_type?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  timezone: string;
  logo_url?: string;
  is_active: boolean;
}

// Employee database result
export interface EmployeeRow extends DbRow {
  business_id: number;
  user_id: number;
  role: 'owner' | 'manager' | 'employee';
  permissions?: string;
  is_active: boolean;
  joined_at: Date;
  // Joined fields from users table
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  profile_image?: string;
}

// Product database result
export interface ProductRow extends DbRow {
  business_id: number;
  category_id?: number;
  name: string;
  description?: string;
  barcode?: string;
  buying_price: number;
  selling_price: number;
  current_stock: number;
  min_stock_level: number;
  unit: string;
  product_image?: string;
  is_active: boolean;
  created_by: number;
  // Joined fields
  category_name?: string;
  stock_status?: string;
  profit_margin?: number;
}

// Category database result
export interface CategoryRow extends DbRow {
  business_id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_template: boolean;
  is_active: boolean;
  // Computed fields
  product_count?: number;
}

// Customer database result
export interface CustomerRow extends DbRow {
  business_id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_purchases: number;
  total_orders: number;
  loyalty_points: number;
  customer_type: 'regular' | 'vip' | 'wholesale';
  last_purchase_date?: Date;
  // Computed fields
  days_since_last_purchase?: number;
}

// Sale database result
export interface SaleRow extends DbRow {
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
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  employee_name?: string;
}

// Sale item database result
export interface SaleItemRow extends DbRow {
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  cost_price: number;
  profit_amount: number;
}

// Expense database result
export interface ExpenseRow extends DbRow {
  business_id: number;
  recorded_by: number;
  description: string;
  amount: number;
  category: string;
  expense_date: Date;
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'cheque';
  payment_reference?: string;
  receipt_image?: string;
  // Joined fields
  recorder_name?: string;
}

// Inventory movement database result
export interface InventoryMovementRow extends DbRow {
  business_id: number;
  product_id: number;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return';
  quantity_change: number;
  reference_id?: number;
  reference_type?: string;
  notes?: string;
  recorded_by: number;
  movement_date: Date;
  // Joined fields
  product_name?: string;
  recorder_name?: string;
}

// System setting database result
export interface SystemSettingRow extends DbRow {
  business_id: number;
  setting_key: string;
  setting_value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  updated_by: number;
}

// =====================
// COMMON QUERY RESULT TYPES
// =====================

// Count result
export interface CountResult extends RowDataPacket {
  count: number;
}

// Sum result
export interface SumResult extends RowDataPacket {
  total: number;
}

// Statistics result
export interface StatsResult extends RowDataPacket {
  total_count: number;
  total_amount: number;
  average_amount: number;
}

// Dashboard stats result
export interface DashboardStatsRow extends RowDataPacket {
  total_products: number;
  total_customers: number;
  total_employees: number;
  total_sales: number;
  total_revenue: number;
  total_categories: number;
}

// Sales summary result
export interface SalesSummaryRow extends RowDataPacket {
  total_transactions: number;
  total_revenue: number;
  average_transaction: number;
  unique_customers: number;
  cash_sales: number;
  mobile_money_sales: number;
  bank_transfer_sales: number;
  credit_sales: number;
}

// Product performance result
export interface ProductPerformanceRow extends RowDataPacket {
  product_name: string;
  total_sold: number;
  revenue: number;
  profit?: number;
  sales_count?: number;
  units_sold?: number;
}

// Customer stats result
export interface CustomerStatsRow extends RowDataPacket {
  total_customers: number;
  active_customers: number;
  vip_customers: number;
  active_last_30_days: number;
}

// Low stock product result
export interface LowStockProductRow extends RowDataPacket {
  id: number;
  name: string;
  current_stock: number;
  min_stock_level: number;
  category_name?: string;
  stock_percentage?: number;
  reorder_value?: number;
  days_since_last_restock?: number;
}

// =====================
// HELPER TYPES FOR ROUTES
// =====================

// Generic database query result
export type QueryResult<T extends RowDataPacket> = [T[], any];

// Insert result
export type InsertResult = [OkPacket, any];

// Update result
export type UpdateResult = [OkPacket, any];

// Delete result
export type DeleteResult = [OkPacket, any];

// =====================
// TYPE CONVERSION HELPERS
// =====================

// Convert database row to API response type
export const toApiUser = (row: UserRow) => ({
  id: row.id,
  phone: row.phone,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  profileImage: row.profile_image,
  isVerified: row.is_verified,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toApiBusiness = (row: BusinessRow) => ({
  id: row.id,
  ownerId: row.owner_id,
  businessName: row.business_name,
  businessType: row.business_type,
  description: row.description,
  phone: row.phone,
  email: row.email,
  address: row.address,
  currency: row.currency,
  timezone: row.timezone,
  logoUrl: row.logo_url,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toApiProduct = (row: ProductRow) => ({
  id: row.id,
  businessId: row.business_id,
  categoryId: row.category_id,
  name: row.name,
  description: row.description,
  barcode: row.barcode,
  buyingPrice: row.buying_price,
  sellingPrice: row.selling_price,
  currentStock: row.current_stock,
  minStockLevel: row.min_stock_level,
  unit: row.unit,
  productImage: row.product_image,
  isActive: row.is_active,
  createdBy: row.created_by,
  categoryName: row.category_name,
  stockStatus: row.stock_status,
  profitMargin: row.profit_margin,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toApiCustomer = (row: CustomerRow) => ({
  id: row.id,
  businessId: row.business_id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  totalPurchases: row.total_purchases,
  totalOrders: row.total_orders,
  loyaltyPoints: row.loyalty_points,
  customerType: row.customer_type,
  lastPurchaseDate: row.last_purchase_date,
  daysSinceLastPurchase: row.days_since_last_purchase,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toApiSale = (row: SaleRow) => ({
  id: row.id,
  businessId: row.business_id,
  employeeId: row.employee_id,
  customerId: row.customer_id,
  saleNumber: row.sale_number,
  subtotal: row.subtotal,
  taxAmount: row.tax_amount,
  discountAmount: row.discount_amount,
  totalAmount: row.total_amount,
  paymentMethod: row.payment_method,
  paymentReference: row.payment_reference,
  status: row.status,
  notes: row.notes,
  saleDate: row.sale_date,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  employeeName: row.employee_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toApiExpense = (row: ExpenseRow) => ({
  id: row.id,
  businessId: row.business_id,
  recordedBy: row.recorded_by,
  description: row.description,
  amount: row.amount,
  category: row.category,
  expenseDate: row.expense_date,
  paymentMethod: row.payment_method,
  paymentReference: row.payment_reference,
  receiptImage: row.receipt_image,
  recorderName: row.recorder_name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// =====================
// EXPORT ALL TYPES
// =====================

export default {
  toApiUser,
  toApiBusiness,
  toApiProduct,
  toApiCustomer,
  toApiSale,
  toApiExpense,
};
