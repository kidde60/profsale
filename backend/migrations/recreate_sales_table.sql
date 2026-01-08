-- Complete schema for sales table
-- This will drop and recreate the sales table with all necessary columns

-- Drop existing sales table (be careful - this will delete all data!)
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;

-- Create sales table with all columns
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    employee_id INT NOT NULL,
    customer_id INT NULL,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NULL,
    customer_phone VARCHAR(15) NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0.00,
    change_amount DECIMAL(12,2) DEFAULT 0.00,
    payment_method ENUM('cash', 'mobile_money', 'bank_transfer', 'credit', 'card') DEFAULT 'cash',
    payment_reference VARCHAR(100) NULL,
    status ENUM('pending', 'completed', 'cancelled', 'refunded') DEFAULT 'completed',
    notes TEXT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT NULL,
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
    INDEX idx_sales_number (sale_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sale_items table
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_barcode VARCHAR(100) NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    cost_price DECIMAL(12,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_sale_items_sale (sale_id),
    INDEX idx_sale_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
