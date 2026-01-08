// Type definitions matching backend response structure

export interface User {
  id: number;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  businessId?: number;
  businessName?: string;
  role: string;
  permissions?: any;
  isVerified: boolean;
  isActive?: boolean;
  createdAt?: string;
  joinedAt?: string;
}

export interface Business {
  id: number;
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
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  business_id?: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_template: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  business_id: number;
  category_id?: number;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  cost_price?: number;
  buying_price?: number;
  selling_price: number;
  quantity_in_stock?: number;
  current_stock?: number;
  reorder_level?: number;
  min_stock_level?: number;
  unit_of_measure?: string;
  unit?: string;
  image_url?: string;
  product_image?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  category?: Category;
  category_name?: string;
  stock_status?: 'low' | 'out' | 'normal';
  profit_margin?: number;
}

export interface Customer {
  id: number;
  business_id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_purchases: number;
  total_orders: number;
  loyalty_points: number;
  customer_type: 'regular' | 'vip' | 'wholesale';
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  product?: Product;
}

export interface Sale {
  id: number;
  business_id: number;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  sale_number?: string;
  sale_date: string;
  subtotal?: number;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  amount_paid?: number;
  change_amount?: number;
  payment_method: 'cash' | 'mobile_money' | 'card' | 'credit';
  payment_status: 'paid' | 'pending' | 'refunded';
  status?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: SaleItem[];
  item_count?: number;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  todayRevenue: number;
  recentSales: Sale[];
  topProducts: Array<{
    product: Product;
    totalSold: number;
    revenue: number;
  }>;
}

export interface Expense {
  id: number;
  business_id: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegisterData {
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  businessType?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  business?: Business;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Cart types for POS
export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}
