-- Migration: Add product_barcode and cost_price to sale_items table
-- Date: 2025-12-22

-- Add product_barcode column after product_name (if not exists)
ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS product_barcode VARCHAR(100) AFTER product_name;

-- Add cost_price column after total_price (if not exists)
ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12,2) DEFAULT 0.00 AFTER total_price;
