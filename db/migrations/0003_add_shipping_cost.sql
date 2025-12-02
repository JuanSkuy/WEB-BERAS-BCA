-- Migration: add `shipping_cost_cents` column to orders table
-- Created: automated by assistant
-- Description: Adds shipping cost column to store shipping fees based on rice quantity

BEGIN;

-- Add shipping_cost_cents column if it doesn't exist (default 0)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cost_cents >= 0);

COMMIT;


