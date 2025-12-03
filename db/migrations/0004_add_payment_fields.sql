-- Migration: Add payment fields to orders table
-- Date: 2024
-- Description: Adds payment-related columns to support payment gateway integration (Xendit, Doku, etc.)

-- Add payment columns for payment gateway integration
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_invoice_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_channel TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_expired_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status_date TIMESTAMPTZ;

-- Create index for payment invoice number for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_invoice ON orders(payment_invoice_number);

-- Add index for payment status
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Comments for documentation
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: xendit, doku, cod, etc.';
COMMENT ON COLUMN orders.payment_invoice_number IS 'External invoice number from payment gateway';
COMMENT ON COLUMN orders.payment_url IS 'Payment URL for redirecting user to payment page';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: PENDING, PAID, EXPIRED, FAILED, etc.';
COMMENT ON COLUMN orders.payment_channel IS 'Payment channel or gateway invoice ID';
COMMENT ON COLUMN orders.payment_code IS 'Payment code (for virtual account, etc.)';
COMMENT ON COLUMN orders.payment_expired_at IS 'Payment expiration date/time';
COMMENT ON COLUMN orders.payment_status_date IS 'Date/time when payment status was last updated';

