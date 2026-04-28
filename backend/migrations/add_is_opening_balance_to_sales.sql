-- Add is_opening_balance column to sales table
-- This column marks sales that are historical opening balances (credit debt from before system implementation)

ALTER TABLE sales ADD COLUMN is_opening_balance BOOLEAN DEFAULT FALSE AFTER notes;
ALTER TABLE sales ADD COLUMN created_by INT NULL AFTER is_opening_balance;

-- Add index for filtering opening balances
CREATE INDEX idx_sales_opening_balance ON sales(is_opening_balance);
