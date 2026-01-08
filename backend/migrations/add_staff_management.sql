-- Add staff management and role-based permissions

-- Staff members table (users working for a business)
CREATE TABLE IF NOT EXISTS staff_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'manager', 'cashier', 'inventory_clerk', 'accountant', 'custom') DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT, -- user_id who created this staff
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_email_per_business (business_id, email),
  INDEX idx_phone (phone_number),
  INDEX idx_email (email)
);

-- Staff permissions table (granular permission control)
CREATE TABLE IF NOT EXISTS staff_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_staff_permission (staff_id, permission_name)
);

-- Activity logs table (audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  business_id INT NOT NULL,
  staff_id INT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50), -- 'sale', 'product', 'expense', 'customer'
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE SET NULL,
  INDEX idx_business_date (business_id, created_at),
  INDEX idx_staff (staff_id),
  INDEX idx_entity (entity_type, entity_id)
);

-- Add staff_id to existing tables for tracking who made changes
ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_by_staff_id INT;
ALTER TABLE sales ADD FOREIGN KEY (created_by_staff_id) REFERENCES staff_members(id) ON DELETE SET NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by_staff_id INT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by_staff_id INT;
ALTER TABLE products ADD FOREIGN KEY (created_by_staff_id) REFERENCES staff_members(id) ON DELETE SET NULL;
ALTER TABLE products ADD FOREIGN KEY (updated_by_staff_id) REFERENCES staff_members(id) ON DELETE SET NULL;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_by_staff_id INT;
ALTER TABLE expenses ADD FOREIGN KEY (created_by_staff_id) REFERENCES staff_members(id) ON DELETE SET NULL;

-- Available permissions list
-- POS & Sales
-- - create_sale: Make sales transactions
-- - view_sales: View sales history
-- - edit_sale: Edit/update sales
-- - delete_sale: Delete sales
-- - refund_sale: Process refunds

-- Products & Inventory
-- - create_product: Add new products
-- - view_products: View product list
-- - edit_product: Update product details
-- - delete_product: Remove products
-- - adjust_stock: Adjust stock levels

-- Customers
-- - create_customer: Add new customers
-- - view_customers: View customer list
-- - edit_customer: Update customer info
-- - delete_customer: Remove customers

-- Expenses
-- - create_expense: Add expenses
-- - view_expenses: View expense list
-- - edit_expense: Update expenses
-- - delete_expense: Remove expenses

-- Reports & Analytics
-- - view_reports: Access reports
-- - view_dashboard: Access dashboard
-- - export_data: Export data to CSV/PDF

-- Staff & Settings
-- - manage_staff: Add/edit/remove staff
-- - manage_subscription: Handle subscriptions
-- - view_settings: Access settings
-- - manage_business: Edit business details
