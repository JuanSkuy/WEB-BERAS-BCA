-- Migration: add `role` column to users table for admin functionality
-- Created: automated by assistant
-- Description: Adds role column to distinguish between regular users and admins

BEGIN;

-- Add role column if it doesn't exist (default 'user')
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Add check constraint to ensure role is either 'user' or 'admin'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_role'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (
      role IN ('user', 'admin')
    );
  END IF;
END
$$;

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'user' role if they don't have one
UPDATE users SET role = 'user' WHERE role IS NULL;

COMMIT;
