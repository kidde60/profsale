-- Migration: Create password_resets table for password reset functionality
-- This table stores password reset codes/tokens with expiration

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reset_code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key to users table
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Index for faster lookups
  INDEX idx_user_id (user_id),
  INDEX idx_reset_code (reset_code),
  INDEX idx_expires_at (expires_at),
  
  -- Unique constraint to allow ON DUPLICATE KEY UPDATE
  UNIQUE KEY unique_user_active_reset (user_id, is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE password_resets COMMENT = 'Stores password reset codes/tokens for user password recovery';
