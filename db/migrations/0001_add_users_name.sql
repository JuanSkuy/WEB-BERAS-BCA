-- Migration: add `name` column to users table (idempotent)
-- Created: automated by assistant

BEGIN;

-- Add nullable `name` column if it doesn't exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name text;

-- Optional: populate `name` for existing rows from another source
-- UPDATE users SET name = '' WHERE name IS NULL;

COMMIT;
