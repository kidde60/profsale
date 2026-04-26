-- Prof Sale Database Schema
-- MySQL 8.0+ required

-- Set charset and collation
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_phone (phone),
    INDEX idx_users_email (email),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Businesses table
CREATE TABLE businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    description TEXT,
    phone VARCHAR(15),
    email VARCHAR(255),
    address TEXT,
    currency VARCHAR(3) DEFAULT 'UGX',
    timezone VARCHAR(50) DEFAULT 'Africa/Kampala',
    tax_rate DECIMAL(5,4) DEFAULT 0.1800,
    logo_url VARCHAR(255),
    receipt_footer TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_businesses_owner (owner_id),
    INDEX idx_businesses_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business employees/users relationship
CREATE TABLE business_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'manager', 'employee') NOT NULL DEFAULT 'employee',
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_business_user (business_id, user_id),
    INDEX idx_business_users_business (business_id),
    INDEX idx_business_users_user (user_id),
    INDEX idx_business_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_business (business_id),
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    barcode VARCHAR(100),
    buying_price DECIMAL(12,2) NOT NULL,
    selling_price DECIMAL(12,2) NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock_level DECIMAL(10,2) DEFAULT 5,
    max_stock_level DECIMAL(10,2) DEFAULT NULL,
    unit VARCHAR(20) DEFAULT 'pieces',
    product_image VARCHAR(255),
    tax_rate DECIMAL(5,4) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_products_business_active (business_id, is_active),
    INDEX idx_products_category (category_id),
    INDEX idx_products_barcode (barcode),
    INDEX idx_products_name (name),
    INDEX idx_products_stock_level (current_stock, min_stock_level),
    FULLTEXT idx_products_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(255),
    address TEXT,
    customer_type ENUM('regular', 'vip', 'wholesale') DEFAULT 'regular',
    total_purchases DECIMAL(12,2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    last_purchase_date TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_customers_business (business_id),
    INDEX idx_customers_phone (phone),
    INDEX idx_customers_email (email),
    INDEX idx_customers_type (customer_type),
    FULLTEXT idx_customers_search (name, phone, email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales table
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    employee_id INT NOT NULL,
    customer_id INT,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(15),
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    balance_due DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    change_amount DECIMAL(12,2) DEFAULT 0.00,
    payment_method ENUM('cash', 'credit') DEFAULT 'cash',
    payment_status ENUM('paid', 'partial', 'unpaid') DEFAULT 'paid',
    payment_reference VARCHAR(100),
    status ENUM('pending', 'completed', 'cancelled', 'refunded') DEFAULT 'completed',
    notes TEXT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_sales_business_date (business_id, sale_date),
    INDEX idx_sales_employee (employee_id),
    INDEX idx_sales_customer (customer_id),
    INDEX idx_sales_status (status),
    INDEX idx_sales_payment_method (payment_method),
    INDEX idx_sales_payment_status (payment_status),
    INDEX idx_sales_number (sale_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sale items table
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_barcode VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2),
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_sale_items_sale (sale_id),
    INDEX idx_sale_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refunds table (for tracking sale reversals)
CREATE TABLE refunds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    sale_id INT NOT NULL,
    refund_number VARCHAR(50) UNIQUE NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL,
    refund_reason TEXT,
    refund_method ENUM('cash', 'credit', 'store_credit') DEFAULT 'cash',
    refunded_by INT NOT NULL,
    refund_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (refunded_by) REFERENCES users(id),
    INDEX idx_refunds_business (business_id),
    INDEX idx_refunds_sale (sale_id),
    INDEX idx_refunds_date (refund_date),
    INDEX idx_refunds_number (refund_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses table
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method ENUM('cash', 'mobile_money', 'bank_transfer', 'cheque') DEFAULT 'cash',
    payment_reference VARCHAR(100),
    receipt_url VARCHAR(255),
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_expenses_business_date (business_id, expense_date),
    INDEX idx_expenses_category (category),
    INDEX idx_expenses_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory movements table
CREATE TABLE inventory_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    product_id INT NOT NULL,
    movement_type ENUM('sale', 'purchase', 'adjustment', 'return', 'damage', 'transfer') NOT NULL,
    quantity_change DECIMAL(10,2) NOT NULL,
    stock_before DECIMAL(10,2) NOT NULL,
    stock_after DECIMAL(10,2) NOT NULL,
    reference_id INT NULL,
    reference_type VARCHAR(50) NULL,
    notes TEXT,
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_inventory_movements_product_date (product_id, movement_date),
    INDEX idx_inventory_movements_business (business_id),
    INDEX idx_inventory_movements_type (movement_type),
    INDEX idx_inventory_movements_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions table
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'suspended') DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    cancelled_at TIMESTAMP NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method VARCHAR(50),
    last_payment_date TIMESTAMP NULL,
    next_payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_subscriptions_business (business_id),
    INDEX idx_subscriptions_status (status),
    INDEX idx_subscriptions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    user_id INT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_business_user (business_id, user_id),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sync logs table for offline support
CREATE TABLE sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    user_id INT NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    local_id VARCHAR(100),
    server_id INT,
    data JSON,
    status ENUM('pending', 'synced', 'conflict', 'failed') DEFAULT 'pending',
    conflict_data JSON,
    error_message TEXT,
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sync_logs_business_status (business_id, status),
    INDEX idx_sync_logs_user (user_id),
    INDEX idx_sync_logs_table (table_name),
    INDEX idx_sync_logs_timestamp (sync_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Receipt templates table
CREATE TABLE receipt_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    header_text TEXT,
    footer_text TEXT,
    show_business_info BOOLEAN DEFAULT TRUE,
    show_tax_info BOOLEAN DEFAULT TRUE,
    show_barcode BOOLEAN DEFAULT FALSE,
    custom_fields JSON,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_receipt_templates_business (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password resets table
CREATE TABLE password_resets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  reset_code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_reset (user_id),
  INDEX idx_reset_code (reset_code),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription plans table
CREATE TABLE subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_name VARCHAR(100) NOT NULL,
  plan_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UGX',
  billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
  trial_days INT DEFAULT 0,
  max_users INT DEFAULT 1,
  max_products INT DEFAULT 100,
  features JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_plan_code (plan_code),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, plan_code, description, price, currency, billing_cycle, trial_days, max_users, max_products, features, is_active) VALUES
('Free Trial', 'free_trial', 'Try ProfSale for free', 0.00, 'UGX', 'monthly', 60, -1, 50, '{"canViewReports": true, "canManageInventory": true, "canManageEmployees": false, "canManageSettings": false}', TRUE),
('Basic', 'basic', '50 items plan', 5000.00, 'UGX', 'monthly', 0, -1, 50, '{"canViewReports": true, "canManageInventory": true, "canManageEmployees": false, "canManageSettings": false}', TRUE),
('Standard', 'standard', '80 items plan', 7500.00, 'UGX', 'monthly', 0, -1, 80, '{"canViewReports": true, "canManageInventory": true, "canManageEmployees": true, "canManageSettings": true}', TRUE),
('Premium', 'premium', '120 items plan', 10000.00, 'UGX', 'monthly', 0, -1, 120, '{"canViewReports": true, "canManageInventory": true, "canManageEmployees": true, "canManageSettings": true, "canUseAPI": true}', TRUE),
('Enterprise', 'enterprise', '200 items plan', 15000.00, 'UGX', 'monthly', 0, -1, 200, '{"canViewReports": true, "canManageInventory": true, "canManageEmployees": true, "canManageSettings": true, "canUseAPI": true, "prioritySupport": true}', TRUE);

-- Business subscriptions table
CREATE TABLE business_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('trial', 'active', 'past_due', 'cancelled', 'expired') DEFAULT 'trial',
  trial_ends_at DATETIME,
  current_period_start DATETIME,
  current_period_end DATETIME,
  auto_renew BOOLEAN DEFAULT TRUE,
  cancelled_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_business_subscription (business_id),
  INDEX idx_business_id (business_id),
  INDEX idx_plan_id (plan_id),
  INDEX idx_status (status),
  INDEX idx_trial_ends_at (trial_ends_at),
  INDEX idx_current_period_end (current_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription payments table
CREATE TABLE subscription_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  subscription_id INT NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UGX',
  payment_method ENUM('mobile_money', 'card', 'bank_transfer', 'cash') DEFAULT 'mobile_money',
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  payment_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES business_subscriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  INDEX idx_business_id (business_id),
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff members table
CREATE TABLE staff_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  role ENUM('cashier', 'manager', 'admin') DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_business_id (business_id),
  INDEX idx_email (email),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff permissions table
CREATE TABLE staff_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT NOT NULL,
  permission_name VARCHAR(50) NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_staff_permission (staff_id, permission_name),
  INDEX idx_staff_id (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business settings table
CREATE TABLE business_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_business_setting (business_id, setting_key),
  INDEX idx_business_id (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment records table for tracking credit sale payments
CREATE TABLE payment_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  sale_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method ENUM('cash', 'mobile_money', 'card', 'bank_transfer') DEFAULT 'cash',
  recorded_by INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  INDEX idx_business_id (business_id),
  INDEX idx_sale_id (sale_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock records table for tracking stock changes (restocking, sales, adjustments)
CREATE TABLE stock_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity_change INT NOT NULL,
  previous_quantity INT NOT NULL,
  new_quantity INT NOT NULL,
  change_type ENUM('restock', 'sale', 'adjustment', 'return') NOT NULL,
  reason VARCHAR(255),
  performed_by INT NOT NULL,
  reference_id INT NULL COMMENT 'Reference to sale_id or other related record',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id),
  INDEX idx_business_id (business_id),
  INDEX idx_product_id (product_id),
  INDEX idx_change_type (change_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tax configurations table
CREATE TABLE tax_configurations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  tax_name VARCHAR(100) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  INDEX idx_business_id (business_id),
  INDEX idx_is_default (is_default),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sync devices table
CREATE TABLE sync_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  business_id INT NOT NULL,
  user_id INT,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  last_sync DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_device (device_id, business_id),
  INDEX idx_business_id (business_id),
  INDEX idx_last_sync (last_sync)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sync conflicts table
CREATE TABLE sync_conflicts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conflict_id VARCHAR(255) NOT NULL,
  business_id INT NOT NULL,
  user_id INT,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT,
  data JSON,
  resolution ENUM('pending', 'resolved', 'ignored') DEFAULT 'pending',
  resolved_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_business_id (business_id),
  INDEX idx_resolution (resolution),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity logs table
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  staff_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE SET NULL,
  INDEX idx_business_id (business_id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create triggers for automatic calculations

-- Trigger to update product stock after sale
DELIMITER $$
CREATE TRIGGER update_product_stock_after_sale
AFTER INSERT ON sale_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    
    -- Insert inventory movement record
    INSERT INTO inventory_movements (
        business_id, product_id, movement_type, quantity_change, 
        stock_before, stock_after, reference_id, reference_type, created_by
    )
    SELECT 
        p.business_id, NEW.product_id, 'sale', -NEW.quantity,
        p.current_stock + NEW.quantity, p.current_stock - NEW.quantity,
        (SELECT sale_id FROM sale_items WHERE id = NEW.id),
        'sale',
        (SELECT employee_id FROM sales WHERE id = (SELECT sale_id FROM sale_items WHERE id = NEW.id))
    FROM products p WHERE p.id = NEW.product_id;
END$$
DELIMITER ;

-- Trigger to update customer totals after sale
DELIMITER $$
CREATE TRIGGER update_customer_totals_after_sale
AFTER INSERT ON sales
FOR EACH ROW
BEGIN
    IF NEW.customer_id IS NOT NULL AND NEW.status = 'completed' THEN
        UPDATE customers 
        SET total_purchases = total_purchases + NEW.total_amount,
            total_orders = total_orders + 1,
            last_purchase_date = NEW.sale_date,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.customer_id;
    END IF;
END$$
DELIMITER ;

-- Insert default data
-- Note: Default categories and receipt templates require a business to exist first
-- These should be inserted after creating a business through the application

-- Insert default categories (requires business_id)
-- Uncomment after creating a business and replace with actual business_id
/*
INSERT INTO categories (business_id, name, description) VALUES 
(1, 'General', 'General products'),
(1, 'Food & Beverages', 'Food and drink items'),
(1, 'Electronics', 'Electronic devices and accessories'),
(1, 'Clothing', 'Clothing and fashion items'),
(1, 'Home & Garden', 'Home and garden supplies'),
(1, 'Health & Beauty', 'Health and beauty products');
*/

-- Insert default expense categories (these will be used as reference)
-- Note: These are just examples, actual implementation should be more flexible

-- Insert default receipt template (requires business_id)
-- Uncomment after creating a business and replace with actual business_id
/*
INSERT INTO receipt_templates (business_id, template_name, header_text, footer_text, is_default) VALUES
(1, 'Default Receipt', 'Thank you for your business!', 'Visit us again soon!', TRUE);
*/

-- Views for common queries

-- Product stock status view
CREATE VIEW product_stock_status AS
SELECT 
    p.id,
    p.business_id,
    p.name,
    p.current_stock,
    p.min_stock_level,
    CASE 
        WHEN p.current_stock <= 0 THEN 'out_of_stock'
        WHEN p.current_stock <= p.min_stock_level THEN 'low_stock'
        ELSE 'normal'
    END as stock_status,
    ROUND(((p.selling_price - p.buying_price) / p.buying_price) * 100, 2) as profit_margin
FROM products p
WHERE p.is_active = TRUE;

-- Daily sales summary view
CREATE VIEW daily_sales_summary AS
SELECT 
    business_id,
    DATE(sale_date) as sale_date,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_transaction_value,
    COUNT(DISTINCT customer_id) as unique_customers
FROM sales 
WHERE status = 'completed'
GROUP BY business_id, DATE(sale_date);

-- Monthly business metrics view
CREATE VIEW monthly_business_metrics AS
SELECT 
    s.business_id,
    YEAR(s.sale_date) as year,
    MONTH(s.sale_date) as month,
    COUNT(*) as total_sales,
    SUM(s.total_amount) as total_revenue,
    SUM(s.total_amount - s.tax_amount - s.discount_amount) as net_revenue,
    COUNT(DISTINCT s.customer_id) as unique_customers,
    AVG(s.total_amount) as avg_order_value
FROM sales s
WHERE s.status = 'completed'
GROUP BY s.business_id, YEAR(s.sale_date), MONTH(s.sale_date);