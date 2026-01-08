-- Migration: Add customer fields to sales table
-- Date: 2025-12-22

-- Add customer_name column after sale_number (if not exists)
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) AFTER sale_number;

-- Add customer_phone column after customer_name (if not exists)
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(15) AFTER customer_name;

-- Add amount_paid column after total_amount (if not exists)
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) DEFAULT 0.00 AFTER total_amount;

-- Add change_amount column after amount_paid (if not exists)
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS change_amount DECIMAL(12,2) DEFAULT 0.00 AFTER amount_paid;
