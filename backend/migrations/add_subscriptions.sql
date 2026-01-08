-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  max_products INT NOT NULL DEFAULT 50,
  trial_days INT NOT NULL DEFAULT 0,
  features JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business Subscriptions Table
CREATE TABLE IF NOT EXISTS business_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('trial', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'trial',
  trial_ends_at DATETIME,
  current_period_start DATETIME NOT NULL,
  current_period_end DATETIME NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  INDEX idx_business_id (business_id),
  INDEX idx_status (status),
  INDEX idx_period_end (current_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription Payments Table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  subscription_id INT NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'UGX',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'mobile_money',
  mobile_number VARCHAR(20),
  transaction_reference VARCHAR(255),
  status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES business_subscriptions(id),
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  INDEX idx_business_id (business_id),
  INDEX idx_status (status),
  INDEX idx_transaction_ref (transaction_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Subscription Plans
INSERT INTO subscription_plans (name, price, currency, billing_cycle, max_products, trial_days, features, is_active) VALUES
('Trial', 0, 'UGX', 'trial', 50, 60, JSON_OBJECT('max_users', 1, 'sales_history_days', 60, 'reports', false, 'expenses', false), TRUE),
('Basic', 5000, 'UGX', 'monthly', 50, 0, JSON_OBJECT('max_users', 3, 'sales_history_days', 365, 'reports', true, 'expenses', true), TRUE),
('Standard', 7500, 'UGX', 'monthly', 80, 0, JSON_OBJECT('max_users', 5, 'sales_history_days', 999999, 'reports', true, 'expenses', true), TRUE),
('Premium', 10000, 'UGX', 'monthly', 120, 0, JSON_OBJECT('max_users', 10, 'sales_history_days', 999999, 'reports', true, 'expenses', true), TRUE);
